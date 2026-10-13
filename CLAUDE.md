# Working in this repo

- Run tasks through Nx: `npx nx <target> <project>` or `npx nx run-many -t lint test typecheck build`.
- Projects: `web` (Angular), `api` (Hono on Bun), `shared-schemas`, `shared-util`, `api-db`,
  `web-data-access`, `web-feature-todos`. See README.md for the layout and boundary tags.
- API contracts live in `libs/shared/schemas`; change them there, never duplicate types.
- The API runs on Bun: use `bun test` style tests (`bun:test`) in `apps/api`, Vitest elsewhere.
- Angular: standalone components, signals, `OnPush`, zoneless; no NgModules.
- After editing `libs/api/db/src/lib/schema.ts`, run `npm run db:generate -- --name=<change>`.
- Run `npx nx format:write` before committing; CI runs `nx format:check`.
