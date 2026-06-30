# DORMS Server

This repository contains the backend server for the [DORMS](https://github.com/your-org/DORMS) project.

## Overview

The DORMS server provides REST API endpoints and real-time WebSocket communication for the DORMS application. It manages user authentication, water consumption data, XP and feedback scoring, and shop/item management for dormitory gamification.

## Features

- User registration and authentication (JWT)
- Water usage data ingestion and statistics
- XP and feedback scoring system
- Shop and inventory management
- Real-time updates via Socket.IO
- Scheduled background jobs (cron)

## Tech Stack

- Node.js
- TypeScript
- Express
- Socket.IO
- MySQL & PostgreSQL
- Zod (validation)
- node-cron

## Getting Started

1. Clone this repository.
2. Install dependencies:

   ```sh
   npm install
   ```

3. Configure your `.env` file with database and JWT settings.
4. Build and start the server:

   ```sh
   npm run build
   npm start
   ```

## Project Structure

- `src/` - Main source code
  - `routes/` - Express and Socket.IO route handlers
  - `services/` - Business logic and background jobs
  - `middleware/` - Validation and data processing
  - `data/` - Static data and SQL scripts
  - `jobs/` - Scheduled tasks

## License

MIT

---

This is the official backend server for the [DORMS](https://github.com/Laitila93/DORMS) project.