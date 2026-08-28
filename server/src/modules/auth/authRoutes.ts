
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
import multer from "multer";
import { addRoomsToDorm, adminResetResidentPassword, completeTemporaryPassword, createDormFloors, generateTemporaryPassword, getAccount, registerUser, loginUser, requestPasswordReset, resetPasswordWithToken, scheduleVacantRoomDeactivation, updateAccount, updatePassword, listDormsForAdmin, listUsersForAdmin, updateUserForAdmin } from "./authService.js";
import { addDormRoomsSchema, adminResetPasswordSchema, adminUpdateUserSchema, changePasswordSchema, createAdminEventSchema, createDormFloorSchema, createResidentSchema, emailSchema, registerSchema, loginSchema, resetPasswordSchema, residentImportApplySchema, updateAccountSchema, updatePasswordSchema } from "./authSchemas.js";
import { validate } from "../../shared/middleware/validate.js";
import { authenticate, AuthenticatedRequest, requireAdmin, requireCompletedAccount, requireResearchAccess } from "../../shared/middleware/authenticate.js";
import { sendResidentWelcomeEmail } from "../../integrations/email/emailService.js";
import { generateCleaningWeeks } from "../../jobs/scheduler.js";
import { createTargetedAdminEvent } from "../events/eventService.js";
import { getIO } from "../../infrastructure/socketManager.js";
import { previewResidentWorkbook } from "./residentImportService.js";

const router = express.Router();
const residentWorkbookUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => callback(null, /\.xlsx$/i.test(file.originalname)),
});
const residentImportConcurrency = (() => {
  const value = Number(process.env.RESIDENT_IMPORT_CONCURRENCY ?? 2);
  return Number.isInteger(value) && value > 0 ? Math.min(value, 5) : 2;
})();

type ResidentImportApplyRow = { roomID: number; dormID: number; email: string; vacant: boolean };
type ResidentImportResult = {
  roomID: number;
  dormID: number;
  email?: string;
  status: "created" | "vacant" | "failed";
  scheduled?: number;
  code?: string;
  error?: string;
};

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, runWorker));
  return results;
}

function residentImportFailure(row: ResidentImportApplyRow, error: any): ResidentImportResult {
  const cause = error?.cause ?? error;
  console.error(`Resident import failed for room ${row.roomID}:`, cause);
  if (error?.code === "ACCOUNT_DELIVERY_FAILED") {
    return {
      roomID: row.roomID,
      dormID: row.dormID,
      email: row.email,
      status: "failed",
      code: "EMAIL_DELIVERY_FAILED",
      error: "The welcome email could not be sent. Try this row again.",
    };
  }
  if (error?.message === "User already exists.") {
    return {
      roomID: row.roomID,
      dormID: row.dormID,
      email: row.email,
      status: "failed",
      code: "EMAIL_ALREADY_EXISTS",
      error: "An account already exists for this email. Preview the latest workbook state and try again.",
    };
  }
  return {
    roomID: row.roomID,
    dormID: row.dormID,
    email: row.email,
    status: "failed",
    code: "UPDATE_FAILED",
    error: error?.message || "The resident update failed.",
  };
}

router.post("/register", authenticate, requireCompletedAccount, requireAdmin, validate(registerSchema), async (req: AuthenticatedRequest, res) => {
  try {
    console.log("Received registration request:", req.body);
    const { roomID, role, email, password, replaceExisting = false } = req.body;
    const result = await registerUser(roomID, req.body.dormID, role, email, password, replaceExisting);
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

router.post("/residents", authenticate, requireCompletedAccount, requireAdmin, validate(createResidentSchema), async (req: AuthenticatedRequest, res) => {
  const { dormID, roomID, role, email, replaceExisting = false } = req.body;
  const temporaryPassword = generateTemporaryPassword();
  try {
    const result = await registerUser(
      roomID,
      dormID,
      role,
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
    } else if (err.code === "ACCOUNT_DELIVERY_FAILED") {
      console.error("Resident welcome email failed:", err.cause ?? err);
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

router.get("/admin/dorms", authenticate, requireCompletedAccount, requireResearchAccess, async (_req, res) => {
  try { res.json(await listDormsForAdmin()); }
  catch { res.status(500).json({ error: "Could not load dorms." }); }
});

router.post("/admin/events", authenticate, requireCompletedAccount, requireAdmin, validate(createAdminEventSchema), async (req, res) => {
  try {
    const result = await createTargetedAdminEvent(req.body);
    for (const created of result.created) {
      getIO().to(`dorm-${created.dormID}`).emit("eventCreated", { eventID: created.eventID });
      getIO().to(`dorm-${created.dormID}`).emit("eventInvitationsUpdated", { eventID: created.eventID });
    }
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Could not create event." });
  }
});

router.post("/admin/dorms", authenticate, requireCompletedAccount, requireAdmin, validate(createDormFloorSchema), async (req, res) => {
  try {
    const floorTo = req.body.floorTo ?? req.body.floor;
    const roomNumbers = req.body.roomNumbers ?? req.body.roomIDs;
    const format = req.body.roomNumbers ? (req.body.roomNumberFormat ?? "local") : "full";
    const floors = await createDormFloors(req.body.address, req.body.floor, floorTo, roomNumbers, format);
    // Keep the original single-floor fields for existing API clients while
    // exposing the complete result for range-aware clients.
    res.status(201).json({ ...floors[0], floorFrom: req.body.floor, floorTo, floors, totalRooms: floors.reduce((sum, floor) => sum + floor.rooms.length, 0) });
  }
  catch (error: any) { res.status(error.message?.includes("already exists") ? 409 : 400).json({ error: error.message || "Could not create dorm floor." }); }
});

router.post("/admin/dorms/:dormID/rooms", authenticate, requireCompletedAccount, requireAdmin, validate(addDormRoomsSchema), async (req, res) => {
  try {
    const roomNumbers = req.body.roomNumbers ?? req.body.roomIDs;
    const format = req.body.roomNumbers ? (req.body.roomNumberFormat ?? "local") : "full";
    res.status(201).json(await addRoomsToDorm(Number(req.params.dormID), roomNumbers, format));
  }
  catch (error: any) { res.status(error.message === "Dorm floor not found." ? 404 : 400).json({ error: error.message || "Could not add rooms." }); }
});

router.get("/admin/users", authenticate, requireCompletedAccount, requireAdmin, async (_req, res) => {
  try { res.json(await listUsersForAdmin()); }
  catch { res.status(500).json({ error: "Could not load users." }); }
});

router.post("/admin/resident-import/preview", authenticate, requireCompletedAccount, requireAdmin, residentWorkbookUpload.single("file"), async (req, res) => {
  try {
    if (!req.file) { res.status(400).json({ error: "Select an .xlsx workbook." }); return; }
    res.json(await previewResidentWorkbook(req.file.buffer));
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Could not read the workbook." });
  }
});

router.post("/admin/resident-import/apply", authenticate, requireCompletedAccount, requireAdmin, validate(residentImportApplySchema), async (req, res) => {
  const rows = req.body.rows as ResidentImportApplyRow[];
  const results = await mapWithConcurrency(rows, residentImportConcurrency, async (row): Promise<ResidentImportResult> => {
    try {
      if (row.vacant) {
        const scheduled = await scheduleVacantRoomDeactivation(row.roomID, row.dormID);
        return { roomID: row.roomID, dormID: row.dormID, status: "vacant", scheduled };
      }
      const temporaryPassword = generateTemporaryPassword();
      await registerUser(row.roomID, row.dormID, "STUDENT", row.email, temporaryPassword, true, true,
        () => sendResidentWelcomeEmail(row.email, row.roomID, temporaryPassword));
      return { roomID: row.roomID, dormID: row.dormID, email: row.email, status: "created" };
    } catch (error: any) {
      return residentImportFailure(row, error);
    }
  });
  res.json({ results, succeeded: results.filter(result => result.status !== "failed").length, failed: results.filter(result => result.status === "failed").length });
});

router.post("/admin/cleaning-weeks/generate", authenticate, requireCompletedAccount, requireAdmin, async (_req, res) => {
  try { res.json({ message: "Cleaning schedule check completed.", summary: await generateCleaningWeeks() }); }
  catch (error) { console.error("Manual cleaning schedule check failed:", error); res.status(500).json({ error: "Could not generate cleaning weeks." }); }
});

router.patch("/admin/users/:userID", authenticate, requireCompletedAccount, requireAdmin, validate(adminUpdateUserSchema), async (req: AuthenticatedRequest, res) => {
  try {
    res.json(await updateUserForAdmin(req.authUser!.userID, Number(req.params.userID), req.body));
  } catch (err: any) {
    if (err.code === "ROOM_OCCUPIED") {
      res.status(409).json({ code: err.code, error: err.message, existingUser: err.existingUser });
    } else if (err.message === "User not found." || err.message === "Room does not exist.") {
      res.status(404).json({ error: err.message });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
});

router.post("/admin/reset-resident-password", authenticate, requireCompletedAccount, requireAdmin, validate(adminResetPasswordSchema), async (req: AuthenticatedRequest, res) => {
  try {
    await adminResetResidentPassword(req.body.dormID, req.body.email);
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
const loginAttempts = new Map<string, { count: number; resetsAt: number }>();

function isRateLimited(store: Map<string, { count: number; resetsAt: number }>, key: string, limit: number) {
  const now = Date.now();
  // Keep opportunistic cleanup bounded without a timer that holds the process open.
  if (store.size > 10_000) {
    for (const [storedKey, value] of store) {
      if (value.resetsAt <= now) store.delete(storedKey);
    }
  }
  const entry = store.get(key);
  if (!entry || entry.resetsAt <= now) {
    store.set(key, { count: 1, resetsAt: now + 15 * 60 * 1000 });
    return false;
  }
  entry.count += 1;
  return entry.count > limit;
}

router.post("/forgot-password", validate(emailSchema), async (req, res) => {
  const key = `${req.ip || "unknown"}:${req.body.email}`;
  if (isRateLimited(resetRequests, key, 5)) {
    res.status(429).json({ error: "Too many requests. Please try again later." });
    return;
  }
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
  const rateKey = `${req.ip || "unknown"}:${req.body.email}`;
  if (isRateLimited(loginAttempts, rateKey, 10)) {
    res.status(429).json({ error: "Too many sign-in attempts. Please try again later." });
    return;
  }
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    loginAttempts.delete(rateKey);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

router.get("/account", authenticate, async (req: AuthenticatedRequest, res) => {
  try { res.json(await getAccount(req.authUser!.userID)); }
  catch (err: any) { res.status(404).json({ error: err.message }); }
});

router.patch("/account", authenticate, requireCompletedAccount, validate(updateAccountSchema), async (req: AuthenticatedRequest, res) => {
  try { res.json(await updateAccount(req.authUser!.userID, req.body.username, req.body.email)); }
  catch (err: any) { res.status(err.message.includes("already in use") ? 409 : 400).json({ error: err.message }); }
});

router.patch("/account/password", authenticate, requireCompletedAccount, validate(updatePasswordSchema), async (req: AuthenticatedRequest, res) => {
  try {
    await updatePassword(req.authUser!.userID, req.body.currentPassword, req.body.newPassword);
    res.json({ message: "Password changed successfully. Please sign in again." });
  } catch (err: any) {
    res.status(err.message === "The current password is incorrect." ? 400 : 404).json({ error: err.message });
  }
});

export default router;
