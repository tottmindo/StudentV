import { ResultSetHeader } from "mysql2";
import pool from "../db.js";

const DEFAULT_VALUE_TYPES = [
  "total_volume",
  "water_temp_min",
  "water_temp_max",
  "error_code",
  "battery",
  "ambient_temp",
  "humidity",
  "leak_status",
];

const DEFAULT_CLIENT_ID = process.env.IOTOPEN_CLIENT_ID || "1637";
const DEFAULT_INSTALLATION_ID = process.env.IOTOPEN_INSTALLATION_ID || "1634";
const DEFAULT_LIMIT = 500000;

export interface ImportHistoricalSensorDataOptions {
  from: number | string | Date;
  to?: number | string | Date;
  sensorCodes?: string[];
  topics?: string[];
  valueTypes?: string[];
  limit?: number;
  aggrMethod?: string;
  aggrInterval?: string;
  defaultDormID?: number;
}

interface IoTOpenLogRecord {
  timestamp?: number | string;
  topic?: string;
  value?: number | string | null;
}

interface SensorSnapshot {
  sensorCode: string;
  recordedAt: string;
  totalVolume: number;
  tempMin: number;
  tempMax: number;
  errorCode: number;
  battery: number;
  ambientTemp: number;
  humidity: number;
  leakStatus: boolean;
}

interface ParsedTopic {
  sensorCode: string;
  valueType: string;
}

export interface ImportHistoricalSensorDataResult {
  fetchedRows: number;
  parsedRows: number;
  snapshots: number;
  insertedOrUpdated: number;
  sensorsEnsured: number;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function normalizeUnixTimestamp(value: number | string | Date): number {
  if (value instanceof Date) {
    return Math.floor(value.getTime() / 1000);
  }

  if (typeof value === "number") {
    return value > 9999999999 ? Math.floor(value / 1000) : Math.floor(value);
  }

  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    return normalizeUnixTimestamp(numericValue);
  }

  const dateValue = new Date(value);
  if (Number.isNaN(dateValue.getTime())) {
    throw new Error(`Invalid timestamp/date: ${value}`);
  }

  return Math.floor(dateValue.getTime() / 1000);
}

function toMysqlDatetime(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString().slice(0, 19).replace("T", " ");
}

function parseTopic(topic: string): ParsedTopic | null {
  const parts = topic.split("/");
  const loraIndex = parts.indexOf("lora");

  if (loraIndex === -1 || !parts[loraIndex + 1] || !parts[loraIndex + 2]) {
    return null;
  }

  return {
    sensorCode: parts[loraIndex + 1].toLowerCase(),
    valueType: parts[loraIndex + 2],
  };
}

function buildTopics(sensorCodes: string[], valueTypes: string[]): string[] {
  return sensorCodes.flatMap((sensorCode) =>
    valueTypes.map((valueType) => `${DEFAULT_CLIENT_ID}/obj/lora/${sensorCode}/${valueType}`)
  );
}

function getSensorCodesFromEnv(): string[] {
  return (process.env.IOTOPEN_SENSOR_CODES || "")
    .split(",")
    .map((sensorCode) => sensorCode.trim().toLowerCase())
    .filter(Boolean);
}

function extractRecords(payload: unknown): IoTOpenLogRecord[] {
  if (Array.isArray(payload)) {
    return payload as IoTOpenLogRecord[];
  }

  if (payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: IoTOpenLogRecord[] }).data;
  }

  throw new Error("Unexpected IoT Open response format");
}

async function getSensorCodesFromDatabase(): Promise<string[]> {
  const [rows] = await pool.query("SELECT sensorCode FROM sensor");
  return (rows as { sensorCode: string }[]).map((row) => row.sensorCode.toLowerCase());
}

async function ensureSensors(sensorCodes: string[], defaultDormID: number): Promise<number> {
  if (sensorCodes.length === 0) {
    return 0;
  }

  const values = sensorCodes.map((sensorCode) => [
    sensorCode,
    "Water Meter",
    "Imported IoT Open sensor",
    defaultDormID,
  ]);

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT IGNORE INTO sensor (sensorCode, type, location, dormID)
     VALUES ?`,
    [values]
  );

  return result.affectedRows;
}

function snapshotsFromRecords(records: IoTOpenLogRecord[]): {
  snapshots: SensorSnapshot[];
  parsedRows: number;
  sensorCodes: string[];
} {
  const snapshotsByKey = new Map<string, SensorSnapshot>();
  const sensorCodes = new Set<string>();
  let parsedRows = 0;

  for (const record of records) {
    if (!record.topic || record.timestamp === undefined) {
      continue;
    }

    const parsedTopic = parseTopic(record.topic);
    const value = Number(record.value);
    const timestamp = Number(record.timestamp);

    if (!parsedTopic || !Number.isFinite(value) || !Number.isFinite(timestamp)) {
      continue;
    }

    const recordedAt = toMysqlDatetime(timestamp);
    const key = `${parsedTopic.sensorCode}|${recordedAt}`;
    const snapshot = snapshotsByKey.get(key) ?? {
      sensorCode: parsedTopic.sensorCode,
      recordedAt,
      totalVolume: 0,
      tempMin: 0,
      tempMax: 0,
      errorCode: 0,
      battery: 0,
      ambientTemp: 0,
      humidity: 0,
      leakStatus: false,
    };

    switch (parsedTopic.valueType) {
      case "total_volume":
        snapshot.totalVolume = value;
        break;
      case "water_temp_min":
        snapshot.tempMin = value;
        break;
      case "water_temp_max":
        snapshot.tempMax = value;
        break;
      case "error_code":
        snapshot.errorCode = value;
        break;
      case "battery":
        snapshot.battery = value;
        break;
      case "ambient_temp":
        snapshot.ambientTemp = value;
        break;
      case "humidity":
        snapshot.humidity = value;
        break;
      case "leak_status":
        snapshot.leakStatus = value > 0;
        break;
      default:
        continue;
    }

    snapshotsByKey.set(key, snapshot);
    sensorCodes.add(parsedTopic.sensorCode);
    parsedRows += 1;
  }

  return {
    snapshots: Array.from(snapshotsByKey.values()),
    parsedRows,
    sensorCodes: Array.from(sensorCodes),
  };
}

async function upsertSnapshots(snapshots: SensorSnapshot[]): Promise<number> {
  if (snapshots.length === 0) {
    return 0;
  }

  const values = snapshots.map((snapshot) => [
    snapshot.sensorCode,
    snapshot.recordedAt,
    snapshot.totalVolume,
    snapshot.tempMin,
    snapshot.tempMax,
    snapshot.errorCode,
    snapshot.battery,
    snapshot.ambientTemp,
    snapshot.humidity,
    snapshot.leakStatus,
  ]);

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO sensor_data
       (sensorCode, recordedAt, totalVolume, tempMin, tempMax, errorCode,
        battery, ambientTemp, humidity, leakStatus)
     VALUES ?
     ON DUPLICATE KEY UPDATE
       totalVolume = VALUES(totalVolume),
       tempMin = VALUES(tempMin),
       tempMax = VALUES(tempMax),
       errorCode = VALUES(errorCode),
       battery = VALUES(battery),
       ambientTemp = VALUES(ambientTemp),
       humidity = VALUES(humidity),
       leakStatus = VALUES(leakStatus)`,
    [values]
  );

  return result.affectedRows;
}

export async function importHistoricalSensorData(
  options: ImportHistoricalSensorDataOptions
): Promise<ImportHistoricalSensorDataResult> {
  const apiKey = getRequiredEnv("IOTOPEN_API_KEY");
  const installationID = process.env.IOTOPEN_INSTALLATION_ID || DEFAULT_INSTALLATION_ID;
  const defaultDormID = options.defaultDormID ?? Number(process.env.IOTOPEN_DEFAULT_DORM_ID || 1);
  const from = normalizeUnixTimestamp(options.from);
  const valueTypes = options.valueTypes?.length ? options.valueTypes : DEFAULT_VALUE_TYPES;
  const envSensorCodes = getSensorCodesFromEnv();
  const sensorCodes = options.sensorCodes?.length
    ? options.sensorCodes.map((sensorCode) => sensorCode.toLowerCase())
    : envSensorCodes.length
      ? envSensorCodes
      : await getSensorCodesFromDatabase();

  const topics = options.topics?.length ? options.topics : buildTopics(sensorCodes, valueTypes);
  if (topics.length === 0) {
    throw new Error("No sensor topics configured for import");
  }

  const url = new URL(`https://lynx.iotopen.se/api/v3beta/log/${installationID}`);
  url.searchParams.set("topics", topics.join(","));
  url.searchParams.set("limit", String(options.limit ?? DEFAULT_LIMIT));
  url.searchParams.set("from", String(from));
  url.searchParams.set("aggr_method", options.aggrMethod || "last");
  url.searchParams.set("aggr_interval", options.aggrInterval || "1h");

  if (options.to !== undefined) {
    url.searchParams.set("to", String(normalizeUnixTimestamp(options.to)));
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-API-Key": apiKey,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`IoT Open API request failed (${response.status}): ${body}`);
  }

  const records = extractRecords(await response.json());
  const normalized = snapshotsFromRecords(records);
  const sensorsEnsured = await ensureSensors(normalized.sensorCodes, defaultDormID);
  const insertedOrUpdated = await upsertSnapshots(normalized.snapshots);

  return {
    fetchedRows: records.length,
    parsedRows: normalized.parsedRows,
    snapshots: normalized.snapshots.length,
    insertedOrUpdated,
    sensorsEnsured,
  };
}
