# Fullstack Nx monorepo

Angular frontend and Hono API on Bun, sharing Zod schemas through a Nx workspace,
backed by PostgreSQL and deployed as Docker containers with GitHub Actions.

| Layer    | Stack                                                               |
| -------- | ------------------------------------------------------------------- |
| Monorepo | Nx 23, single npm lockfile, TypeScript 6, ESLint module boundaries  |
| Frontend | Angular 22 (standalone, zoneless, signals), Vitest                  |
| Backend  | Hono 4 on Bun, Drizzle ORM (`bun:sql` driver), Zod 4, `bun test`    |
| Auth     | better-auth: email/password, session cookie, Drizzle adapter        |
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
  web/data-access/     TodoApi/AuthApi (HttpClient), signal-based TodoStore/AuthStore,
                       authGuard/guestGuard (scope:web)
  web/feature-auth/    Lazy-loaded login, register and forgot-password pages (scope:web)
  web/feature-todos/   Lazy-loaded todos page (scope:web)
  web/i18n/            LanguageStore: active UI language via ngx-translate (scope:web)
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

### Authentication

The API mounts [better-auth](https://www.better-auth.com) at `/api/auth` (`apps/api/src/auth.ts`)
with email and password sign-in. Users, sessions and accounts live in PostgreSQL
(`users`, `sessions`, `accounts`, `verifications` in `libs/api/db`); the session is an
HttpOnly cookie, so the web app keeps no tokens. `/api/todos` answers `401` without a session
(`requireSession`). Each todo belongs to the user who created it (`todos.user_id`): users
only see and change their own, and someone else's todo answers `404`.

- **Demo user:** outside production the API creates `demo@example.org` with the password `demo`
  on start (`SEED_DEMO_USER`). Its password is shorter than the 8 characters registration
  requires, so it is seeded server-side rather than through sign-up.
- **Web:** `/login`, `/register`, `/forgot-password` and `/reset-password`
  (`@fullstack/web/feature-auth`), built with Signal Forms that validate with the shared schemas
  (`SignInSchema`, `SignUpSchema`, `PasswordSchema`, …); the API checks those request bodies
  against the same schemas. `authGuard` sends visitors without a session to `/login`.
- **Password reset:** `/forgot-password` asks the API to email a link (`apps/api/src/emails.ts`)
  in the UI language, which the web app sends as `Accept-Language` (`languageInterceptor`). The
  link is valid once, for an hour; it opens better-auth's token check, which redirects to
  `/reset-password?token=…`. Saving a new password signs out every session. The API answers the
  same for unknown addresses and sends the email after responding, so neither the answer nor its
  timing tells whether an account exists.
- **Email** goes out over SMTP (`nodemailer`, `apps/api/src/mailer.ts`). In development that is
  [Mailpit](https://mailpit.axllent.org) from `npm run db:up`: it catches every email, readable at
  http://localhost:8025.
- The better-auth endpoints answer errors with better-auth's own `{ code, message }` body
  (`AuthErrorSchema`), not `ApiError`.

| Variable                    | Default                                             | Purpose                                                              |
| --------------------------- | --------------------------------------------------- | -------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`        | development secret; required in prod                | Signs session cookies; at least 32 characters                        |
| `BETTER_AUTH_URL`           | inferred from each request                          | Public URL of the web app; better-auth only accepts sign-ins from it |
| `BETTER_AUTH_COOKIE_PREFIX` | `better-auth`                                       | Session cookie name prefix; `compose.yaml` uses `todos-docker`       |
| `SEED_DEMO_USER`            | `true`, or `false` when `NODE_ENV=production`       | Creates the demo user on start                                       |
| `SMTP_URL`                  | `smtp://localhost:1025` (Mailpit); required in prod | SMTP server for emails, e.g. `smtps://user:password@host:465`        |
| `MAIL_FROM`                 | `Todos <no-reply@localhost>`; required in prod      | Sender of the emails                                                 |

### Translations

The UI is in English and Dutch through [ngx-translate](https://ngx-translate.org). Strings
live in `apps/web/public/i18n/<lang>.json`; templates use the `translate` pipe. At start-up
`LanguageStore` (`@fullstack/web/i18n`) picks the language the user last chose (saved in
`localStorage`), else the first supported browser language, else English. To add a language,
add its JSON file and an entry in `LANGUAGES` in `libs/web/i18n/src/lib/language-store.ts`.

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
npm run db:up                 # PostgreSQL on localhost:5432, Mailpit on :1025 / :8025
npm run dev                   # API on :3000 (migrates on start), web on :4200
```

Open http://localhost:4200 and sign in as `demo@example.org` / `demo`, or create an account.
The Angular dev server proxies `/api` to `localhost:3000`
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
day-to-day work. `compose.yaml` creates the demo user and sets `BETTER_AUTH_URL` to
`http://localhost:8080`, so open that exact address (not `127.0.0.1`) to sign in. It uses its own
session cookie (`BETTER_AUTH_COOKIE_PREFIX`), so you can be signed in on :8080 and :4200 at once. Emails go to
the Mailpit container, at http://localhost:8025. The database still publishes port 5432 (see
[Troubleshooting](#troubleshooting)).

- `apps/api/Dockerfile`: installs production deps with npm, bundles `main.ts` and
  `migrate.ts` with `bun build`, runs on `oven/bun:1.4-alpine` as the `bun` user.
- `apps/web/Dockerfile`: builds Angular with Nx and serves it from nginx, which also
  proxies `/api/` to the API (`API_URL`, default `http://api:3000`).

## CI/CD

- **`ci.yml`** (pull requests, and called by deployment): `nx format:check`, then
  `nx affected -t lint test typecheck build`, plus a job that runs the bundled API against a
  PostgreSQL and a Mailpit service container, signs in as the demo user, smoke-tests the CRUD
  endpoints and resets the demo password through the emailed link.
- **`deploy.yml`** (push to `main` or manual): runs CI, builds and pushes
  `ghcr.io/<owner>/<repo>-api` and `-web` tagged with the commit SHA and `latest`, then
  SSHes to the server, uploads `deploy/compose.prod.yaml` and runs
  `docker compose pull && docker compose up -d --wait`.

### Server setup (one time)

1. Install Docker Engine with the Compose plugin on the server and create a deployment user that
   can run `docker`.
2. Create the deployment directory (default `/opt/fullstack`) and copy `deploy/.env.example`
   to `.env` there with a real `POSTGRES_PASSWORD`, a random `BETTER_AUTH_SECRET`
   (`openssl rand -base64 32`), `BETTER_AUTH_URL` set to the public URL of the app, and the
   `SMTP_URL` and `MAIL_FROM` of your email provider.
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
