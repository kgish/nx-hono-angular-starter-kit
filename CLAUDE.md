# CLAUDE.md

## Project

- **Name:** nx-hono-angular-starter-kit — Angular frontend and Hono API on Bun sharing Zod
  schemas, backed by PostgreSQL. Workspace alias scope: `@fullstack/*`. See README.md.
- **Angular:** 22 · TypeScript 6 strict · **Nx 23 monorepo**
- **Backend:** Hono 4 on Bun · Drizzle ORM (`bun:sql`) · PostgreSQL 18 · Zod 4 · better-auth
- **Change detection:** zoneless. It is the default since Angular 21, so `app.config.ts` has
  no `provideZonelessChangeDetection()`. There is no zone.js; never add it or
  `provideZoneChangeDetection()`.
- **Package manager:** npm — always prefix: `npx nx <command>`
- **Styling:** SCSS. Angular Material is installed for the notification snackbar only;
  its theme is in `apps/web/src/styles.scss`. Other UI is plain HTML and SCSS.
- **Unit tests:** Vitest for `web` and all `libs/` · `bun test` (`bun:test`) for `apps/api`
- **Nx Cloud:** no (CI sets `NX_NO_CLOUD=true`)
- **Library linking:** Classic: `tsconfig.base.json` path aliases (`@fullstack/schemas`,
  `@fullstack/web/data-access`, …). Do NOT convert to package.json workspaces.
- **Forms:** Signal Forms for all new forms; leave existing forms alone. Validate with the
  shared Zod schemas from `@fullstack/schemas` (`validateStandardSchema`) instead of
  re-declaring the rules. The todos page form (plain signals + Zod) predates this rule.
- **File naming:** Angular v20+ style: `todos-page.ts` → `class TodosPage`

## Skills in use

Three skill sets are installed. They do not know about each other, so:

- **Nx skills** own everything about the _workspace_: finding projects, running
  tasks, scaffolding, CI. Never run `ng` commands — always `nx`.
- **`angular-developer` skill** owns everything _inside_ a file: Angular APIs,
  signals, forms, routing, a11y.
- **`angular-material` skill** covers Angular Material and the CDK, which the app uses
  for notifications (see below).
- **When any of them conflicts with this file, this file wins.**

### Nx skills

- `nx-workspace` — invoke **first** for any question about projects, targets,
  tags or dependencies. Follow its rule: never read `project.json` directly,
  it is only partial. Use `nx show project <name> --json`.
- `nx-run-tasks` — running build / test / lint / affected.
- `nx-generate` — invoke **before** creating any app, lib, component or service.
  Always `--dry-run` first, always `--no-interactive`.
- `nx-plugins` — finding and adding plugins (ask me before adding).
- `nx-import` — only for importing an outside repo into this workspace. Ignore
  it during normal work.
- Ignore `link-workspace-packages`. It says "do not patch around with tsconfig paths",
  which is wrong here: this workspace links libraries through tsconfig path aliases.
- Ignore `monitor-ci`. There is no Nx Cloud.

**Override:** The Nx MCP server IS configured (Nx Claude plugin, enabled in
`.claude/settings.json`). Use it as the Nx guidelines describe.

### `angular-developer` skill

Open the reference file instead of relying on memory for these — they are new and
easy to get wrong: `signal-forms.md`, `http-client.md` (`httpResource`),
`resource.md`, `linked-signal.md`, `effects.md`, `angular-aria.md`,
`naming-conventions.md`.

**Overrides — that skill is written for a plain Angular CLI project and never mentions Nx:**

- Ignore its `SKILL.md` rule 3 ("run `ng build` after generating code").
  Verify with the Definition of done below instead.
- Never run `ng build`, `ng serve`, `ng test`, `ng e2e`, `ng generate`,
  `ng add`, `ng new`, `ng update`, or `ng version`. Always `nx`.
- Ignore `cli.md` entirely. Scaffolding goes through the `nx-generate` skill.
- Ignore `e2e-testing.md`. This repo has no E2E setup; ask before adding one.
- `testing-fundamentals.md` assumes Vitest and zoneless — both true here — but it bans
  `fixture.detectChanges()` outright. Follow the Testing section below, which allows one
  exception.
- Ignore `mcp.md`. The Angular CLI MCP server is not used here.
- Ignore the `angular-new-app` skill.
- There is no `angular.json`. Never create one.
- Styling examples use `.css`. Use SCSS.

### `angular-material` skill

`@angular/material` and `@angular/cdk` are dependencies, pinned with `~` to the same
minor as `@angular/core` (22.1). Keep them in step when Angular is upgraded. So far only
the snackbar is used, through `Notifier` (`@fullstack/web/notifications`); the rest of the
UI is plain HTML and SCSS.

- Show messages with `Notifier` (`success()`, `failure()`, `info()`, each taking a
  translation key), not by calling `MatSnackBar` directly.
- The theme is set up by hand in `apps/web/src/styles.scss` (`mat.theme` on `:root`),
  together with the per-type `notification-<type>` panel classes. There is no `ng add`.
- The skill documents Material v21.x; this workspace runs Angular 22.
- Its `ng add` / `ng generate` commands (`core-schematics.md`, the datepicker adapters)
  fall under the never-`ng` rule above. Ask how to install instead.
- Some examples use `@Input()`, constructor injection and `*ngFor`. The Angular hard
  rules below still apply.
- The snackbar's own CSS custom properties in the skill (`--mdc-snackbar-*`) are out of
  date. Style it with `mat.snack-bar-overrides()` instead.

It lives in `.agents/skills/angular-material`; `.claude/skills/angular-material` is a
symlink to it, so there is one copy to update.

## Commands

```bash
npm ci                                                      # install
npm run db:up                                               # PostgreSQL :5432 + Mailpit (inbox :8025)
npm run dev                                                 # API on :3000 + web on :4200
npx nx serve <project>                                      # api or web
npx nx test <lib> -- src/lib/<file>.spec.ts                 # single file, Vitest libs — prefer this
npx nx test web --include=apps/web/src/app/<file>.spec.ts   # single file, web app
npx nx test api -- src/<file>.spec.ts                       # single file, API (bun test)
npx nx affected -t lint test typecheck build
npx nx format:write
npm run db:generate -- --name=<change>                      # after editing libs/api/db/src/lib/schema.ts
```

**Definition of done:** after any change, run `npx nx format:write`, then
`npx nx affected -t lint test typecheck build` (CI runs `nx format:check` and the same
targets). Do not report the task as finished until it passes. A change inside a library
can break its consumers, so testing only the project you touched is not enough.

## Angular hard rules

The `angular-developer` skill does **not** state these. They are not optional here.

- Never write `changeDetection: ChangeDetectionStrategy.OnPush`. OnPush is the default
  since Angular 22. Do not opt out with `ChangeDetectionStrategy.Eager` either.
- Always `inject()`. Never constructor injection.
- Always `input()` / `input.required()` / `output()` / `model()`.
  Never `@Input()` / `@Output()`.
- Always `viewChild()` / `contentChild()`. Never the decorator queries.
- Always `@if` / `@for` (with `track`) / `@switch`.
  Never `*ngIf` / `*ngFor` / `*ngSwitch`.
- Never write `standalone: true`. Never create an `NgModule`.
- `@defer` is not general control flow. Use it only for heavy, below-the-fold
  blocks, and only when I ask. Do not add it on your own.
- RxJS lives only in data-access libraries. Convert to signals before the
  template. Never subscribe manually inside a component.
- Self-closing tags for components with no projected content: `<app-profile />`.

## API rules (Hono on Bun)

- API contracts live in `libs/shared/schemas`; change them there, never duplicate types.
- Validate request bodies and params with the shared schemas through `validate()`
  (`apps/api/src/validator.ts`). Error responses use the shared `ApiError` shape.
- Build the app with `createApp(deps)`; routes get their repository injected, so tests
  can swap in `InMemoryTodoRepository` (`apps/api/src/testing/`).
- Todos are per user: every `TodoRepository` method takes the owner's id (`c.var.user.id`,
  set by `requireSession`), and another user's todo is treated as not found (404).
- After editing `libs/api/db/src/lib/schema.ts`, run `npm run db:generate -- --name=<change>`
  and commit the generated migration. The API applies pending migrations on start.
- Auth is better-auth (`apps/api/src/auth.ts`), mounted at `AUTH_PREFIX` (`/api/auth`). Its
  endpoints answer errors as `{ code, message }` (`AuthErrorSchema`), not `ApiError`. Protect a
  route with `requireSession(auth)`; tests use `createInMemoryAuth(mailer)` with an
  `InMemoryMailer` (`apps/api/src/testing/`). Emails go through the `Mailer` interface
  (`mailer.ts`, SMTP via nodemailer; Mailpit in dev); templates live in `emails.ts`.

## Architecture & boundaries

- `apps/` — deployable apps only. No shared logic here.
- `libs/` — all reusable code, grouped by domain (`web`, `api`, `shared`).
- `apps/web` — Angular shell. `app.config.ts` provides `HttpClient` (`withFetch()`) and the
  router (`withComponentInputBinding()`); `app.routes.ts` lazy-loads feature libs with
  `loadChildren`, guarded by `guestGuard` (auth pages) and `authGuard` (everything else).
  The dev server proxies `/api` to `localhost:3000` (`proxy.conf.json`).
- `apps/api` — Hono app on Bun: `main.ts` wires the database into `createApp()`, routes live in
  `src/routes/`, and `migrate.ts` runs migrations.
- **State:** Angular Signals only — no NgRx or other state library. Stores are
  `providedIn: 'root'` services that keep one private `signal` and expose `computed` slices
  (see `TodoStore`).
- **Data access:** REST over `HttpClient` with paths from `ApiPaths` (`@fullstack/util`).
  Every response is parsed with the shared Zod schemas, so contract drift fails loudly.
  Auth is a better-auth session cookie: `AuthStore` (`@fullstack/web/data-access`) holds the
  user. `languageInterceptor` (`@fullstack/web/i18n`) sends the UI language to the API as
  `Accept-Language`, which picks the language of emails.
- **Logging (web):** inject `Logger` (`@fullstack/web/logging`) instead of calling `console.*`.
  Provide `LOG_LEVEL` to change which levels are written.

### Library structure

```
apps/
  api/              — Hono app on Bun                                      scope:api    type:app
  web/              — Angular shell + app routes                           scope:web    type:app
libs/
  shared/
    schemas/        — @fullstack/schemas: Zod schemas + inferred types      scope:shared type:schemas
                      (TodoSchema, SignInSchema, SignUpSchema, ApiErrorSchema, …)
    util/           — @fullstack/util: framework-free helpers               scope:shared type:util
                      (ApiPaths, API_PREFIX, AUTH_PREFIX, Result)
  api/
    db/             — @fullstack/api/db: Drizzle schema (incl. better-auth  scope:api    type:data-access
                      tables), client, TodoRepository, migrations/
  web/
    data-access/    — @fullstack/web/data-access: TodoApi, AuthApi          scope:web    type:data-access
                      (HttpClient) + TodoStore, AuthStore (signal state),
                      authGuard / guestGuard
    feature-auth/   — @fullstack/web/feature-auth: authRoutes (lazy)        scope:web    type:feature
                      + LoginPage, RegisterPage, ForgotPasswordPage,
                      ResetPasswordPage
    feature-todos/  — @fullstack/web/feature-todos: todosRoutes (lazy)      scope:web    type:feature
                      + TodosPage
    i18n/           — @fullstack/web/i18n: LanguageStore (ngx-translate,    scope:web    type:data-access
                      localStorage), languageInterceptor; strings in
                      apps/web/public/i18n/
    notifications/  — @fullstack/web/notifications: Notifier (Material      scope:web    type:data-access
                      snackbar: success/failure/info, close button)
    logging/        — @fullstack/web/logging: Logger (console, filtered by  scope:web    type:data-access
                      LOG_LEVEL: debug in dev mode, info in production)
```

### Dependency rules

Every project carries one `scope:*` and one `type:*` tag. Both must allow an import.

| tag                | may depend on                       |
| ------------------ | ----------------------------------- |
| `scope:web`        | `scope:web`, `scope:shared`         |
| `scope:api`        | `scope:api`, `scope:shared`         |
| `scope:shared`     | `scope:shared` (framework-free)     |
| `type:app`         | feature, data-access, schemas, util |
| `type:feature`     | data-access, schemas, util          |
| `type:data-access` | data-access, schemas, util          |
| `type:schemas`     | schemas                             |
| `type:util`        | util                                |

Enforced by `@nx/enforce-module-boundaries` in ESLint. If unsure whether an
import is allowed, run lint — do not guess.

- Import across libraries with the workspace alias only (e.g. `@fullstack/web/data-access`).
- Relative imports only **inside** a library.
- Each library exposes its public API through `index.ts`.
  Never deep-import into another library's `src/`.
- New libraries default to **non-buildable** unless I say otherwise.

## Testing

**Angular (zoneless, Vitest):**

- Act → `await fixture.whenStable()` → assert. Every test is `async`.
- Do not call `fixture.detectChanges()`, with one exception: to trigger the first render
  (and `ngOnInit`) before flushing `HttpTestingController`. Stores register requests as
  `PendingTasks`, so awaiting `whenStable()` before the flush hangs. See
  `todos-page.spec.ts`.

**API (`bun:test`):**

- Import from `bun:test`, never Vitest. Test through `app.request()` against
  `createApp()` with `InMemoryTodoRepository`; unit tests need no database.

Both:

- Test behaviour through the public API. Do not test private methods.
- Do not delete a failing test to make the suite pass. Fix it or tell me.

## Guardrails

- Do not add or upgrade dependencies without asking. This includes `nx add`.
- Do not run `git commit`, `git push`, or `nx migrate`.
- Ask before running `nx reset` — it clears the cache and is slow to recover.
- Do not edit `dist/`, `.nx/`, or lockfiles.
- If a rule here conflicts with existing code, ask instead of guessing.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
