# StudentV handover guide

This document is the starting point for a new maintainer. `README.md` contains
the local setup commands, `ARCHITECTURE.md` explains where code belongs, and
`RENDER.md` covers the current production database/deployment workflow.

## What the system does

StudentV is a bilingual resident portal for a student dormitory. Residents can
view water usage, events, surveys, cleaning rotations, community profiles, and
real-time chats. Administrators manage residents, dorm floors, events, sensors,
and cleaning schedules. Researchers have read/analysis access to surveys,
water analytics, usage statistics, and their own account, but not resident-only
features or administrator mutations.

The application has three processes:

1. The Vue/Vite frontend in `frontend/` serves the browser UI.
2. The Express/Socket.IO server in `server/` provides HTTP and real-time APIs,
   runs scheduled maintenance jobs, and reads/writes PostgreSQL.
3. The optional Python event scraper in
   `server/src/integrations/event-scrapers/` writes external events directly to
   PostgreSQL. It is deployed and scheduled separately from the Node server.

## Runtime flow

The browser authenticates through `POST /api/auth/login`. It keeps the returned
JWT and user context in `sessionStorage`, so closing a browser tab ends that
tab's session. HTTP calls send the JWT as a bearer token. Socket.IO sends the
same token in the connection handshake.

Both transports verify the JWT against the current database record. A user is
rejected if the account is inactive or its `credentialVersion` changed. Password
changes and administrative resets increment that version, invalidating existing
sessions. Accounts provisioned with a temporary password may only use the
password-change flow until `mustChangePassword` is cleared.

After socket authentication, a resident joins `dorm-<dormID>` for floor-wide
updates and every user joins `user-<userID>` for private notifications. The
server emits `authenticated` only after all feature listeners are registered;
frontend code that immediately requests socket data should wait for this event.

## Roles and access

| Role | Location | Intended access |
| --- | --- | --- |
| `STUDENT` | Must have a dorm and room | Resident pages and dorm-scoped data |
| `RESEARCHER` | No room required | Analytics, surveys, app usage, account |
| `ADMIN` | Global; no dorm or room | Research access plus user, dorm, event, and sensor administration |

Frontend guards improve navigation but are not a security boundary. All new
protected server endpoints must use `authenticate` and the appropriate
`requireCompletedAccount`, `requireAdmin`, or `requireResearchAccess`
middleware. Resident endpoints must also derive the dorm from `req.authUser`;
never trust a client-provided dorm ID for authorization.

## Code ownership map

| Change | Primary files |
| --- | --- |
| Login, accounts, roles, resident provisioning | `server/src/modules/auth/`, `frontend/src/features/auth/`, `frontend/src/features/account/` |
| Water readings, imports, analytics | `server/src/modules/water/`, `frontend/src/features/water/` |
| Events and invitations | `server/src/modules/events/`, event handlers in `server/src/sockets.ts`, `frontend/src/features/events/` |
| Chat and unread state | `server/src/modules/chat/`, chat handlers in `server/src/sockets.ts`, `frontend/src/features/chat/` |
| Cleaning rotation and swaps | `server/src/jobs/scheduler.ts`, cleaning methods in `server/src/database/dataRepository.ts` and `server/src/sockets.ts`, `frontend/src/features/cleaning/` |
| Community profiles and task governance | `server/src/modules/community/`, `frontend/src/features/community/` and cleaning components |
| Surveys | survey handlers in `server/src/sockets.ts`, `frontend/src/features/surveys/` |
| Shared browser infrastructure | `frontend/src/shared/composables/` |
| Database schema and fixtures | `server/database/migrations/generate-postgres.sql`, `server/database/seeds/add-test-data-postgres.sql` |
| Translations | `frontend/src/i18n/locales/en.json` and `sv.json` |

`server/src/data.ts` is a compatibility facade over the large legacy
`Data` repository. Do not add unrelated responsibilities to it. Prefer a
domain service/repository under `server/src/modules/<domain>/` and gradually
move callers out of `dataRepository.ts` when touching an area.

## Database conventions

PostgreSQL is the only supported database. `generate-postgres.sql` is the
canonical complete schema and is deliberately idempotent. Keep it able to
initialize an empty database. For a production change that existing databases
also need, add an idempotent one-off migration and a matching npm script, then
fold the final state into the canonical schema.

The main table groups are:

- Identity: `dorms`, `room`, `users`, `residentprofiles`,
  `passwordresettokens`.
- Surveys/events: `survey*`, `events`, `eventinvitations`,
  `activatedevents`, `externalevents`, `nationsguideevents`.
- Chat: `chat`, `chatmembers`, `chatdirectconversations`, `chatblocks`,
  `chatreadstate`, `chathistory`, `chatmessagereactions`.
- Water: `sensor`, `sensor_data`, `sensor_notes`.
- Cleaning: `cleaningtasktemplate`, `cleaningtaskproposals`,
  `cleaningtaskproposalvotes`, `cleaningweeks`, `cleaningassignments`,
  `cleaningweekswaprequests`.
- Analytics: `page_visit_stats`.

`server/src/database/pool.ts` intentionally exposes a MySQL-shaped
`pool.query()` result (`[rows, metadata]`) and converts `?` placeholders to
PostgreSQL parameters. This compatibility layer is why legacy repository code
does not look like normal `pg` code. New SQL must still use parameters; never
interpolate user values.

The development seed is destructive and requires `CONFIRM_TEST_DATA=true`.
Never run it against a database whose contents must be preserved.

## Scheduled and external work

Importing `server/src/jobs/scheduler.ts` registers these jobs inside the API
process:

| Job | Default | Disable with |
| --- | --- | --- |
| Ensure cleaning weeks exist | Daily 08:00 Europe/Stockholm | `CLEANING_SCHEDULE_ENABLED=false` |
| Import latest IoT water readings | Every 15 minutes | `SENSOR_SYNC_ENABLED=false` |
| Deactivate expired replaced residents | Hourly | `RESIDENT_DEACTIVATION_ENABLED=false` |

The cleaning generator is idempotent: it preserves valid assignments, fills a
configured horizon, repairs missing tasks, and reassigns weeks whose resident
no longer exists. Keep that property when changing its algorithm.

IoT Open imports require the `IOTOPEN_*` configuration used in
`sensorDataImportService.ts`. Historical imports may be long-running and are
protected either by administrator authentication or `SENSOR_IMPORT_TOKEN` for
an external scheduler. Treat that token like a password.

## Configuration

The backend loads the repository-root `.env` regardless of its working
directory. Vite reads `frontend/.env`; only variables prefixed with `VITE_` are
available to browser code. Do not put secrets in a Vite variable.

Required in production:

- PostgreSQL: `DATABASE_URL`, or all five `PG_DB_*` variables. Add
  `PG_SSL=true` when the provider requires TLS.
- Authentication: a long, random `JWT_SECRET`.
- Browser/API connection: `VITE_API_BASE_URL` at frontend build time and the
  matching frontend origins in backend `CORS_ORIGINS`.

Feature-dependent values:

- Email: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`,
  `SMTP_SECURE`, `APP_URL`, and optionally `SMTP_PREFER_IPV4`.
- IoT imports: `IOTOPEN_API_BASE_URL`, `IOTOPEN_CLIENT_ID`,
  `IOTOPEN_INSTALLATION_ID`, sensor/value filters, aggregation settings, and
  optionally `SENSOR_IMPORT_TOKEN`.
- Scheduling: the `*_ENABLED`, `*_CRON`, and `*_TIMEZONE` variables described
  above, plus `CLEANING_GENERATION_MONTHS`.

See `README.md` for the remaining defaults. When adding configuration, document
it there, validate it near startup, and add it to the deployment environment.

## Safe change workflow

1. Start from the root with `npm install` and `npm run dev`.
2. Put feature code in the ownership area shown above. Add both English and
   Swedish translations for visible text.
3. For schema work, update the canonical schema, any necessary incremental
   migration, and the development seed together.
4. Run `npm test`, then `npm run build`. The build type-checks both workspaces.
5. Manually exercise role boundaries and a full page reload. For real-time
   features, also test reconnecting after stopping and restarting the backend.
6. Apply production migrations before deploying code that depends on them.

Automated coverage is currently concentrated in frontend unit tests. There is
no backend test command, so changes to authentication, SQL, jobs, and socket
authorization require especially careful manual verification.

## Operational checks and troubleshooting

- **Frontend cannot call the API:** verify `VITE_API_BASE_URL`,
  `CORS_ORIGINS`, HTTPS/mixed-content rules, and that the URL has no accidental
  path suffix. Rebuild the frontend after changing Vite variables.
- **HTTP works but real-time screens do not:** check proxy WebSocket support,
  Socket.IO polling support, the browser network console, and the server's
  `auth-error` logs. Confirm the user joins the expected dorm/user room.
- **All sessions suddenly fail:** check `JWT_SECRET` consistency across server
  instances and whether `credentialVersion`, `active`, or password state was
  changed.
- **Database connection fails:** test the same `DATABASE_URL` outside the app,
  check TLS requirements, and ensure the database schema has been applied.
- **Emails do not arrive:** test SMTP credentials/network access and `APP_URL`.
  Seeded `example.test` addresses intentionally cannot receive email.
- **Cleaning weeks are absent:** inspect scheduler startup logs, cron/timezone
  values, active residents in the dorm, and run the admin generation action.
- **Water data is stale:** inspect the sensor sync logs, IoT credentials and
  configured sensor codes, then check the latest `sensor_data.recordedat`.

## Known maintenance risks

- `server/src/database/dataRepository.ts` and `server/src/sockets.ts` are large
  legacy coordination points. Keep new logic in domain services and make socket
  handlers thin.
- The REST and Socket.IO APIs share domain behavior but do not yet have one
  generated contract. When changing an event name or payload, search both
  `server/src` and `frontend/src` and update all producers and consumers.
- Runtime schema assurance functions exist for a few newer features. They are a
  compatibility safety net, not a substitute for applying the canonical schema
  and migrations during deployment.
- The API process currently owns scheduled jobs. Running multiple API replicas
  therefore runs each schedule in every replica. Before scaling horizontally,
  move jobs to one dedicated worker or add a distributed lock.

## First-day checklist for a new maintainer

- Run the app against local seeded data and sign in once as a resident, admin,
  and researcher.
- Read `server/src/index.ts`, `frontend/src/router/index.ts`,
  `server/src/shared/middleware/authenticate.ts`, and
  `frontend/src/shared/composables/socket.ts` to understand the request path.
- Confirm access to the production host, PostgreSQL provider, SMTP account,
  IoT Open account, DNS/frontend host, and whichever scheduler runs the Python
  scraper.
- Record where production secrets are stored and who can rotate them. Do not
  copy their values into this repository or handover notes.
- Confirm the latest schema/migrations applied in production and make a tested
  backup before the first database change.
