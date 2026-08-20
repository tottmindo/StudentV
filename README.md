# StudentV

StudentV is a workspace with a Vue frontend and a TypeScript/Express backend.

## Layout

- `frontend/` - Vue 3 + Vite app
- `server/` - API, sockets, database access, and scheduled jobs
- `.env` - shared local development environment values

## Setup

Install dependencies from the repository root:

```sh
npm install
```

## Development

Start both frontend and backend from the repository root:

```sh
npm run dev
```

Frontend:

```sh
npm run dev:frontend
```

Backend:

```sh
npm run dev:backend
```

## Build

Build both apps from the repository root:

```sh
npm run build
```

## Environment

Use the root `.env` for local development. The most important values are:

- `PG_DB_HOST`, `PG_DB_USER`, `PG_DB_PASSWORD`, `PG_DB_DATABASE`, `PG_DB_PORT`
- `JWT_SECRET`
- `PORT`, `HOST`
- `VITE_API_BASE_URL`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`
- `SMTP_SECURE` (`true` for implicit TLS, normally port 465) and `APP_URL`
- `SMTP_PREFER_IPV4` (defaults to `true`; set to `false` to use Nodemailer's
  normal dual-stack resolution, for example on an IPv6-only deployment)
- `CORS_ORIGINS` (comma-separated frontend origins; defaults to `http://localhost:5173`)
- `TRUST_PROXY=true` when the API is behind one trusted reverse proxy, so rate limits use the real client IP
- `CLEANING_GENERATION_MONTHS` (defaults to `6`) controls how far ahead cleaning weeks are populated
- `CLEANING_SCHEDULE_CRON` (defaults to `0 8 * * *`) and `CLEANING_SCHEDULE_TIMEZONE` (defaults to `Europe/Stockholm`) control the periodic idempotent schedule check
- `CLEANING_SCHEDULE_ENABLED=false` disables the automatic check (the admin button remains available)
- `RESIDENT_DEACTIVATION_DELAY_DAYS` (defaults to `30`) controls how long a replaced resident can still sign in before their account is deactivated
- `RESIDENT_DEACTIVATION_CRON` (defaults to hourly) and `RESIDENT_DEACTIVATION_TIMEZONE` control the deactivation check; set `RESIDENT_DEACTIVATION_ENABLED=false` to disable it

## Database setup

Create the PostgreSQL database, then apply the PostgreSQL schema (which includes
account provisioning and password recovery):

```sh
createdb dorms_db
psql -d dorms_db -f server/src/data/database-and-simulation/generate-postgres.sql
```

For a local connection, configure the root `.env` like this:

```sh
PG_DB_HOST=localhost
PG_DB_PORT=5432
PG_DB_DATABASE=dorms_db
PG_DB_USER=postgres
PG_DB_PASSWORD=your-password
```

The application accepts the former `DB_*` names as a temporary fallback, but
new deployments should use the `PG_DB_*` variables. PostgreSQL is the only
supported database. The database directory contains one complete schema and
one development-data script; changes to database features belong in those two
files instead of separate migration or fixture fragments.

For an existing database created before delayed resident deactivation was
added, apply its idempotent migration once:

```sh
npm run db:migrate:resident-deactivation -w server
```

To load the PostgreSQL development fixtures, which erase the current
application data, run:

```sh
CONFIRM_TEST_DATA=true npm run db:seed -w server
```

See `RENDER.md` for deploying and initializing a Render Postgres database.

All seeded accounts use `test123`. For example, use
`admin1@example.test` for an administrator or `clara@example.test` for a
resident. `emma@example.test` is seeded with `mustChangePassword = TRUE` to
exercise the first-login flow. Addresses under `example.test` cannot receive
real email and are used to prevent accidental delivery.

The frontend also has a local `frontend/.env` for Vite-specific values.

The PostgreSQL development seed includes houses 12 and 14, floors 1–5, and
eight rooms per floor. Room numbers use `house-floor-room` notation: `1251`
is house 12, floor 5, room 1. It seeds an occupied resident in rooms 1–7 of
each floor (leaving room 8 vacant), plus events, sensors, and chats on every
floor. Generated residents use `resident-<room-number>@example.test`, username
`resident<room-number>`, and password `test123`.

Administrators are global accounts with no dorm or room assignment. This keeps
physical locations exclusive to residents and allows administrators to manage
all dorms.

## Notes

- The repository uses one root `package-lock.json` for the workspace.
- The nested `frontend/` and `server/` folders are kept as separate packages inside that workspace.
