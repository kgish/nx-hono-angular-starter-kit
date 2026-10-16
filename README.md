# Fullstack Nx monorepo

Angular frontend and Hono API on Bun, sharing Zod schemas through a Nx workspace,
backed by PostgreSQL and deployed as Docker containers with GitHub Actions.

| Layer    | Stack                                                               |
| -------- | ------------------------------------------------------------------- |
| Monorepo | Nx 23, single npm lockfile, TypeScript 6, ESLint module boundaries  |
| Frontend | Angular 22 (standalone, zoneless, signals), Vitest                  |
| Backend  | Hono 4 on Bun, Drizzle ORM (`bun:sql` driver), Zod 4, `bun test`    |
| Shared   | `@fullstack/schemas` (Zod contracts), `@fullstack/util` (API paths) |
| Database | PostgreSQL 18, Drizzle Kit migrations                               |
| Delivery | Multi-stage Dockerfiles, Docker Compose, GHCR, SSH deploy           |

## Layout

```
apps/
  api/                 Hono app on Bun (scope:api, type:app)
  web/                 Angular app (scope:web, type:app)
libs/
  shared/schemas/      Zod schemas + inferred types used by both sides (scope:shared)
  shared/util/         Framework-free helpers such as ApiPaths (scope:shared)
  api/db/              Drizzle schema, client, repository, migrations (scope:api)
  web/data-access/     TodoApi (HttpClient) + signal-based TodoStore (scope:web)
  web/feature-todos/   Lazy-loaded todos page (scope:web)
deploy/                Production compose file and server .env example
.github/workflows/     CI and deploy pipelines
```

`eslint.config.mjs` enforces the boundaries: web and api code can only import their own
scope plus `scope:shared`, and shared libraries cannot import anything framework-specific.

### One schema, validated three times

`libs/shared/schemas` defines `CreateTodoSchema`, `UpdateTodoSchema`, `TodoSchema`, etc.

- The API validates request bodies and params with them (`@hono/zod-validator`) and returns a
  shared `ApiError` shape on failure.
- The Angular form validates input with the same schema before calling the API.
- `TodoApi` parses every response with them, so a contract drift fails loudly in the client.

## Prerequisites

- Node.js 24 (npm 11) and Bun 1.4 (`.nvmrc`, `.bun-version`)
- Docker with Compose v2

## Getting started

First time only:

```sh
npm ci
cp .env.example .env          # Bun loads .env automatically
```

Then start everything the app needs, from the repository root:

```sh
npm run db:up                 # PostgreSQL in Docker on localhost:5432
npm run dev                   # API on :3000 (migrates on start), web on :4200
```

Open http://localhost:4200. The Angular dev server proxies `/api` to `localhost:3000`
(`apps/web/proxy.conf.json`), and both servers reload when files change.

To stop, press Ctrl+C in the `npm run dev` terminal (stops the API and web servers) and run
`docker compose stop db` (the data stays in the `db-data` volume).

To run the whole stack in containers instead, see [Docker](#docker).

### Troubleshooting

**Port 5432 is already in use**, for example by another project's PostgreSQL container: stop
that container, or publish this project's database on another port. Create
`compose.override.yaml` (gitignored and loaded automatically by Docker Compose; `!override`
needs Compose 2.24+):

```yaml
services:
  db:
    ports: !override
      - '5433:5432'
```

and point the API at it in `.env`:

```sh
DATABASE_URL=postgres://app:app@localhost:5433/app
```

**The web server fails with `Port 3000 is already in use`**: `.env` sets `PORT`. Nx loads
`.env` into every task and the Angular dev server prefers `PORT` over `--port`, so keep `PORT`
out of `.env`. The API defaults to 3000.

### Everyday commands

```sh
npx nx serve api              # bun --watch
npx nx serve web
npx nx test api               # bun test
npx nx run-many -t lint test typecheck build
npx nx affected -t test       # only what changed
npx nx graph                  # dependency graph
```

### Database changes

1. Edit `libs/api/db/src/lib/schema.ts`.
2. `npm run db:generate -- --name=<change>` writes SQL to `libs/api/db/migrations`.
3. Commit the migration. The API applies pending migrations on start
   (`RUN_MIGRATIONS=false` to disable; `npm run db:migrate` runs them on demand).

## Docker

```sh
docker compose up --build     # db + api + web on http://localhost:8080
docker compose down           # stop; add -v to also delete the database volume
```

This is closer to production but doesn't reload on code changes, so use `npm run dev` for
day-to-day work. The database still publishes port 5432 (see
[Troubleshooting](#troubleshooting)).

- `apps/api/Dockerfile`: installs production deps with npm, bundles `main.ts` and
  `migrate.ts` with `bun build`, runs on `oven/bun:1.4-alpine` as the `bun` user.
- `apps/web/Dockerfile`: builds Angular with Nx and serves it from nginx, which also
  proxies `/api/` to the API (`API_URL`, default `http://api:3000`).

## CI/CD

- **`ci.yml`** (pull requests, and called by deployment): `nx format:check`, then
  `nx affected -t lint test typecheck build`, plus a job that runs the bundled API against a
  PostgreSQL service container and smoke-tests the CRUD endpoints.
- **`deploy.yml`** (push to `main` or manual): runs CI, builds and pushes
  `ghcr.io/<owner>/<repo>-api` and `-web` tagged with the commit SHA and `latest`, then
  SSHes to the server, uploads `deploy/compose.prod.yaml` and runs
  `docker compose pull && docker compose up -d --wait`.

### Server setup (one time)

1. Install Docker Engine with the Compose plugin on the server and create a deployment user that
   can run `docker`.
2. Create the deployment directory (default `/opt/fullstack`) and copy `deploy/.env.example`
   to `.env` there with a real `POSTGRES_PASSWORD`.
3. In the GitHub repository settings, add an environment named `production` and configure:

   | Kind     | Name              | Value                                         |
   | -------- | ----------------- | --------------------------------------------- |
   | Secret   | `SSH_HOST`        | Server hostname or IP                         |
   | Secret   | `SSH_USER`        | Deploy user                                   |
   | Secret   | `SSH_PRIVATE_KEY` | Private key whose public key is authorized    |
   | Secret   | `SSH_KNOWN_HOSTS` | Output of `ssh-keyscan <host>`                |
   | Secret   | `SSH_PORT`        | Optional, defaults to 22                      |
   | Variable | `DEPLOY_PATH`     | Optional, defaults to `/opt/fullstack`        |
   | Variable | `APP_URL`         | Optional, shown on the deployment             |
   | Variable | `DEPLOY_ENABLED`  | `true` to turn on the deploy job (repo level) |

The web container listens on `HTTP_PORT` (default 80). Put a TLS-terminating reverse proxy
such as Caddy or Traefik in front of it for HTTPS.
