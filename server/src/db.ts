
/**
 * MySQL connection pool configuration and setup.
 * Creates a connection pool using environment variables for database credentials.
 * 
 * Environment variables required:
 * - DB_HOST: Database host address
 * - DB_USER: Database user name
 * - DB_PASSWORD: Database password
 * - DB_DATABASE: Database name
 * - DB_PORT: Database port (optional, defaults to 3306)
 * 
 * Pool configuration:
 * - waitForConnections: True - queues connection requests when none are available
 * - connectionLimit: 10 - maximum number of connections in pool
 * - queueLimit: 0 - unlimited queue size
 * 
 * @module db
 * @exports pool - MySQL connection pool instance
 */
import mysql from "mysql2/promise";
import "./config/env.js";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT ? +process.env.DB_PORT : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  
});

export default pool;
