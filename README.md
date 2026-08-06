# walnut-webapp

The Walnut web app: a debugger and transaction explorer for Starknet and Cairo developers, running in production at [app.walnut.dev](https://app.walnut.dev).

Next.js 14 (App Router), React 18, TypeScript, Tailwind + shadcn/ui, Monaco for the source view and step debugger.

The app renders; it does not compute. Transaction simulation, the debugger trace, source verification and search all come over HTTP from the Walnut backend, so a reachable backend is required for anything beyond the login screen.

## Requirements

- **Node v22.8.0** — pinned in `.nvmrc`, use `nvm`
- **npm** — the lockfile is `package-lock.json`, do not mix in yarn or pnpm
- **Postgres** — production uses [Neon](https://neon.tech); locally a free Neon dev branch is the least trouble, since the app talks to the database over Neon's HTTP driver
- **A GitHub OAuth app** — for signing in
- **A Walnut backend** — `https://api.walnut.dev` by default, or your own instance

## Getting started

```bash
nvm use
npm install

cp .env.example .env
# fill in the values, see below

npm run db:push        # create the schema in your database
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The dev server runs on **5173**, not 3000.

The port is not arbitrary: it has to match `BETTER_AUTH_URL` and the callback URL registered in your GitHub OAuth app, or sign-in will bounce you back to `/login`.

### GitHub OAuth app

Create one at [github.com/settings/developers](https://github.com/settings/developers):

- Homepage URL: `http://localhost:5173`
- Authorization callback URL: `http://localhost:5173/api/auth/callback/github`

Put the client id and secret into `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.

## Environment

Variables prefixed with `NEXT_PUBLIC_` are compiled into the browser bundle at build time. Never put a secret in one, and remember that changing one requires a rebuild rather than a restart.

Needed to run the app:

| Variable | What it is |
|---|---|
| `DATABASE_URL` | Postgres connection string. Used by the app and by `drizzle.config.ts` |
| `BETTER_AUTH_SECRET` | Signs sessions. Generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Base URL of this app, `http://localhost:5173` locally |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | From the GitHub OAuth app above |

Optional:

| Variable | Default | What it does |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.walnut.dev` | The Walnut backend. Point it at a local instance to develop against one |
| `NEXT_PUBLIC_LOG_LEVEL` | `debug` in dev, `warn` in production | `loglevel` level |
| `NEXT_PUBLIC_MONITORING_FEATURE` | `false` | Shows the monitoring UI |
| `NEXT_PUBLIC_REQUIRE_AUTHORIZATION_FEATURE` | `true` | Requires a login for gated areas |
| `NEXT_PUBLIC_USE_TRACKING` | `false` | When left off, simulation requests are sent with `skip_tracking=true` so the backend does not record them |
| `WALNUT_MAIN_API_URL` | — | Base URL of the separate main API behind organizations, custom networks and monitoring. Only needed if you are working on those screens |

`.env.example` lists the full set.

## Database

The app owns a small Postgres database holding auth state and tenant configuration. Nothing blockchain-related is stored here. An empty database is a fine starting point.

Everything lives inside the `walnut-starknet` Postgres schema rather than `public`, so the Starknet and EVM apps can share one instance. The baseline migration creates the schema, so a fresh database needs no manual preparation.

```bash
npm run db:generate    # after editing src/db/schema/index.ts, writes a migration
npm run db:migrate     # apply pending migrations
npm run db:push        # dev shortcut: sync the schema with no migration file
npm run db:studio      # browse the data
```

`drizzle-kit` reads `DATABASE_URL` from the environment and does not load `.env` itself. If your shell does not export it, prefix the command: `DATABASE_URL=… npm run db:migrate`.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Development server on port 5173 |
| `npm run build` / `npm start` | Production build, served on Node |
| `npm run lint` / `lint-fix` | ESLint, including the Cloudflare edge-compatibility rules |
| `npm run pages:build` | Build for Cloudflare Pages |
| `npm run pages:deploy` | Build and deploy to Cloudflare Pages |
| `npm run pages:dev` | Run the Cloudflare build locally |
| `ANALYZE=true npm run build` | Bundle analysis |

## Deployment

Production is **Cloudflare Pages**, built through `@cloudflare/next-on-pages`. Pull requests are built automatically by the Cloudflare Git integration and published to a preview URL.

Because of that, nearly every route declares `export const runtime = 'edge'`. Code reachable from a route therefore cannot use Node built-ins such as `fs` or `child_process`, and database access goes through `@neondatabase/serverless` rather than a normal Postgres driver. `eslint-plugin-next-on-pages` flags most violations, so run `npm run lint` before wondering why a build failed.

The build command, project name, compatibility flags and environment variables are configured in the Cloudflare dashboard; there is no `wrangler.toml` in this repository.

## Tracking

`NEXT_PUBLIC_USE_TRACKING` controls whether simulation and debug requests are recorded by the backend. When it is unset or `false`, those requests carry `skip_tracking=true`. It can also be turned off per browser by setting a `skip_tracking_pls=true` cookie, or per request with a `?skip_tracking=true` query parameter.

`NEXT_PUBLIC_SENTRY_DSN_URL` is read by the same configuration path, but no Sentry SDK is currently installed in this project.

## Layout

```
src/
  app/          routes (App Router) and the Better Auth handler
  components/   UI, call trace, code viewer, step debugger, forms
  db/           Drizzle client and schema
  lib/          API clients, auth, contexts, shared types and utilities
  middleware.ts route protection
drizzle/        generated SQL migrations
```

Files are `kebab-case.tsx`, components are `PascalCase`, and each feature gets its own folder under `src/components/`.
