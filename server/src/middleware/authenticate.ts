import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../config/jwt.js";
import pool from "../db.js";

export type AuthUser = {
  dormID: number;
  userID: number;
  role: string;
  credentialVersion: number;
};

export interface AuthenticatedRequest extends Request {
  authUser?: AuthUser;
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as AuthUser;
    const [rows]: any = await pool.query(
      "SELECT credentialVersion, active FROM users WHERE userID = ? LIMIT 1",
      [decoded.userID]
    );
    if (!rows[0]?.active || rows[0].credentialVersion !== decoded.credentialVersion) {
      res.status(401).json({ error: "This session is no longer valid. Please sign in again." });
      return;
    }
    req.authUser = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session." });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.authUser?.role !== "ADMIN") {
    res.status(403).json({ error: "Administrator access required." });
    return;
  }
  next();
}
