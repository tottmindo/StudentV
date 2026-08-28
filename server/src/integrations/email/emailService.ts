import nodemailer, { type Transporter } from "nodemailer";
import type SMTPPool from "nodemailer/lib/smtp-pool/index.js";
import { isIP } from "node:net";
import { resolve4 } from "node:dns/promises";

type MailTransport = Transporter<SMTPPool.SentMessageInfo, SMTPPool.Options>;
let transportPromise: Promise<MailTransport> | null = null;

function positiveIntegerEnv(name: string, fallback: number) {
  const value = Number(process.env[name] ?? fallback);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

async function createSmtpTransport(): Promise<MailTransport> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass || !process.env.EMAIL_FROM) {
    throw new Error("Email delivery is not configured.");
  }

  // Some hosting environments have IPv4 egress only. Resolving the SMTP host
  // ourselves prevents Node from selecting an unreachable AAAA record. Keep
  // the original hostname as the TLS server name so certificate validation and
  // SNI continue to work when connecting to the resolved address.
  const preferIpv4 = process.env.SMTP_PREFER_IPV4 !== "false";
  const resolvedHost = preferIpv4 && !isIP(host) ? (await resolve4(host))[0] : host;
  if (!resolvedHost) {
    throw new Error(`No IPv4 address was found for SMTP host ${host}.`);
  }

  return nodemailer.createTransport({
    pool: true,
    host: resolvedHost,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user, pass },
    tls: isIP(host) ? undefined : { servername: host },
    maxConnections: positiveIntegerEnv("SMTP_MAX_CONNECTIONS", 2),
    maxMessages: positiveIntegerEnv("SMTP_MAX_MESSAGES", 100),
    rateDelta: 1_000,
    rateLimit: positiveIntegerEnv("SMTP_RATE_LIMIT", 4),
    connectionTimeout: positiveIntegerEnv("SMTP_CONNECTION_TIMEOUT_MS", 30_000),
    greetingTimeout: positiveIntegerEnv("SMTP_GREETING_TIMEOUT_MS", 30_000),
    socketTimeout: positiveIntegerEnv("SMTP_SOCKET_TIMEOUT_MS", 60_000),
  });
}

function smtpTransport(): Promise<MailTransport> {
  if (!transportPromise) {
    // Cache both DNS resolution and the pooled transporter. If setup itself
    // fails, clear the cache so a later request can recover from a transient
    // DNS/configuration problem.
    transportPromise = createSmtpTransport().catch(error => {
      transportPromise = null;
      throw error;
    });
  }
  return transportPromise;
}

export async function sendResidentWelcomeEmail(
  email: string,
  roomID: number | null,
  temporaryPassword: string
) {
  const appUrl = process.env.APP_URL || "http://localhost:5173";
  await (await smtpTransport()).sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Your DORMS account",
    text: [
      "Welcome to DORMS!",
      "",
      roomID == null ? "Your administrator account is ready." : `Your account for room ${roomID} is ready.`,
      `Email: ${email}`,
      `Temporary password: ${temporaryPassword}`,
      "",
      `Sign in at ${appUrl}`,
      "You will be asked to choose a new password when you first sign in.",
    ].join("\n"),
  });
}

export async function sendTemporaryPasswordEmail(email: string, temporaryPassword: string) {
  const appUrl = process.env.APP_URL || "http://localhost:5173";
  await (await smtpTransport()).sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Your DORMS password was reset",
    text: [
      "An administrator reset your DORMS password.",
      "",
      `Temporary password: ${temporaryPassword}`,
      `Sign in at ${appUrl}`,
      "You will be asked to choose a new password after signing in.",
      "",
      "If you did not expect this, contact your residence administrator.",
    ].join("\n"),
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const appUrl = (process.env.APP_URL || "http://localhost:5173").replace(/\/$/, "");
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;
  await (await smtpTransport()).sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Reset your DORMS password",
    text: [
      "A password reset was requested for your DORMS account.",
      "",
      `Reset your password: ${resetUrl}`,
      "This single-use link expires in 30 minutes.",
      "",
      "If you did not request this, you can ignore this email. Your current password still works.",
    ].join("\n"),
  });
}
