/**
 * Main server setup and configuration file.
 * Sets up Express server with Socket.IO integration and database connection.
 * 
 * @module index
 * 
 * Dependencies:
 * - Express for HTTP server and API routing
 * - Socket.IO for real-time bidirectional communication
 * - JWT for authentication
 * - PostgreSQL database connection pool
 * 
 * Features:
 * - CORS enabled server configuration
 * - WebSocket authentication using JWT
 * - Room-based socket connections for dorms
 * - Database connection testing
 * - Scheduled scoring system
 * 
 * Environment Variables:
 * - PORT: Server port number (default: 3000)
 * - JWT_SECRET: Secret key for JWT verification
 * 
 * @requires cors
 * @requires dotenv
 * @requires http
 * @requires socket.io
 * @requires express
 * @requires jsonwebtoken
 */
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";
import authRoutes from "./routes/authRoutes.js";
import sensorDataRoutes from "./routes/sensorDataRoutes.js";
import usageRoutes from "./routes/usageRoutes.js";
import { Data } from "./data.js";
import { Socket } from "socket.io";
import { sockets } from "./sockets.js";
import "./jobs/scheduler.js";
import jwt from "jsonwebtoken";
import "./config/env.js";
import { setIO } from "./routes/socketManager.js";
import { getJwtSecret } from "./config/jwt.js";
console.log('Scoring scheduler started...');

const app = express();
if (process.env.TRUST_PROXY === "true") app.set("trust proxy", 1);
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",").map(origin => origin.trim()).filter(Boolean);
const httpServer = createServer(app); // Pass express app to HTTP server
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

setIO(io);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error("Origin is not allowed by CORS."));
  },
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", authRoutes);
app.use("/api/sensor-data", sensorDataRoutes);
app.use("/api/usage", usageRoutes);

const data = new Data();

// WebSocket setup
io.on("connection", async (socket: Socket) => {
  const token = socket.handshake.auth.token;

  let dormID: number | null = null;
  let userID: number | null = null;
  let role: string | "";

  if (token) {
    try {
      const decoded: any = jwt.verify(token, getJwtSecret());
      dormID = decoded.dormID;
      userID = decoded.userID;
      role = decoded.role;

      const [authRows]: any = await pool.query(
        "SELECT credentialVersion, active, mustChangePassword FROM users WHERE userID = ? LIMIT 1",
        [userID]
      );
      if (!authRows[0]?.active || authRows[0].mustChangePassword || authRows[0].credentialVersion !== decoded.credentialVersion) {
        socket.emit("auth-error", { message: "This session is no longer valid." });
        socket.disconnect(true);
        return;
      }

      if (dormID && userID) {
        socket.join(`dorm-${dormID}`);
        socket.join(`user-${userID}`);
        console.log(`✅ Authenticated socket ${socket.id} joined dorm room: dorm-${dormID}`);
        sockets(socket, data, dormID, userID, role);

        try {
          const dashboard = await data.getDashboard(userID, dormID);
          socket.emit("dashboard", dashboard);
        } catch (err) {
          console.error(`Error sending dashboard to socket ${socket.id}:`, err);
          socket.emit("error", { message: "Failed to send dashboard." });
        }
      }
    } catch (err) {
      console.warn(`⚠️ Invalid token for socket ${socket.id}.`);
      socket.emit("auth-error", { message: "Invalid or expired session." });
      socket.disconnect(true);
    }
  } else {
    console.log(`🟡 Unauthenticated socket connected: ${socket.id}`);
  }

  socket.on("disconnect", () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});



// Start server
const PORT = process.env.PORT || 3000;
// Render requires a public bind address even if a local HOST value was
// accidentally imported with the service environment variables.
const HOST = process.env.RENDER === "true" ? "0.0.0.0" : (process.env.HOST || "0.0.0.0");
httpServer.listen(Number(PORT), HOST, () => {
  console.log(`🚀 Server with Socket.io running on ${HOST}:${PORT}`);
});

import pool from "./db.js";

async function testConnection() {
  try {
    const [rows]: any[] = await pool.query("SELECT 1 + 1 AS result");
    const result = rows[0]?.result;
    console.log("✅ Database connection successful! Test query result:", result);
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  }
}

testConnection();
