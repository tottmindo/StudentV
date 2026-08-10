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

const poolConfig = {
  connectionString,
  host: process.env.PG_DB_HOST,
  port: Number(process.env.PG_DB_PORT || 5432),
  database: process.env.PG_DB_DATABASE,
  user: process.env.PG_DB_USER,
  password: process.env.PG_DB_PASSWORD,
  ssl: process.env.PG_SSL === "true" || Boolean(connectionString)
    ? { rejectUnauthorized: false }
    : undefined,
};

// For schema generation, drop and recreate database if it exists
if (file.includes("generate-postgres.sql")) {
  const targetDb = process.env.PG_DB_DATABASE || "dorms_db";
  
  // Create a system pool that connects to 'postgres' database
  // Strip database from connection string if present
  let systemConnectionString = connectionString;
  if (systemConnectionString) {
    systemConnectionString = systemConnectionString.replace(/\/[^/?]+(\?|$)/, "/postgres$1");
  }
  
  const systemPool = new Pool({
    connectionString: systemConnectionString,
    host: process.env.PG_DB_HOST,
    port: Number(process.env.PG_DB_PORT || 5432),
    database: "postgres",
    user: process.env.PG_DB_USER,
    password: process.env.PG_DB_PASSWORD,
    ssl: process.env.PG_SSL === "true" || Boolean(systemConnectionString)
      ? { rejectUnauthorized: false }
      : undefined,
  });
  
  const systemClient = await systemPool.connect();
  try {
    // Terminate any existing connections to the target database
    await systemClient.query(
      `SELECT pg_terminate_backend(pid)
       FROM pg_stat_activity
       WHERE datname = $1
         AND pid <> pg_backend_pid()`,
      [targetDb]
    );
    
    // Small delay to ensure connections are fully terminated
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Drop the database if it exists (use FORCE for PostgreSQL 13+)
    try {
      await systemClient.query(`DROP DATABASE IF EXISTS "${targetDb}" WITH (FORCE)`);
    } catch (dropError) {
      // Fallback for PostgreSQL versions before 13
      if (dropError.code === '42704' || String(dropError).includes('syntax error')) {
        await systemClient.query(`DROP DATABASE IF EXISTS "${targetDb}"`);
      } else {
        throw dropError;
      }
    }
    console.log(`Dropped existing database: ${targetDb}`);
    
    // Create a fresh database
    await systemClient.query(`CREATE DATABASE "${targetDb}"`);
    console.log(`Created fresh database: ${targetDb}`);
  } finally {
    systemClient.release();
    await systemPool.end();
  }
}

const pool = new Pool(poolConfig);
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
