import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: resolve(process.cwd(), "..", ".env") });

const [file, mode] = process.argv.slice(2);
if (!file) throw new Error("Usage: node scripts/run-sql.mjs <sql-file> [--seed]");
if (mode === "--seed" && process.env.CONFIRM_TEST_DATA !== "true") {
  throw new Error("Refusing to erase data. Run with CONFIRM_TEST_DATA=true to load test data.");
}

const connectionString = process.env.DATABASE_URL
  ?? (process.env.PG_DB_HOST?.startsWith("postgresql://") || process.env.PG_DB_HOST?.startsWith("postgres://")
    ? process.env.PG_DB_HOST
    : undefined);

const pool = new Pool({
  connectionString,
  host: process.env.PG_DB_HOST,
  port: Number(process.env.PG_DB_PORT || 5432),
  database: process.env.PG_DB_DATABASE,
  user: process.env.PG_DB_USER,
  password: process.env.PG_DB_PASSWORD,
  ssl: process.env.PG_SSL === "true" || Boolean(connectionString)
    ? { rejectUnauthorized: false }
    : undefined,
});

const sql = await readFile(resolve(process.cwd(), file), "utf8");
const statements = sql
  .replace(/^--.*$/gm, "")
  .split(";")
  .map(statement => statement.trim())
  .filter(Boolean);

const client = await pool.connect();
try {
  for (const statement of statements) {
    try {
      await client.query(statement);
    } catch (error) {
      // Schema creation is safe to repeat during a Render pre-deploy command.
      if (mode !== "--seed" && ["42P07", "42710"].includes(error.code)) continue;
      throw error;
    }
  }
  console.log(`Applied ${file}`);
} finally {
  client.release();
  await pool.end();
}
