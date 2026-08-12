import express from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { getJwtSecret } from "../config/jwt.js";
import pool from "../db.js";
import { authenticate, requireAdmin, requireCompletedAccount } from "../middleware/authenticate.js";
import {
  importHistoricalSensorData,
  importAllHistoricalSensorData,
  ImportHistoricalSensorDataResult,
  ImportHistoricalSensorDataOptions,
} from "../services/sensorDataImportService.js";

const router = express.Router();

type HistoricalImportJob = {
  status: "idle" | "running" | "completed" | "failed";
  startedAt?: string;
  finishedAt?: string;
  progress?: ImportHistoricalSensorDataResult;
  error?: string;
};

let historicalImportJob: HistoricalImportJob = { status: "idle" };

const historicalImportSchema = z.object({
  from: z.union([z.number(), z.string()]),
  to: z.union([z.number(), z.string()]).optional(),
  sensorCodes: z.array(z.string().min(1)).optional(),
  topics: z.array(z.string().min(1)).optional(),
  valueTypes: z.array(z.string().min(1)).optional(),
  limit: z.number().int().positive().optional(),
  aggrMethod: z.string().min(1).optional(),
  aggrInterval: z.string().min(1).optional(),
  defaultDormID: z.number().int().positive().optional(),
});

const sensorDetailsSchema = z.object({
  type: z.string().trim().min(1).max(100),
  location: z.string().trim().min(1).max(255),
  dormID: z.number().int().positive(),
});

const createSensorsSchema = sensorDetailsSchema.extend({
  sensorCodes: z.array(z.string().trim().min(1).max(100)).min(1),
});

const updateSensorSchema = sensorDetailsSchema;

router.get("/admin/sensors", authenticate, requireCompletedAccount, requireAdmin, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.sensorCode, s.type, s.location, s.dormID,
              d.address AS dormAddress, d.floor AS dormFloor,
              latest.recordedAt, latest.totalVolume, latest.tempMin, latest.tempMax,
              latest.errorCode, latest.battery, latest.ambientTemp,
              latest.humidity, latest.leakStatus
       FROM sensor s
       JOIN dorms d ON d.dormID = s.dormID
       LEFT JOIN LATERAL (
         SELECT sd.recordedAt, sd.totalVolume, sd.tempMin, sd.tempMax,
                sd.errorCode, sd.battery, sd.ambientTemp, sd.humidity, sd.leakStatus
         FROM sensor_data sd
         WHERE sd.sensorCode = s.sensorCode
         ORDER BY sd.recordedAt DESC
         LIMIT 1
       ) latest ON true
       ORDER BY s.sensorCode`
    );
    res.json(rows);
  } catch (err) {
    console.error("Could not load sensors:", err);
    res.status(500).json({ error: "Could not load sensors." });
  }
});

router.post("/admin/sensors", authenticate, requireCompletedAccount, requireAdmin, async (req, res) => {
  try {
    const input = createSensorsSchema.parse(req.body);
    const sensorCodes = [...new Set(input.sensorCodes.map(code => code.toLowerCase()))];
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const [existing] = await connection.query(
        "SELECT sensorCode FROM sensor WHERE sensorCode IN (?)",
        [sensorCodes]
      );
      const existingCodes = new Set((existing as { sensorCode: string }[]).map(row => row.sensorCode));
      const newCodes = sensorCodes.filter(code => !existingCodes.has(code));

      for (const sensorCode of newCodes) {
        await connection.query(
          "INSERT INTO sensor (sensorCode, type, location, dormID) VALUES (?, ?, ?, ?)",
          [sensorCode, input.type, input.location, input.dormID]
        );
      }

      await connection.commit();
      res.status(201).json({ created: newCodes, skipped: sensorCodes.filter(code => existingCodes.has(code)) });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid sensor information.", issues: err.issues });
      return;
    }
    if (err.code === "23503") {
      res.status(400).json({ error: "The selected dorm does not exist." });
      return;
    }
    console.error("Could not add sensors:", err);
    res.status(500).json({ error: "Could not add sensors." });
  }
});

router.patch("/admin/sensors/:sensorCode", authenticate, requireCompletedAccount, requireAdmin, async (req, res) => {
  try {
    const currentSensorCode = String(req.params.sensorCode).toLowerCase();
    const input = updateSensorSchema.parse(req.body);
    const [, result] = await pool.query(
      `UPDATE sensor
       SET type = ?, location = ?, dormID = ?
       WHERE sensorCode = ?`,
      [input.type, input.location, input.dormID, currentSensorCode]
    );

    if (!result.affectedRows) {
      res.status(404).json({ error: "Sensor not found." });
      return;
    }
    res.json({ sensorCode: currentSensorCode, type: input.type, location: input.location, dormID: input.dormID });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid sensor information.", issues: err.issues });
      return;
    }
    if (err.code === "23503") {
      res.status(400).json({ error: "The selected dorm does not exist." });
      return;
    }
    console.error("Could not update sensor:", err);
    res.status(500).json({ error: "Could not update sensor." });
  }
});

router.post("/admin/import-historical", authenticate, requireCompletedAccount, requireAdmin, async (_req, res) => {
  if (historicalImportJob.status === "running") {
    res.status(409).json({ error: "A historical sensor import is already running.", job: historicalImportJob });
    return;
  }

  historicalImportJob = { status: "running", startedAt: new Date().toISOString() };
  void importAllHistoricalSensorData(progress => {
    historicalImportJob = { ...historicalImportJob, progress };
  }).then(result => {
    historicalImportJob = {
      ...historicalImportJob,
      status: "completed",
      finishedAt: new Date().toISOString(),
      progress: result,
    };
  }).catch((err: any) => {
    console.error("Historical sensor data import failed:", err);
    historicalImportJob = {
      ...historicalImportJob,
      status: "failed",
      finishedAt: new Date().toISOString(),
      error: err.message || "Historical sensor data import failed.",
    };
  });

  res.status(202).json({ message: "Historical sensor data import started.", job: historicalImportJob });
});

router.get("/admin/import-historical", authenticate, requireCompletedAccount, requireAdmin, (_req, res) => {
  res.json({ job: historicalImportJob });
});

function hasAdminBearerToken(req: express.Request): boolean {
  const authHeader = req.header("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return false;
  }

  const decoded = jwt.verify(token, getJwtSecret()) as { role?: string };
  return decoded.role === "ADMIN";
}

router.post("/import-historical", async (req, res) => {
  try {
    const importToken = process.env.SENSOR_IMPORT_TOKEN;
    const providedImportToken = req.header("x-import-token");
    const hasValidImportToken = Boolean(importToken && providedImportToken === importToken);

    if (!hasValidImportToken && !hasAdminBearerToken(req)) {
      res.status(401).json({ error: "Unauthorized sensor import request" });
      return;
    }

    const options = historicalImportSchema.parse(req.body) as ImportHistoricalSensorDataOptions;
    const result = await importHistoricalSensorData(options);

    res.json({
      message: "Historical sensor data imported",
      ...result,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid import request", issues: err.issues });
      return;
    }

    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      res.status(401).json({ error: "Invalid admin token" });
      return;
    }

    console.error("Sensor data import failed:", err);
    res.status(500).json({ error: err.message || "Sensor data import failed" });
  }
});

export default router;
