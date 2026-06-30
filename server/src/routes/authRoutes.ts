
/**
 * Express router for handling authentication routes.
 * 
 * @module authRoutes
 * 
 * @route POST /register
 * @description Register a new user
 * @body {Object} body - Request body
 * @body {string} body.address - User's address
 * @body {string} body.username - User's username
 * @body {string} body.password - User's password
 * @returns {Object} 201 - Registration successful
 * @throws {409} - User already exists
 * @throws {500} - Internal server error
 * 
 * @route POST /login
 * @description Authenticate a user
 * @body {Object} body - Request body
 * @body {string} body.username - User's username
 * @body {string} body.password - User's password
 * @returns {Object} 200 - Login successful with token
 * @throws {401} - Authentication failed
 */
import express from "express";
import { registerUser, loginUser } from "../services/authService.js";
import { registerSchema, loginSchema } from "../validators/authSchemas.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

router.post("/register", validate(registerSchema), async (req, res) => {
  try {
    console.log("Received registration request:", req.body);
    const { roomID, dormID, role, username, password, replaceExisting = false } = req.body;
    const result = await registerUser(roomID, dormID, role, username, password, replaceExisting);
    res.status(201).json(result);
  } catch (err: any) {
    if (err.message === "User already exists.") {
      res.status(409).json({ error: err.message });
    } else if (err.code === "ROOM_OCCUPIED") {
      res.status(409).json({
        code: "ROOM_OCCUPIED",
        error: err.message,
        existingUser: err.existingUser,
      });
    } else if (err.message === "Room does not exist.") {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

router.post("/login", validate(loginSchema), async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await loginUser(username, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

export default router;
