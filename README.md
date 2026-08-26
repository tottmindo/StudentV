# StudentV

StudentV is a workspace with a Vue frontend and a TypeScript/Express backend.

New maintainers should begin with [HANDOVER.md](HANDOVER.md), then use
[ARCHITECTURE.md](ARCHITECTURE.md) for code placement and [RENDER.md](RENDER.md)
for the current production deployment workflow.

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

The backend always loads `.env` from the repository root. Vite separately loads
`frontend/.env`; only `VITE_` variables are exposed to browser code, so never
put secrets there. Restart the relevant development server after changing a
file. Values containing spaces or `#` should be quoted.

### Minimal local configuration

Create or update the root `.env`:

```dotenv
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

PG_DB_HOST=localhost
PG_DB_PORT=5432
PG_DB_DATABASE=dorms_db
PG_DB_USER=postgres
PG_DB_PASSWORD=your-local-postgres-password

# Generate a different long random value for production.
JWT_SECRET=local-development-only-change-me

# Avoid scheduled IoT API errors when no IoT Open credentials are configured.
SENSOR_SYNC_ENABLED=false
```

Create or update `frontend/.env`:

```dotenv
VITE_API_BASE_URL=http://localhost:3000
```

### Backend variables (`.env`)

Core runtime and database configuration:

| Variable | Required | Suggested value | Explanation |
| --- | --- | --- | --- |
| `NODE_ENV` | Production | `development` locally; `production` when deployed | Controls production-only security checks and runtime behavior. |
| `PORT` | No | `3000` | Port on which the API listens. |
| `HOST` | No | `0.0.0.0` | API bind address. On Render, `RENDER=true` forces `0.0.0.0`. |
| `DATABASE_URL` | Production alternative | Provider connection URL | Preferred single PostgreSQL connection string for hosted deployments. It takes precedence over individual host fields. Treat it as a secret. |
| `PG_DB_HOST` | Yes, unless using `DATABASE_URL` | `localhost` | PostgreSQL hostname. A PostgreSQL URL is also accepted here, although `DATABASE_URL` is clearer. |
| `PG_DB_HOST_PYTHON` | Event scraper only | `localhost` | PostgreSQL hostname used by the standalone Python event scraper. Usually the same as `PG_DB_HOST`; set the network-visible container/service hostname when they differ. |
| `PG_DB_PORT` | No | `5432` | PostgreSQL port. |
| `PG_DB_DATABASE` | Yes, unless using `DATABASE_URL` | `dorms_db` | PostgreSQL database name. |
| `PG_DB_USER` | Yes, unless using `DATABASE_URL` | `postgres` | PostgreSQL user. |
| `PG_DB_PASSWORD` | Yes, unless using `DATABASE_URL` | Your local/provider password | PostgreSQL password; keep it secret. |
| `PG_SSL` | Hosted databases | `true` when required by the provider | Enables TLS. A `DATABASE_URL` also enables TLS automatically. |
| `CORS_ORIGINS` | No | `http://localhost:5173` | Comma-separated, exact frontend origins allowed to call the API. Do not include paths. |
| `TRUST_PROXY` | Behind one trusted proxy | `true` on Render or a similar setup | Trusts one reverse proxy so client IPs and rate limits work correctly. |
| `RENDER` | Render sets it | `true` on Render | Render platform marker; normally do not set this manually. |

`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, and `DB_PASSWORD` are legacy
fallback aliases used by the application pool. New configuration should use
the corresponding `PG_DB_*` names; database scripts require `PG_DB_*`. The
optional Python event scraper uses `PG_DB_HOST_PYTHON` plus `PG_DB_PORT`,
`PG_DB_DATABASE`, `PG_DB_USER`, and `PG_DB_PASSWORD` from the environment in
which it is launched.

Authentication and account lifecycle:

| Variable | Required | Suggested value | Explanation |
| --- | --- | --- | --- |
| `JWT_SECRET` | Production | A random value of at least 32 bytes | Signs login tokens. The development fallback is intentionally not suitable for production. |
| `JWT_EXPIRATION` | No | `1h` | Login-token lifetime in the duration format accepted by `jsonwebtoken`, such as `1h` or `7d`. |
| `BCRYPT_SALT_ROUNDS` | No | `10` | Password-hashing cost. Higher values are slower; benchmark before changing it. |
| `RESIDENT_DEACTIVATION_DELAY_DAYS` | No | `30` | Days before a replaced resident account is deactivated. Must be a positive integer. |
| `RESIDENT_DEACTIVATION_ENABLED` | No | `true` | The job runs unless this is exactly `false`. |
| `RESIDENT_DEACTIVATION_CRON` | No | `0 * * * *` | Cron expression for the deactivation check (hourly by default). |
| `RESIDENT_DEACTIVATION_TIMEZONE` | No | `Europe/Stockholm` | IANA timezone used by the deactivation cron job. |

Cleaning schedule:

| Variable | Required | Suggested value | Explanation |
| --- | --- | --- | --- |
| `CLEANING_GENERATION_MONTHS` | No | `6` | Positive number of months of cleaning weeks to keep populated. |
| `CLEANING_SCHEDULE_ENABLED` | No | `true` | The automatic job runs unless this is exactly `false`; the admin action remains available when disabled. |
| `CLEANING_SCHEDULE_CRON` | No | `0 8 * * *` | Cron expression for the idempotent schedule check (daily at 08:00 by default). |
| `CLEANING_SCHEDULE_TIMEZONE` | No | `Europe/Stockholm` | IANA timezone used for cleaning weeks and the cron job. |

Email is required only for password-reset and temporary-password delivery. If
it is enabled, configure all credential/from fields together:

| Variable | Required for email | Suggested value | Explanation |
| --- | --- | --- | --- |
| `SMTP_HOST` | Yes | Your provider's SMTP hostname | Outbound mail server. |
| `SMTP_PORT` | Yes | `587` | Use `587` for STARTTLS or `465` for implicit TLS. |
| `SMTP_USER` | Yes | Provider username | SMTP login; keep it secret where appropriate. |
| `SMTP_PASSWORD` | Yes | Provider password/API key | SMTP credential; keep it secret. |
| `SMTP_SECURE` | No | `false` for port 587; `true` for 465 | Enables implicit TLS. Port 465 also enables it automatically. |
| `SMTP_PREFER_IPV4` | No | `true` | Prefers IPv4 DNS results. Set `false` for normal dual-stack resolution, such as on IPv6-only hosting. |
| `EMAIL_FROM` | Yes | `StudentV <no-reply@example.com>` | Sender shown on application email. |
| `APP_URL` | Yes | `http://localhost:5173` | Public frontend base URL placed in email links; omit a trailing slash. |

IoT Open water-data imports are optional. When used, `IOTOPEN_API_KEY` is
required and must be kept secret. Disable `SENSOR_SYNC_ENABLED` when the
integration is not configured.

| Variable | Required | Suggested/default value | Explanation |
| --- | --- | --- | --- |
| `IOTOPEN_API_KEY` | For any import | Provider API key | Authenticates requests to IoT Open. |
| `IOTOPEN_API_BASE_URL` | No | `https://lynx.iotopen.se/api/v3beta` | IoT Open API root. |
| `IOTOPEN_INSTALLATION_ID` | No | `1634` | Installation whose log data is imported; replace with the assigned ID. |
| `IOTOPEN_CLIENT_ID` | No | `1637` | Client ID used to construct MQTT-style log topics; replace with the assigned ID. |
| `IOTOPEN_DEFAULT_DORM_ID` | No | `1` | Dorm assigned to newly discovered sensors. |
| `IOTOPEN_SENSOR_CODES` | No | Empty | Comma-separated sensor codes. Empty means use sensor codes already stored in the database. |
| `IOTOPEN_VALUE_TYPES` | No | `total_volume,water_temp_min,water_temp_max,error_code,battery,ambient_temp,humidity,leak_status` | Comma-separated measurements requested and parsed. |
| `IOTOPEN_IMPORT_LIMIT` | No | `25000` | Positive maximum records requested per API batch. |
| `IOTOPEN_AGGR_METHOD` | No | `last` | Default API aggregation method. |
| `IOTOPEN_AGGR_INTERVAL` | No | `1h` | Default API aggregation interval. |
| `IOTOPEN_TOPIC_BATCH_SIZE` | No | `80` | Positive maximum number of topics per request. |
| `IOTOPEN_HISTORY_WINDOW_DAYS` | No | `7` | Positive historical time-window size per request. |
| `IOTOPEN_BATCH_DELAY_MS` | No | `100` | Delay between batches in milliseconds; `0` is accepted to disable the delay. |
| `IOTOPEN_MAX_RETRIES` | No | `3` | Positive retry limit for transient API/network failures. |
| `IOTOPEN_RETRY_BASE_MS` | No | `1000` | Positive base delay for exponential retry backoff. |
| `SENSOR_SYNC_ENABLED` | No | `false` without credentials; otherwise `true` | Latest-reading job runs unless this is exactly `false`. |
| `SENSOR_SYNC_CRON` | No | `*/15 * * * *` | Cron expression for latest-reading imports. |
| `SENSOR_SYNC_TIMEZONE` | No | `Europe/Stockholm` | IANA timezone for the sensor-sync cron job. |
| `SENSOR_LATEST_LOOKBACK_HOURS` | No | `2` | Positive lookback window used by each latest-reading import. |
| `SENSOR_LATEST_AGGR_INTERVAL` | No | `1h` | Aggregation interval for latest imports; falls back to `IOTOPEN_AGGR_INTERVAL`. |
| `SENSOR_HISTORICAL_FROM` | Full history import | A Unix timestamp or ISO date | Earliest point allowed for a full historical import. |
| `SENSOR_HISTORICAL_TO` | No | Empty/current time | Optional end timestamp/date for a historical import. |
| `SENSOR_HISTORICAL_AGGR_INTERVAL` | No | `1h` | Historical aggregation interval; falls back to `IOTOPEN_AGGR_INTERVAL`. |
| `SENSOR_HISTORICAL_RESUME_OVERLAP_HOURS` | No | `192` | Positive overlap when resuming, allowing late readings to be updated. |
| `SENSOR_IMPORT_TOKEN` | External importer only | A long random secret | Alternative bearer credential for import endpoints; administrators can use normal authentication instead. |

`CONFIRM_TEST_DATA=true` is a one-command safety flag, not persistent runtime
configuration. Set it only when intentionally running `npm run db:seed -w
server`, because that script erases current application data.

### Frontend variables (`frontend/.env`)

| Variable | Required | Suggested value | Explanation |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | Yes | `http://localhost:3000` locally; deployed API URL in production | API and Socket.IO base URL embedded into the frontend at build time. It must be allowed by the backend's `CORS_ORIGINS`. |

## Database setup

Create the PostgreSQL database, then apply the PostgreSQL schema (which includes
account provisioning and password recovery):

```sh
createdb dorms_db
psql -d dorms_db -f server/database/migrations/generate-postgres.sql
```

The generated database includes one bootstrap administrator and the global
base cleaning tasks:

```text
Email:              admin@studentv.local
Temporary password: ChangeMe-StudentV-2026!
```

The administrator is required to choose a username and new password on first
login. Do this before exposing a production deployment to the internet, then
replace the placeholder email with an address controlled by the administrator.

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
eight rooms per floor. Complete room numbers use `house + floor + one-digit
room` notation: `1251` is house 12, floor 5, room 1. It seeds an occupied resident in rooms 1–7 of
each floor (leaving room 8 vacant), plus events, sensors, and chats on every
floor. Generated residents use `resident-<room-number>@example.test`, username
`resident<room-number>`, and password `test123`.

Administrators are global accounts with no dorm or room assignment. This keeps
physical locations exclusive to residents and allows administrators to manage
all dorms.

### Fresh production database checklist

After generating a new production database:

1. Sign in with the bootstrap administrator, change its password immediately,
   and replace its placeholder email.
2. Create the real houses/floors and rooms before inviting residents. Confirm
   room numbers follow the application's house-floor-room convention.
3. Review the global cleaning templates and mark any rules that do not apply to
   the property inactive before generating cleaning weeks.
4. Set a long random `JWT_SECRET`, production database credentials/TLS,
   `CORS_ORIGINS`, `APP_URL`, and SMTP credentials. Disable sensor sync until
   valid IoT Open credentials and sensor mappings are present.
5. Run a backup and restore test, configure automated backups and retention,
   and restrict the database/network account to the access the application
   actually needs.
6. Verify password email delivery, administrator login and forced password
   change, resident provisioning, scheduled jobs, timezone, and frontend API
   connectivity before launch.
7. Monitor failed jobs and database capacity, and define a migration process
   before making later schema changes. The schema-generation command rebuilds
   the target database and must not be used as a routine production migration.

## Notes

- The repository uses one root `package-lock.json` for the workspace.
- The nested `frontend/` and `server/` folders are kept as separate packages inside that workspace.
