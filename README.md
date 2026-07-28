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

- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`, `DB_PORT`
- `JWT_SECRET`
- `PORT`, `HOST`
- `VITE_API_BASE_URL`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`
- `SMTP_SECURE` (`true` for implicit TLS, normally port 465) and `APP_URL`
- `CORS_ORIGINS` (comma-separated frontend origins; defaults to `http://localhost:5173`)
- `TRUST_PROXY=true` when the API is behind one trusted reverse proxy, so rate limits use the real client IP

## Database setup

The complete MySQL 8+ schema, including account provisioning and password
recovery, is contained in one file:

```sh
mysql -u <user> -p < server/src/data/database-and-simulation/generate-NEW.sql
```

Optional development data can then be loaded with:

```sh
mysql -u <user> -p dorms_db < server/src/data/database-and-simulation/add-test-data-expanded.sql
```

All seeded accounts use `test123`. For example, use
`admin1@example.test` for an administrator or `clara@example.test` for a
resident. `emma@example.test` is seeded with `mustChangePassword = TRUE` to
exercise the first-login flow. Addresses under `example.test` cannot receive
real email and are used to prevent accidental delivery.

The frontend also has a local `frontend/.env` for Vite-specific values.

## Notes

- The repository uses one root `package-lock.json` for the workspace.
- The nested `frontend/` and `server/` folders are kept as separate packages inside that workspace.
