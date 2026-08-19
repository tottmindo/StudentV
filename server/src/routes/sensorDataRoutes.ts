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
import { Data } from "../data.js";

const router = express.Router();
const data = new Data();

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
const sensorNoteSchema = z.object({ note: z.string().trim().max(2000) });

const exportFields = {
  recordedAt: { sql: "sd.recordedAt", header: "recorded_at" },
  sensorCode: { sql: "sd.sensorCode", header: "sensor_code" },
  house: { sql: "d.address", header: "house" },
  floor: { sql: "d.floor", header: "floor" },
  sensorType: { sql: "s.type", header: "sensor_type" },
  location: { sql: "s.location", header: "location" },
  totalVolume: { sql: "sd.totalVolume", header: "total_volume_liters" },
  tempMin: { sql: "sd.tempMin", header: "water_temperature_min_c" },
  tempMax: { sql: "sd.tempMax", header: "water_temperature_max_c" },
  ambientTemp: { sql: "sd.ambientTemp", header: "ambient_temperature_c" },
  humidity: { sql: "sd.humidity", header: "humidity_percent" },
  battery: { sql: "sd.battery", header: "battery_volts" },
  errorCode: { sql: "sd.errorCode", header: "error_code" },
  leakStatus: { sql: "sd.leakStatus", header: "leak_status" },
} as const;
type ExportField = keyof typeof exportFields;

const waterExportSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  fields: z.array(z.enum(Object.keys(exportFields) as [ExportField, ...ExportField[]])).min(1),
  dormIDs: z.array(z.number().int().positive()).optional(),
  sensorCodes: z.array(z.string().trim().min(1).max(100)).optional(),
}).refine(value => new Date(value.from) <= new Date(value.to), { message: "The start must be before the end." });

function csvCell(value: unknown): string {
  if (value == null) return "";
  let text = value instanceof Date ? value.toISOString() : String(value);
  if (typeof value === "string" && /^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

router.get("/admin/sensors", authenticate, requireCompletedAccount, requireAdmin, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.sensorCode, s.type, s.location, s.dormID,
              d.address AS dormAddress, d.floor AS dormFloor,
              latest.recordedAt, latest.errorCode, latest.leakStatus,
              latest.battery, latest.ambientTemp, latest.tempMin, latest.tempMax,
              notes.note AS adminNote, notes.updatedAt AS noteUpdatedAt,
              usage24.last24HoursLiters
       FROM sensor s
       JOIN dorms d ON d.dormID = s.dormID
       LEFT JOIN LATERAL (
         SELECT sd.recordedAt, sd.errorCode, sd.leakStatus, sd.battery,
                sd.ambientTemp, sd.tempMin, sd.tempMax
         FROM sensor_data sd
         WHERE sd.sensorCode = s.sensorCode
           AND sd.totalVolume <> 0
           AND sd.battery <> 0
           AND sd.ambientTemp <> 0
           AND sd.tempMin <> 0
           AND sd.tempMax <> 0
         ORDER BY sd.recordedAt DESC
         LIMIT 1
       ) latest ON true
       LEFT JOIN LATERAL (
         SELECT COALESCE(SUM(GREATEST(reading.totalVolume - reading.previousVolume, 0)), 0)::real AS last24HoursLiters
         FROM (
           SELECT sd.recordedAt, sd.totalVolume,
                  LAG(sd.totalVolume) OVER (ORDER BY sd.recordedAt) AS previousVolume
           FROM sensor_data sd
           WHERE sd.sensorCode = s.sensorCode
             AND sd.recordedAt >= NOW() - interval '25 hours'
         ) reading
         WHERE reading.recordedAt >= NOW() - interval '24 hours'
           AND reading.previousVolume IS NOT NULL
       ) usage24 ON true
       LEFT JOIN sensor_notes notes ON notes.sensorCode = s.sensorCode
       ORDER BY s.sensorCode`
    );
    res.json(rows);
  } catch (err) {
    console.error("Could not load sensors:", err);
    res.status(500).json({ error: "Could not load sensors." });
  }
});

router.post("/admin/export", authenticate, requireCompletedAccount, requireAdmin, async (req, res) => {
  try {
    const input = waterExportSchema.parse(req.body);
    const fields = [...new Set(input.fields)];
    const where = ["sd.recordedAt >= ?", "sd.recordedAt <= ?"];
    const values: unknown[] = [input.from, input.to];
    if (input.dormIDs?.length) { where.push("s.dormID IN (?)"); values.push([...new Set(input.dormIDs)]); }
    if (input.sensorCodes?.length) { where.push("sd.sensorCode IN (?)"); values.push([...new Set(input.sensorCodes.map(code => code.toLowerCase()))]); }
    const selections = fields.map((field, index) => `${exportFields[field].sql} AS "export_${index}"`).join(", ");
    const [rows] = await pool.query(
      `SELECT ${selections}
       FROM sensor_data sd
       JOIN sensor s ON s.sensorCode = sd.sensorCode
       JOIN dorms d ON d.dormID = s.dormID
       WHERE ${where.join(" AND ")}
       ORDER BY sd.recordedAt, sd.sensorCode`,
      values,
    );
    const header = fields.map(field => csvCell(exportFields[field].header)).join(",");
    const lines = (rows as Record<string, unknown>[]).map(row => fields.map((_field, index) => csvCell(row[`export_${index}`])).join(","));
    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="water-data-${stamp}.csv"`);
    res.send(`\uFEFF${[header, ...lines].join("\r\n")}\r\n`);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0]?.message || "Invalid export options." });
      return;
    }
    console.error("Could not export water data:", err);
    res.status(500).json({ error: "Could not export water data." });
  }
});

router.put("/admin/sensors/:sensorCode/note", authenticate, requireCompletedAccount, requireAdmin, async (req, res) => {
  try {
    const sensorCode = String(req.params.sensorCode).toLowerCase();
    const { note } = sensorNoteSchema.parse(req.body);
    const [sensorRows] = await pool.query("SELECT sensorCode FROM sensor WHERE sensorCode = ? LIMIT 1", [sensorCode]);
    if (!(sensorRows as any[]).length) {
      res.status(404).json({ error: "Sensor not found." });
      return;
    }
    await pool.query(
      `INSERT INTO sensor_notes (sensorCode, note, updatedAt)
       VALUES (?, ?, NOW())
       ON CONFLICT (sensorCode) DO UPDATE SET note = EXCLUDED.note, updatedAt = NOW()`,
      [sensorCode, note]
    );
    res.json({ sensorCode, note, updatedAt: new Date().toISOString() });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Notes may contain up to 2,000 characters." });
      return;
    }
    console.error("Could not save sensor note:", err);
    res.status(500).json({ error: "Could not save sensor note." });
  }
});

router.get("/admin/stats/:dormID", authenticate, requireCompletedAccount, requireAdmin, async (req, res) => {
  const dormID = Number(req.params.dormID);
  const days = Number(req.query.days) || 30;
  if (!Number.isInteger(dormID) || dormID <= 0 || ![1, 7, 30, 90].includes(days)) {
    res.status(400).json({ error: "Invalid dorm or time period." });
    return;
  }
  try {
    const [dormRows] = await pool.query("SELECT dormID FROM dorms WHERE dormID = ? LIMIT 1", [dormID]);
    if (!(dormRows as any[]).length) {
      res.status(404).json({ error: "Dorm not found." });
      return;
    }
    res.json(await data.getFloorWaterStats(dormID, days));
  } catch (err) {
    console.error("Could not load admin water statistics:", err);
    res.status(500).json({ error: "Could not load water statistics." });
  }
});

router.get("/admin/sensors/:sensorCode/stats", authenticate, requireCompletedAccount, requireAdmin, async (req, res) => {
  const sensorCode = String(req.params.sensorCode).toLowerCase();
  const days = Number(req.query.days) || 30;
  if (![1, 7, 30, 90].includes(days)) {
    res.status(400).json({ error: "Invalid time period." });
    return;
  }
  try {
    const [rows] = await pool.query("SELECT dormID FROM sensor WHERE sensorCode = ? LIMIT 1", [sensorCode]);
    const sensor = (rows as any[])[0];
    if (!sensor) {
      res.status(404).json({ error: "Sensor not found." });
      return;
    }
    res.json(await data.getFloorWaterStats(Number(sensor.dormID), days, sensorCode));
  } catch (err) {
    console.error("Could not load sensor statistics:", err);
    res.status(500).json({ error: "Could not load sensor statistics." });
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
