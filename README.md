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

The frontend also has a local `frontend/.env` for Vite-specific values.

## Notes

- The repository uses one root `package-lock.json` for the workspace.
- The nested `frontend/` and `server/` folders are kept as separate packages inside that workspace.
