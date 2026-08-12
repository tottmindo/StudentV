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

const DEFAULT_VALUE_TYPES_ENV = DEFAULT_VALUE_TYPES.join(",");

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
  onProgress?: (progress: ImportSensorDataProgress) => void;
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
  batchesCompleted: number;
  totalBatches: number;
  retries: number;
  startedFrom: number;
  endedAt: number;
}

export interface ImportSensorDataProgress extends ImportHistoricalSensorDataResult {
  currentFrom?: number;
  currentTo?: number;
}

const TRANSIENT_HTTP_STATUSES = new Set([429, 500, 502, 503, 504]);

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function getEnvNumber(name: string, fallback: number): number {
  const value = Number(process.env[name] || fallback);
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be a positive number`);
  return value;
}

function getConfiguredValueTypes(): string[] {
  return (process.env.IOTOPEN_VALUE_TYPES || DEFAULT_VALUE_TYPES_ENV)
    .split(",")
    .map(valueType => valueType.trim())
    .filter(Boolean);
}

function chunk<T>(values: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) chunks.push(values.slice(index, index + size));
  return chunks;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
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

function toPostgresTimestamp(unixSeconds: number): string {
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
  const clientID = process.env.IOTOPEN_CLIENT_ID || "1637";
  return sensorCodes.flatMap((sensorCode) =>
    valueTypes.map((valueType) => `${clientID}/obj/lora/${sensorCode}/${valueType}`)
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

async function getLatestStoredSensorTimestamp(): Promise<number | null> {
  const [rows] = await pool.query("SELECT MAX(recordedAt) AS latestRecordedAt FROM sensor_data");
  const latestRecordedAt = (rows[0] as { latestRecordedAt?: Date | string | null } | undefined)?.latestRecordedAt;
  return latestRecordedAt ? normalizeUnixTimestamp(latestRecordedAt) : null;
}

async function ensureSensors(sensorCodes: string[], defaultDormID: number): Promise<number> {
  if (sensorCodes.length === 0) {
    return 0;
  }

  let inserted = 0;
  for (const sensorCode of sensorCodes) {
    const [, result] = await pool.query(
      `INSERT INTO sensor (sensorCode, type, location, dormID)
       VALUES (?, ?, ?, ?) ON CONFLICT (sensorCode) DO NOTHING`,
      [sensorCode, "Water Meter", "Imported IoT Open sensor", defaultDormID]
    );
    inserted += result.affectedRows;
  }
  return inserted;
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

    const recordedAt = toPostgresTimestamp(timestamp);
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

  let insertedOrUpdated = 0;
  for (const snapshot of snapshots) {
    const [, result] = await pool.query(
      `INSERT INTO sensor_data
       (sensorCode, recordedAt, totalVolume, tempMin, tempMax, errorCode,
        battery, ambientTemp, humidity, leakStatus)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (sensorCode, recordedAt) DO UPDATE SET
         totalVolume = EXCLUDED.totalVolume,
         tempMin = EXCLUDED.tempMin,
         tempMax = EXCLUDED.tempMax,
         errorCode = EXCLUDED.errorCode,
         battery = EXCLUDED.battery,
         ambientTemp = EXCLUDED.ambientTemp,
         humidity = EXCLUDED.humidity,
         leakStatus = EXCLUDED.leakStatus`,
      [snapshot.sensorCode, snapshot.recordedAt, snapshot.totalVolume, snapshot.tempMin,
       snapshot.tempMax, snapshot.errorCode, snapshot.battery, snapshot.ambientTemp,
       snapshot.humidity, snapshot.leakStatus]
    );
    insertedOrUpdated += result.affectedRows;
  }
  return insertedOrUpdated;
}

async function fetchRecordsWithRetry(url: URL, apiKey: string): Promise<{ records: IoTOpenLogRecord[]; retries: number }> {
  const maxRetries = getEnvNumber("IOTOPEN_MAX_RETRIES", 3);
  const retryBaseMilliseconds = getEnvNumber("IOTOPEN_RETRY_BASE_MS", 1000);

  for (let attempt = 0; ; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { Accept: "application/json", "X-API-Key": apiKey } });
      if (response.ok) return { records: extractRecords(await response.json()), retries: attempt };

      const body = await response.text();
      if (!TRANSIENT_HTTP_STATUSES.has(response.status) || attempt >= maxRetries) {
        throw new Error(`IoT Open API request failed (${response.status}): ${body}`);
      }

      const retryAfter = Number(response.headers.get("retry-after"));
      await wait(Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : retryBaseMilliseconds * 2 ** attempt);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("IoT Open API request failed")) throw error;
      if (attempt >= maxRetries) throw error;
      await wait(retryBaseMilliseconds * 2 ** attempt);
    }
  }
}

export async function importHistoricalSensorData(
  options: ImportHistoricalSensorDataOptions
): Promise<ImportHistoricalSensorDataResult> {
  const apiKey = getRequiredEnv("IOTOPEN_API_KEY");
  const apiBaseURL = (process.env.IOTOPEN_API_BASE_URL || "https://lynx.iotopen.se/api/v3beta").replace(/\/$/, "");
  const installationID = process.env.IOTOPEN_INSTALLATION_ID || "1634";
  const defaultDormID = options.defaultDormID ?? Number(process.env.IOTOPEN_DEFAULT_DORM_ID || 1);
  const from = normalizeUnixTimestamp(options.from);
  const to = options.to === undefined ? Math.floor(Date.now() / 1000) : normalizeUnixTimestamp(options.to);
  if (to < from) throw new Error("Import end time must be after its start time");
  const valueTypes = options.valueTypes?.length ? options.valueTypes : getConfiguredValueTypes();
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

  const configuredTopicBatchSize = getEnvNumber("IOTOPEN_TOPIC_BATCH_SIZE", 80);
  const topicBatchSize = options.topics?.length
    ? configuredTopicBatchSize
    : Math.max(valueTypes.length, Math.floor(configuredTopicBatchSize / valueTypes.length) * valueTypes.length);
  const windowDays = getEnvNumber("IOTOPEN_HISTORY_WINDOW_DAYS", 7);
  const windowSeconds = windowDays * 24 * 60 * 60;
  const topicBatches = chunk(topics, topicBatchSize);
  const timeWindows: { from: number; to: number }[] = [];
  for (let windowFrom = from; windowFrom <= to; windowFrom += windowSeconds) {
    timeWindows.push({ from: windowFrom, to: Math.min(windowFrom + windowSeconds - 1, to) });
  }

  const result: ImportHistoricalSensorDataResult = {
    fetchedRows: 0, parsedRows: 0, snapshots: 0, insertedOrUpdated: 0,
    sensorsEnsured: 0, batchesCompleted: 0,
    totalBatches: topicBatches.length * timeWindows.length, retries: 0,
    startedFrom: from, endedAt: to,
  };
  const ensuredSensorCodes = new Set<string>();
  const batchDelayMilliseconds = Number(process.env.IOTOPEN_BATCH_DELAY_MS || 100);

  for (const timeWindow of timeWindows) {
    for (const topicBatch of topicBatches) {
      const url = new URL(`${apiBaseURL}/log/${installationID}`);
      url.searchParams.set("topics", topicBatch.join(","));
      url.searchParams.set("limit", String(options.limit ?? getEnvNumber("IOTOPEN_IMPORT_LIMIT", 25000)));
      url.searchParams.set("from", String(timeWindow.from));
      url.searchParams.set("to", String(timeWindow.to));
      url.searchParams.set("aggr_method", options.aggrMethod || process.env.IOTOPEN_AGGR_METHOD || "last");
      url.searchParams.set("aggr_interval", options.aggrInterval || process.env.IOTOPEN_AGGR_INTERVAL || "1h");

      const fetched = await fetchRecordsWithRetry(url, apiKey);
      const normalized = snapshotsFromRecords(fetched.records);
      const newSensorCodes = normalized.sensorCodes.filter(sensorCode => !ensuredSensorCodes.has(sensorCode));
      const sensorsEnsured = await ensureSensors(newSensorCodes, defaultDormID);
      newSensorCodes.forEach(sensorCode => ensuredSensorCodes.add(sensorCode));
      const insertedOrUpdated = await upsertSnapshots(normalized.snapshots);

      result.fetchedRows += fetched.records.length;
      result.parsedRows += normalized.parsedRows;
      result.snapshots += normalized.snapshots.length;
      result.insertedOrUpdated += insertedOrUpdated;
      result.sensorsEnsured += sensorsEnsured;
      result.retries += fetched.retries;
      result.batchesCompleted += 1;
      options.onProgress?.({ ...result, currentFrom: timeWindow.from, currentTo: timeWindow.to });
      if (batchDelayMilliseconds > 0 && result.batchesCompleted < result.totalBatches) await wait(batchDelayMilliseconds);
    }
  }

  return result;
}

export function importLatestSensorData(): Promise<ImportHistoricalSensorDataResult> {
  const lookbackHours = getEnvNumber("SENSOR_LATEST_LOOKBACK_HOURS", 24);
  return importHistoricalSensorData({
    from: Date.now() - lookbackHours * 60 * 60 * 1000,
    aggrInterval: process.env.SENSOR_LATEST_AGGR_INTERVAL || process.env.IOTOPEN_AGGR_INTERVAL || "1h",
  });
}

export async function importAllHistoricalSensorData(
  onProgress?: (progress: ImportSensorDataProgress) => void
): Promise<ImportHistoricalSensorDataResult> {
  const configuredFrom = normalizeUnixTimestamp(getRequiredEnv("SENSOR_HISTORICAL_FROM"));
  const latestStoredTimestamp = await getLatestStoredSensorTimestamp();
  const resumeOverlapHours = getEnvNumber("SENSOR_HISTORICAL_RESUME_OVERLAP_HOURS", 192);
  const from = latestStoredTimestamp === null
    ? configuredFrom
    : Math.max(configuredFrom, latestStoredTimestamp - resumeOverlapHours * 60 * 60);
  const to = process.env.SENSOR_HISTORICAL_TO?.trim() || undefined;
  return importHistoricalSensorData({
    from,
    to,
    aggrInterval: process.env.SENSOR_HISTORICAL_AGGR_INTERVAL || process.env.IOTOPEN_AGGR_INTERVAL || "1h",
    onProgress,
  });
}
