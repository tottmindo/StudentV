import express from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { getJwtSecret } from "../config/jwt.js";
import {
  importHistoricalSensorData,
  ImportHistoricalSensorDataOptions,
} from "../services/sensorDataImportService.js";

const router = express.Router();

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
