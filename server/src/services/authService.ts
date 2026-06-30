
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

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "1h";

export async function registerUser(
  roomID: number,
  dormID: number,
  role: string,
  username: string,
  password: string,
  replaceExisting: boolean = false
) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const [rows]: [RowDataPacket[], any] = await connection.query(
      "SELECT userID FROM users WHERE username = ?",
      [username]
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
      `SELECT userID, username, role, roomID, dormID
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
      `INSERT INTO users (username, passwordHash, role, roomID, dormID, active)
       VALUES (?, ?, ?, ?, ?, TRUE)`,
      [username, hashedPassword, role, roomID, dormID]
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

export async function loginUser(username: string, password: string) {
  const [rows]: [RowDataPacket[], any] = await pool.query(
    "SELECT * FROM users WHERE username = ? AND active = TRUE",
    [username]
  );

  const user = rows[0];
  

  if (!user) {
    throw new Error("Invalid username or password.");
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    throw new Error("Invalid username or password.");
  }

  const payload = { dormID: user.dormID, userID: user.userID, role: user.role };

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
  };
}
