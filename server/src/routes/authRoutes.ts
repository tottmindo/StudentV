
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
import { adminResetResidentPassword, completeTemporaryPassword, generateTemporaryPassword, getAccount, registerUser, loginUser, requestPasswordReset, resetPasswordWithToken, updateUsername } from "../services/authService.js";
import { changePasswordSchema, createResidentSchema, emailSchema, registerSchema, loginSchema, resetPasswordSchema, updateAccountSchema } from "../validators/authSchemas.js";
import { validate } from "../middleware/validate.js";
import { authenticate, AuthenticatedRequest, requireAdmin } from "../middleware/authenticate.js";
import { sendResidentWelcomeEmail } from "../services/emailService.js";

const router = express.Router();

router.post("/register", authenticate, requireAdmin, validate(registerSchema), async (req: AuthenticatedRequest, res) => {
  try {
    console.log("Received registration request:", req.body);
    const { roomID, role, email, password, replaceExisting = false } = req.body;
    const result = await registerUser(roomID, req.authUser!.dormID, role, email, password, replaceExisting);
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

router.post("/residents", authenticate, requireAdmin, validate(createResidentSchema), async (req: AuthenticatedRequest, res) => {
  const { roomID, email, replaceExisting = false } = req.body;
  const temporaryPassword = generateTemporaryPassword();
  try {
    const result = await registerUser(
      roomID,
      req.authUser!.dormID,
      "STUDENT",
      email,
      temporaryPassword,
      replaceExisting,
      true,
      () => sendResidentWelcomeEmail(email, roomID, temporaryPassword)
    );
    res.status(201).json({ ...result, email });
  } catch (err: any) {
    if (err.message === "User already exists.") {
      res.status(409).json({ error: "An account already exists for this email." });
    } else if (err.code === "ROOM_OCCUPIED") {
      res.status(409).json({ code: err.code, error: err.message, existingUser: err.existingUser });
    } else if (err.message === "Room does not exist.") {
      res.status(404).json({ error: err.message });
    } else if (err.message === "Email delivery is not configured." || err?.code?.startsWith?.("E")) {
      console.error("Resident welcome email failed:", err);
      res.status(502).json({ error: "The email could not be sent, so the account was not created." });
    } else {
      console.error("Resident creation failed:", err);
      res.status(500).json({ error: "Could not create the resident account." });
    }
  }
});

router.post("/complete-temporary-password", authenticate, validate(changePasswordSchema), async (req: AuthenticatedRequest, res) => {
  try {
    await completeTemporaryPassword(req.authUser!.userID, req.body.username, req.body.newPassword);
    res.json({ message: "Account setup completed.", username: req.body.username });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/admin/reset-resident-password", authenticate, requireAdmin, validate(emailSchema), async (req: AuthenticatedRequest, res) => {
  try {
    await adminResetResidentPassword(req.authUser!.dormID, req.body.email);
    res.json({ message: "A new temporary password was emailed to the resident." });
  } catch (err: any) {
    if (err.message === "Active resident account not found in your dorm.") {
      res.status(404).json({ error: err.message });
    } else {
      console.error("Admin password reset failed:", err);
      res.status(502).json({ error: "The password was not changed because the email could not be sent." });
    }
  }
});

const resetRequests = new Map<string, { count: number; resetsAt: number }>();
router.post("/forgot-password", validate(emailSchema), async (req, res) => {
  const key = req.ip || "unknown";
  const now = Date.now();
  const entry = resetRequests.get(key);
  if (entry && entry.resetsAt > now && entry.count >= 5) {
    res.status(429).json({ error: "Too many requests. Please try again later." });
    return;
  }
  resetRequests.set(key, entry && entry.resetsAt > now
    ? { ...entry, count: entry.count + 1 }
    : { count: 1, resetsAt: now + 15 * 60 * 1000 });
  try {
    await requestPasswordReset(req.body.email);
  } catch (err) {
    // Keep the response generic so SMTP/account state cannot reveal registered emails.
    console.error("Password reset email failed:", err);
  }
  res.json({ message: "If that email belongs to an active account, a reset link will arrive shortly." });
});

router.post("/reset-password", validate(resetPasswordSchema), async (req, res) => {
  try {
    await resetPasswordWithToken(req.body.token, req.body.newPassword);
    res.json({ message: "Password reset successfully." });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/login", validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

router.get("/account", authenticate, async (req: AuthenticatedRequest, res) => {
  try { res.json(await getAccount(req.authUser!.userID)); }
  catch (err: any) { res.status(404).json({ error: err.message }); }
});

router.patch("/account", authenticate, validate(updateAccountSchema), async (req: AuthenticatedRequest, res) => {
  try { res.json(await updateUsername(req.authUser!.userID, req.body.username)); }
  catch (err: any) { res.status(err.message.includes("already in use") ? 409 : 400).json({ error: err.message }); }
});

export default router;
