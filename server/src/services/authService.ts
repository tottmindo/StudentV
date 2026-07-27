
/**
 * Authentication service for user management.
 * @module authService
 */

/**
 * Registers a new user in the system.
 * @param address - The address of the dorm
 * @param username - The username for the new account
 * @param password - The password for the new account
 * @throws {Error} If user already exists or if there's a database error
 * @returns {Promise<{dormID: number}>} The ID of the newly created dorm
 */

/**
 * Authenticates a user and generates a JWT token.
 * @param username - The username of the account
 * @param password - The password of the account
 * @throws {Error} If username/password combination is invalid
 * @returns {Promise<{message: string, token: string, dormID: number, userID: number, role: string}>} Login success message, JWT token, dorm ID, user ID, and user role
 */
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import "../config/env.js";
import pool from "../db.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import type { StringValue } from "ms";
import { getJwtSecret } from "../config/jwt.js";
import { createHash, randomBytes } from "crypto";
import { sendPasswordResetEmail, sendTemporaryPasswordEmail } from "./emailService.js";

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "1h";

export async function registerUser(
  roomID: number,
  dormID: number,
  role: string,
  email: string,
  password: string,
  replaceExisting: boolean = false,
  mustChangePassword: boolean = false,
  beforeCommit?: () => Promise<void>
) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const [rows]: [RowDataPacket[], any] = await connection.query(
      "SELECT userID FROM users WHERE email = ?",
      [email]
    );

    if (rows.length > 0) {
      throw new Error("User already exists.");
    }

    const [roomRows]: [RowDataPacket[], any] = await connection.query(
      "SELECT roomID FROM room WHERE roomID = ? AND dormID = ?",
      [roomID, dormID]
    );

    if (roomRows.length === 0) {
      throw new Error("Room does not exist.");
    }

    const [activeRows]: [RowDataPacket[], any] = await connection.query(
      `SELECT userID, username, email, role, roomID, dormID
       FROM users
       WHERE roomID = ?
         AND dormID = ?
         AND active = TRUE
       ORDER BY userID ASC`,
      [roomID, dormID]
    );

    if (activeRows.length > 0 && !replaceExisting) {
      const err: any = new Error("Room already has an active user.");
      err.code = "ROOM_OCCUPIED";
      err.existingUser = activeRows[0];
      throw err;
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    if (activeRows.length > 0) {
      await connection.query(
        `UPDATE users
         SET active = FALSE
         WHERE roomID = ?
           AND dormID = ?
           AND active = TRUE`,
        [roomID, dormID]
      );
    }

    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO users (email, username, passwordHash, role, roomID, dormID, active, mustChangePassword)
       VALUES (?, NULL, ?, ?, ?, ?, TRUE, ?)`,
      [email, hashedPassword, role, roomID, dormID, mustChangePassword]
    );

    const newUserID = result.insertId;

    if (activeRows.length > 0) {
      const previousUserIDs = activeRows.map(row => row.userID);
      await connection.query(
        `UPDATE cleaningWeeks
         SET assignedUserID = ?
         WHERE assignedUserID IN (?)
           AND endDate >= CURDATE()`,
        [newUserID, previousUserIDs]
      );
      await connection.query(
        `UPDATE cleaningAssignments ca
         INNER JOIN cleaningWeeks cw ON cw.weekID = ca.weekID
         SET ca.assignedUserID = ?
         WHERE ca.assignedUserID IN (?)
           AND cw.endDate >= CURDATE()`,
        [newUserID, previousUserIDs]
      );
    }

    if (beforeCommit) {
      await beforeCommit();
    }

    await connection.commit();

    return {
      message: activeRows.length > 0 ? "User replaced successfully" : "User created successfully",
      userID: newUserID,
      dormID,
      roomID,
      replacedUser: activeRows[0] ?? null,
    };
  } catch (error) {
    await connection.rollback();
    if ((error as any)?.code !== "ROOM_OCCUPIED") {
      console.error("Transaction rolled back:", error);
    }
    throw error;
  } finally {
    connection.release();
  }
}

export function generateTemporaryPassword() {
  // 16 URL-safe characters with upper/lowercase, digits and symbols.
  return `${randomBytes(9).toString("base64url")}Aa1!`;
}

export async function completeTemporaryPassword(userID: number, username: string, newPassword: string) {
  const [rows]: [RowDataPacket[], any] = await pool.query(
    "SELECT mustChangePassword FROM users WHERE userID = ? AND active = TRUE",
    [userID]
  );
  if (!rows[0]?.mustChangePassword) {
    throw new Error("This account does not have a temporary password.");
  }
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  try {
    await pool.query(
      "UPDATE users SET username = ?, passwordHash = ?, mustChangePassword = FALSE WHERE userID = ?",
      [username, passwordHash, userID]
    );
  } catch (error: any) {
    if (error?.code === "ER_DUP_ENTRY") throw new Error("That username is already in use.");
    throw error;
  }
}

export async function getAccount(userID: number) {
  const [rows]: [RowDataPacket[], any] = await pool.query(
    "SELECT email, username, role, roomID, dormID FROM users WHERE userID = ? AND active = TRUE",
    [userID]
  );
  if (!rows[0]) throw new Error("Account not found.");
  return rows[0];
}

export async function updateUsername(userID: number, username: string) {
  try {
    const [result] = await pool.query<ResultSetHeader>(
      "UPDATE users SET username = ? WHERE userID = ? AND active = TRUE",
      [username, userID]
    );
    if (!result.affectedRows) throw new Error("Account not found.");
    return getAccount(userID);
  } catch (error: any) {
    if (error?.code === "ER_DUP_ENTRY") throw new Error("That username is already in use.");
    throw error;
  }
}

export async function adminResetResidentPassword(adminDormID: number, email: string) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const [rows]: [RowDataPacket[], any] = await connection.query(
      `SELECT userID, email FROM users
       WHERE email = ? AND dormID = ? AND role = 'STUDENT' AND active = TRUE
       FOR UPDATE`,
      [email, adminDormID]
    );
    if (!rows[0]) throw new Error("Active resident account not found in your dorm.");

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, SALT_ROUNDS);
    await sendTemporaryPasswordEmail(rows[0].email, temporaryPassword);
    await connection.query(
      "UPDATE users SET passwordHash = ?, mustChangePassword = TRUE, credentialVersion = credentialVersion + 1 WHERE userID = ?",
      [passwordHash, rows[0].userID]
    );
    await connection.query(
      "UPDATE passwordResetTokens SET usedAt = NOW() WHERE userID = ? AND usedAt IS NULL",
      [rows[0].userID]
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

const hashResetToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function requestPasswordReset(email: string) {
  const [rows]: [RowDataPacket[], any] = await pool.query(
    "SELECT userID, email FROM users WHERE email = ? AND active = TRUE LIMIT 1",
    [email]
  );
  const user = rows[0];
  if (!user) return;

  const [recent]: [RowDataPacket[], any] = await pool.query(
    `SELECT tokenID FROM passwordResetTokens
     WHERE userID = ? AND createdAt > DATE_SUB(NOW(), INTERVAL 5 MINUTE) LIMIT 1`,
    [user.userID]
  );
  if (recent.length > 0) return;

  const token = randomBytes(32).toString("base64url");
  await pool.query(
    `INSERT INTO passwordResetTokens (userID, tokenHash, expiresAt)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))`,
    [user.userID, hashResetToken(token)]
  );
  try {
    await sendPasswordResetEmail(user.email, token);
  } catch (error) {
    await pool.query("DELETE FROM passwordResetTokens WHERE tokenHash = ?", [hashResetToken(token)]);
    throw error;
  }
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const [rows]: [RowDataPacket[], any] = await connection.query(
      `SELECT tokenID, userID FROM passwordResetTokens
       WHERE tokenHash = ? AND usedAt IS NULL AND expiresAt > NOW() FOR UPDATE`,
      [hashResetToken(token)]
    );
    if (!rows[0]) throw new Error("This reset link is invalid or has expired.");

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await connection.query(
      "UPDATE users SET passwordHash = ?, mustChangePassword = FALSE, credentialVersion = credentialVersion + 1 WHERE userID = ? AND active = TRUE",
      [passwordHash, rows[0].userID]
    );
    await connection.query(
      "UPDATE passwordResetTokens SET usedAt = NOW() WHERE userID = ? AND usedAt IS NULL",
      [rows[0].userID]
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function loginUser(email: string, password: string) {
  const [rows]: [RowDataPacket[], any] = await pool.query(
    "SELECT * FROM users WHERE email = ? AND active = TRUE",
    [email]
  );

  const user = rows[0];
  

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    throw new Error("Invalid email or password.");
  }

  const payload = {
    dormID: user.dormID,
    userID: user.userID,
    role: user.role,
    email: user.email,
    username: user.username,
    credentialVersion: user.credentialVersion,
  };

  const options: SignOptions = {
    expiresIn: JWT_EXPIRATION as StringValue,
  };

  const token = jwt.sign(payload, getJwtSecret(), options);

  return {
    message: "Login successful",
    token,
    dormID: user.dormID,
    userID: user.userID,
    role: user.role,
    email: user.email,
    username: user.username,
    mustChangePassword: Boolean(user.mustChangePassword),
  };
}
