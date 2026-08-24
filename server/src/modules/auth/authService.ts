
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
import "../../config/env.js";
import pool from "../../database/pool.js";
import type { StringValue } from "ms";
import { getJwtSecret } from "../../config/jwt.js";
import { createHash, randomBytes } from "crypto";
import { sendPasswordResetEmail, sendTemporaryPasswordEmail } from "../../integrations/email/emailService.js";
import { getIO } from "../../infrastructure/socketManager.js";
import { syncDormGeneralChat } from "../chat/chatService.js";

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "1h";
const RESIDENT_DEACTIVATION_DELAY_DAYS = positiveIntegerEnv("RESIDENT_DEACTIVATION_DELAY_DAYS", 30);
type RowDataPacket = Record<string, any>;
type ResultSetHeader = { affectedRows: number; insertId?: number };

function positiveIntegerEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw.trim() === "") return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer`);
  return value;
}

function residentDeactivationDeadline(now: Date = new Date()): Date {
  return new Date(now.getTime() + RESIDENT_DEACTIVATION_DELAY_DAYS * 24 * 60 * 60 * 1000);
}

export async function registerUser(
  roomID: number | null,
  dormID: number | null,
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
    const isGlobalRole = role === "ADMIN" || role === "RESEARCHER";
    const assignedRoomID = isGlobalRole ? null : roomID;
    const assignedDormID = isGlobalRole ? null : dormID;
    if (!isGlobalRole && (assignedRoomID == null || assignedDormID == null)) {
      throw new Error("Students must be assigned to a dorm and room.");
    }
    const [rows]: [RowDataPacket[], any] = await connection.query(
      "SELECT userID FROM users WHERE email = ?",
      [email]
    );

    if (rows.length > 0) {
      throw new Error("User already exists.");
    }

    if (assignedRoomID != null) {
      const [roomRows]: [RowDataPacket[], any] = await connection.query(
        "SELECT roomID FROM room WHERE roomID = ? AND dormID = ?",
        [assignedRoomID, assignedDormID]
      );
      if (roomRows.length === 0) throw new Error("Room does not exist.");
    }

    let activeRows: RowDataPacket[] = [];
    if (assignedRoomID != null) {
      [activeRows] = await connection.query(
        `SELECT userID, username, email, role, roomID, dormID
         FROM users
         WHERE roomID = ?
           AND dormID = ?
           AND active = TRUE
           AND scheduledDeactivationAt IS NULL
         ORDER BY userID ASC`,
        [assignedRoomID, assignedDormID]
      );
    }

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
         SET scheduledDeactivationAt = ?
         WHERE roomID = ?
           AND dormID = ?
           AND active = TRUE
           AND scheduledDeactivationAt IS NULL`,
        [residentDeactivationDeadline(), assignedRoomID, assignedDormID]
      );
    }

    const [insertedUsers]: [RowDataPacket[], any] = await connection.query(
      `INSERT INTO users (email, username, passwordHash, role, roomID, dormID, active, mustChangePassword)
       VALUES (?, NULL, ?, ?, ?, ?, TRUE, ?) RETURNING userID`,
      [email, hashedPassword, role, assignedRoomID, assignedDormID, mustChangePassword]
    );

    const newUserID = insertedUsers[0]?.userID;
    if (typeof newUserID !== "number") {
      throw new Error("Failed to retrieve the newly created user ID.");
    }

    if (assignedDormID != null) {
      const [dormRows]: [RowDataPacket[], any] = await connection.query(
        "SELECT address, floor FROM dorms WHERE dormID = ?", [assignedDormID]
      );
      await syncDormGeneralChat(connection, assignedDormID, dormRows[0].address, dormRows[0].floor);
    }

    if (activeRows.length > 0) {
      const previousUserIDs = activeRows.map(row => row.userID);
      await connection.query(
        `UPDATE cleaningWeeks
         SET assignedUserID = ?
         WHERE assignedUserID IN (?)
           AND endDate >= CURRENT_DATE`,
        [newUserID, previousUserIDs]
      );
      await connection.query(
        `UPDATE cleaningAssignments ca
         SET assignedUserID = ?
         FROM cleaningWeeks cw
         WHERE cw.weekID = ca.weekID
           AND ca.assignedUserID IN (?)
           AND cw.endDate >= CURRENT_DATE`,
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
      dormID: assignedDormID,
      roomID: assignedRoomID,
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
  // Ten easy-to-type characters. Ambiguous characters (0/O, 1/l/I) are
  // excluded; the password remains random and is valid for one login only.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  return Array.from(randomBytes(10), byte => alphabet[byte % alphabet.length]).join("");
}

function disconnectUser(userID: number) {
  try {
    getIO().in(`user-${userID}`).disconnectSockets(true);
  } catch {
    // Socket.IO is not initialized in service-level tests or maintenance jobs.
  }
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
    if (error?.code === "23505") throw new Error("That username is already in use.");
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
    const [result]: any = await pool.query(
      "UPDATE users SET username = ? WHERE userID = ? AND active = TRUE",
      [username, userID]
    );
    if (!result.affectedRows) throw new Error("Account not found.");
    return getAccount(userID);
  } catch (error: any) {
    if (error?.code === "23505") throw new Error("That username is already in use.");
    throw error;
  }
}

export async function updatePassword(userID: number, currentPassword: string, newPassword: string) {
  const [rows]: [RowDataPacket[], any] = await pool.query(
    "SELECT passwordHash FROM users WHERE userID = ? AND active = TRUE",
    [userID]
  );
  if (!rows[0]) throw new Error("Account not found.");

  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, rows[0].passwordHash);
  if (!isCurrentPasswordValid) throw new Error("The current password is incorrect.");

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await pool.query(
    `UPDATE users
     SET passwordHash = ?, credentialVersion = credentialVersion + 1
     WHERE userID = ? AND active = TRUE`,
    [passwordHash, userID]
  );
  disconnectUser(userID);
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
    disconnectUser(rows[0].userID);
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
     WHERE userID = ? AND createdAt > NOW() - INTERVAL '5 minutes' LIMIT 1`,
    [user.userID]
  );
  if (recent.length > 0) return;

  const token = randomBytes(32).toString("base64url");
  await pool.query(
    `INSERT INTO passwordResetTokens (userID, tokenHash, expiresAt)
     VALUES (?, ?, NOW() + INTERVAL '30 minutes')`,
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
    disconnectUser(rows[0].userID);
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

export async function listDormsForAdmin() {
  const [rows]: [RowDataPacket[], any] = await pool.query(
    `SELECT d.dormID, d.floor, d.address, r.roomID
     FROM dorms d
     LEFT JOIN room r ON r.dormID = d.dormID
     ORDER BY d.dormID, r.roomID`
  );
  const dorms = new Map<number, { dormID: number; address: string; floor: number; rooms: number[] }>();
  for (const row of rows) {
    const dorm: { dormID: number; address: string; floor: number; rooms: number[] } = dorms.get(row.dormID) ?? {
      dormID: row.dormID,
      address: row.address,
      floor: row.floor,
      rooms: [],
    };
    if (row.roomID != null) dorm.rooms.push(row.roomID);
    dorms.set(row.dormID, dorm);
  }
  return [...dorms.values()];
}

export async function createDormFloor(address: string, floor: number, roomIDs: number[]) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    await connection.query("SELECT pg_advisory_xact_lock(hashtext(?))", [`${address.toLowerCase()}|${floor}`]);
    const [existing]: [RowDataPacket[], any] = await connection.query(
      "SELECT dormID FROM dorms WHERE LOWER(address) = LOWER(?) AND floor = ?", [address, floor]
    );
    if (existing[0]) throw new Error("That floor already exists in this house.");
    const [created]: [RowDataPacket[], any] = await connection.query(
      "INSERT INTO dorms (address, floor) VALUES (?, ?) RETURNING dormID", [address, floor]
    );
    const dormID = Number(created[0]?.dormID);
    for (const roomID of roomIDs) {
      await connection.query("INSERT INTO room (roomID, dormID) VALUES (?, ?)", [roomID, dormID]);
    }
    const chatID = await syncDormGeneralChat(connection, dormID, address, floor);
    await connection.commit();
    return { dormID, address, floor, rooms: roomIDs, generalChatID: chatID };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}

export async function addRoomsToDorm(dormID: number, roomIDs: number[]) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const [dorms]: [RowDataPacket[], any] = await connection.query(
      "SELECT address, floor FROM dorms WHERE dormID = ? FOR UPDATE", [dormID]
    );
    if (!dorms[0]) throw new Error("Dorm floor not found.");
    const [existing]: [RowDataPacket[], any] = await connection.query(
      "SELECT roomID FROM room WHERE dormID = ? AND roomID IN (?)", [dormID, roomIDs]
    );
    const existingIDs = new Set(existing.map(row => Number(row.roomID)));
    const created = roomIDs.filter(roomID => !existingIDs.has(roomID));
    for (const roomID of created) await connection.query("INSERT INTO room (roomID, dormID) VALUES (?, ?)", [roomID, dormID]);
    await syncDormGeneralChat(connection, dormID, dorms[0].address, dorms[0].floor);
    await connection.commit();
    return { created, skipped: roomIDs.filter(roomID => existingIDs.has(roomID)) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}

export async function listUsersForAdmin() {
  const [rows]: [RowDataPacket[], any] = await pool.query(
    `SELECT userID, email, username, role, roomID, dormID, active, mustChangePassword
     FROM users ORDER BY dormID, roomID, active DESC, userID`
  );
  return rows.map(row => ({ ...row, active: Boolean(row.active), mustChangePassword: Boolean(row.mustChangePassword) }));
}

/** Deactivate residents whose replacement grace period has ended. */
export async function deactivateExpiredResidents(now: Date = new Date()): Promise<number> {
  const [rows]: [RowDataPacket[], any] = await pool.query(
    `UPDATE users
     SET active = FALSE, scheduledDeactivationAt = NULL,
         credentialVersion = credentialVersion + 1
     WHERE active = TRUE
       AND scheduledDeactivationAt IS NOT NULL
       AND scheduledDeactivationAt <= ?
     RETURNING userID`,
    [now]
  );
  rows.forEach(row => disconnectUser(Number(row.userID)));
  return rows.length;
}

export async function updateUserForAdmin(
  actingAdminID: number,
  userID: number,
  changes: { email: string; username: string | null; role: "ADMIN" | "RESEARCHER" | "STUDENT"; dormID: number | null; roomID: number | null; active: boolean; replaceExisting?: boolean }
) {
  if (actingAdminID === userID && (!changes.active || changes.role !== "ADMIN")) {
    throw new Error("You cannot deactivate or remove your own administrator access.");
  }
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const isGlobalRole = changes.role === "ADMIN" || changes.role === "RESEARCHER";
    const assignedRoomID = isGlobalRole ? null : changes.roomID;
    const assignedDormID = isGlobalRole ? null : changes.dormID;
    if (!isGlobalRole && (assignedRoomID == null || assignedDormID == null)) {
      throw new Error("Students must be assigned to a dorm and room.");
    }
    const [targetRows]: [RowDataPacket[], any] = await connection.query(
      "SELECT userID FROM users WHERE userID = ? FOR UPDATE", [userID]
    );
    if (!targetRows[0]) throw new Error("User not found.");
    if (assignedRoomID != null) {
      const [roomRows]: [RowDataPacket[], any] = await connection.query(
        "SELECT roomID FROM room WHERE roomID = ? AND dormID = ?", [assignedRoomID, assignedDormID]
      );
      if (!roomRows[0]) throw new Error("Room does not exist.");
    }

    const [occupied]: [RowDataPacket[], any] = await connection.query(
      `SELECT userID, email, username FROM users
       WHERE roomID = ? AND dormID = ? AND active = TRUE
         AND scheduledDeactivationAt IS NULL AND userID <> ? FOR UPDATE`,
      [assignedRoomID, assignedDormID, userID]
    );
    if (changes.active && occupied[0] && !changes.replaceExisting) {
      const error: any = new Error("Room already has an active user.");
      error.code = "ROOM_OCCUPIED";
      error.existingUser = occupied[0];
      throw error;
    }
    if (changes.active && occupied.length) {
      await connection.query(
        "UPDATE users SET scheduledDeactivationAt = ? WHERE userID IN (?)",
        [residentDeactivationDeadline(), occupied.map(row => row.userID)]
      );
    }
    await connection.query(
      `UPDATE users SET email = ?, username = ?, role = ?, dormID = ?, roomID = ?, active = ?,
       scheduledDeactivationAt = NULL, credentialVersion = credentialVersion + 1 WHERE userID = ?`,
      [changes.email, changes.username, changes.role, assignedDormID, assignedRoomID, changes.active, userID]
    );
    if (changes.active && assignedDormID != null) {
      const [dormRows]: [RowDataPacket[], any] = await connection.query(
        "SELECT address, floor FROM dorms WHERE dormID = ?", [assignedDormID]
      );
      await syncDormGeneralChat(connection, assignedDormID, dormRows[0].address, dormRows[0].floor);
    }
    await connection.query(
      "UPDATE passwordResetTokens SET usedAt = NOW() WHERE userID = ? AND usedAt IS NULL",
      [userID]
    );
    await connection.commit();
    disconnectUser(userID);
    return { message: "User updated successfully." };
  } catch (error: any) {
    await connection.rollback();
    if (error?.code === "23505") throw new Error("That email or username is already in use.");
    throw error;
  } finally {
    connection.release();
  }
}
