# Render PostgreSQL setup

This backend can connect either with the five `PG_DB_*` variables already in
your `.env`, or with Render's single `DATABASE_URL`. `DATABASE_URL` is the
recommended Render configuration because it is supplied directly from the
database and includes the correct private-network host.

## 1. Create the database

In Render, choose **New → PostgreSQL**, select the same region as the backend,
and create the database. On its **Info** page, copy the **Internal Database
URL**. Use the internal URL for a Render web service; the external URL is only
for running the commands from your own computer.

## 2. Set backend environment variables

In the backend service's **Environment** page, set the following values:

```text
DATABASE_URL=<Render Internal Database URL>
JWT_SECRET=<a long random secret>
NODE_ENV=production
```

`DATABASE_URL` takes precedence over the individual `PG_DB_*` variables. If
your existing `PG_DB_HOST` already contains a complete `postgresql://...` URL,
it also works; moving that value to `DATABASE_URL` is clearer. If you want to
use separate credentials instead, add all of these exact keys to Render and do
not set `DATABASE_URL`:

```text
PG_DB_HOST
PG_DB_PORT=5432
PG_DB_DATABASE
PG_DB_USER
PG_DB_PASSWORD
PG_SSL=true
```

Do not commit `.env`, the database URL, or any passwords. Render can bulk-add
variables from an `.env` file, but check the selected keys before saving so
frontend-only or local-only values are not accidentally published.

## 3. Initialize the schema

From a terminal on your computer, load the Render **external** connection URL
into `DATABASE_URL` (or export the `PG_DB_*` values), then run:

```sh
npm ci
npm run db:schema -w server
```

The schema command rebuilds the target database and deletes its existing data.
Use it only for initial setup or an intentional reset, never as a routine
production migration. It creates the tables, bootstrap administrator, and base
cleaning tasks in `server/database/migrations/generate-postgres.sql`.

Before exposing the service, sign in as `admin@studentv.local` with temporary
password `ChangeMe-StudentV-2026!`, complete the required password change, and
replace the placeholder email with an address you control.

## 4. Add test data (optional)

This command deletes all StudentV data and replaces it with development
fixtures. It intentionally requires an explicit confirmation:

```sh
CONFIRM_TEST_DATA=true npm run db:seed -w server
```

The fixture logins all use password `test123`:

```text
admin1@example.test     clara@example.test
admin2@example.test     alice@example.test
admin3@example.test     emma@example.test
```

`emma@example.test` is intentionally provisioned with a temporary password
to exercise the first-login flow.

## 5. Deploy the backend

Create a Render **Web Service** from this repository with these settings:

```text
Runtime:       Node
Build command: npm ci && npm run build -w server
Start command: npm run start -w server
```

Do not use `npm run dev` on Render: it starts Vite and nodemon instead of the
compiled API service. Also remove any local `HOST=127.0.0.1` or
`PG_DB_HOST=localhost` value from the Render service environment.

After adding the environment variables, deploy the service. For future schema
changes, run `npm run db:schema -w server` as a Render pre-deploy command on a
paid web service, or run it from your computer against the external URL before
deploying the application.
