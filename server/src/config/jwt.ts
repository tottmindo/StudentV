const DEV_JWT_SECRET = "studentv-development-secret";

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production.");
  }

  console.warn("⚠️ JWT_SECRET is not set; using a development fallback secret.");
  return DEV_JWT_SECRET;
}
