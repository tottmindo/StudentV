/** PostgreSQL connection pool and a small compatibility layer for the app's data access code. */
import { Pool, PoolClient, QueryResultRow } from "pg";
import "./config/env.js";

type ResultHeader = { affectedRows: number; insertId?: number };
type QueryResponse<T extends QueryResultRow = QueryResultRow> = [T[], ResultHeader];

const camelCaseColumns: Record<string, string> = {
  dormid: "dormID", roomid: "roomID", userid: "userID", eid: "eID",
  eventid: "eventID", chatid: "chatID", messageid: "messageID", tokenid: "tokenID",
  templateid: "templateID", weekid: "weekID", assignmentid: "assignmentID",
  sensorcode: "sensorCode", recordedat: "recordedAt", totalvolume: "totalVolume",
  dormaddress: "dormAddress", dormfloor: "dormFloor",
  currentliters: "currentLiters", historicalaverageliters: "historicalAverageLiters",
  coldliters: "coldLiters", warmliters: "warmLiters", latestreadingat: "latestReadingAt",
  totalliters: "totalLiters", averagewatertemp: "averageWaterTemp",
  peakwatertemp: "peakWaterTemp", averageliters: "averageLiters",
  activesensors: "activeSensors",
  last24hoursliters: "last24HoursLiters",
  averagecoldliters: "averageColdLiters", averagewarmliters: "averageWarmLiters",
  averagepeakwatertemp: "averagePeakWaterTemp",
  tempmin: "tempMin", tempmax: "tempMax", errorcode: "errorCode", ambienttemp: "ambientTemp",
  leakstatus: "leakStatus", passwordhash: "passwordHash", mustchangepassword: "mustChangePassword",
  credentialversion: "credentialVersion", expiresat: "expiresAt", usedat: "usedAt",
  createdat: "createdAt", answeredat: "answeredAt", startdate: "startDate", enddate: "endDate",
  multiplechoice: "multipleChoice", assigneduserid: "assignedUserID", completedat: "completedAt",
  basetaskid: "baseTaskID", createdbyuserid: "createdByUserID", assignedusername: "assignedUsername",
  requesteruserid: "requesterUserID", targetuserid: "targetUserID", sourceweekid: "sourceWeekID", targetweekid: "targetWeekID", requestid: "requestID",
  isimportant: "isImportant", isbasetask: "isBaseTask", iscompleted: "isCompleted",
  isdeleted: "isDeleted", activateduserid: "activatedUserID", taskname: "taskName",
  weektaskid: "weekTaskID", totaltasks: "totalTasks", completedtasks: "completedTasks",
  pendingtasks: "pendingTasks",
  adminnote: "adminNote", noteupdatedat: "noteUpdatedAt",
};

function camelCaseRow<T extends QueryResultRow>(row: T): T {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [camelCaseColumns[key] ?? key, value])) as T;
}

function convertPlaceholders(sql: string, values: unknown[] = []): { text: string; values: unknown[] } {
  let index = 0;
  const parameters: unknown[] = [];
  const text = sql.replace(/\?/g, () => {
    const value = values[index++];
    if (Array.isArray(value)) {
      if (!value.length) return "NULL";
      return value.map(item => {
        parameters.push(item);
        return `$${parameters.length}`;
      }).join(", ");
    }
    parameters.push(value);
    return `$${parameters.length}`;
  });
  if (index !== values.length) throw new Error("Query parameter count does not match placeholders.");
  return { text, values: parameters };
}

class PostgreSqlConnection {
  constructor(private readonly client: Pool | PoolClient, private readonly releaseClient?: () => void) {}

  async query<T extends QueryResultRow = QueryResultRow>(sql: string, values: unknown[] = []): Promise<QueryResponse<T>> {
    const query = convertPlaceholders(sql, values);
    const result = await this.client.query<T>(query);
    const rows = result.rows.map(camelCaseRow);
    const inserted = rows[0] && Object.values(rows[0]).find(value => typeof value === "number");
    return [rows, { affectedRows: result.rowCount ?? 0, insertId: typeof inserted === "number" ? inserted : undefined }];
  }

  async beginTransaction() { await this.client.query("BEGIN"); }
  async commit() { await this.client.query("COMMIT"); }
  async rollback() { await this.client.query("ROLLBACK"); }
  release() { this.releaseClient?.(); }
}

const connectionString = process.env.DATABASE_URL
  ?? (process.env.PG_DB_HOST?.startsWith("postgresql://") || process.env.PG_DB_HOST?.startsWith("postgres://")
    ? process.env.PG_DB_HOST
    : undefined);

const pgPool = new Pool({
  connectionString,
  host: process.env.PG_DB_HOST ?? process.env.DB_HOST,
  user: process.env.PG_DB_USER ?? process.env.DB_USER,
  password: process.env.PG_DB_PASSWORD ?? process.env.DB_PASSWORD,
  database: process.env.PG_DB_DATABASE ?? process.env.DB_DATABASE,
  port: Number(process.env.PG_DB_PORT ?? process.env.DB_PORT ?? 5432),
  max: 10,
  ssl: process.env.PG_SSL === "true" || Boolean(connectionString)
    ? { rejectUnauthorized: false }
    : undefined,
});

const pool = new PostgreSqlConnection(pgPool);
export default Object.assign(pool, {
  getConnection: async () => {
    const client = await pgPool.connect();
    return new PostgreSqlConnection(client, () => client.release());
  },
  end: () => pgPool.end(),
});
