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
# fill in the values

npm run db:push        # create the schema in your database
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

The port is not arbitrary: it has to match `BETTER_AUTH_URL` and the callback URL registered in your GitHub OAuth app, or sign-in will bounce you back to `/login`.

### GitHub OAuth app

Create one at [github.com/settings/developers](https://github.com/settings/developers):

- Homepage URL: `http://localhost:5173`
- Authorization callback URL: `http://localhost:5173/api/auth/callback/github`

Put the client id and secret into `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.

## Environment

`.env.example` lists every variable with a comment. To boot the app you need five of them: `DATABASE_URL`, `BETTER_AUTH_SECRET` (generate with `openssl rand -base64 32`), `BETTER_AUTH_URL`, `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`. Everything else has a working default — including `NEXT_PUBLIC_API_URL`, which points at the public backend unless you are running your own.

Variables prefixed with `NEXT_PUBLIC_` are compiled into the browser bundle at build time. Never put a secret in one, and remember that changing one requires a rebuild rather than a restart.

## Database

The app owns a small Postgres database holding auth state and tenant configuration. Nothing blockchain-related is stored here, so an empty database is a fine starting point.

Everything lives inside the `walnut-starknet` Postgres schema rather than `public`, so the Starknet and EVM apps can share one instance. The baseline migration creates the schema, so a fresh database needs no manual preparation.

`drizzle-kit` reads `DATABASE_URL` from the environment and does not load `.env` itself. If your shell does not export it, prefix the command: `DATABASE_URL=… npm run db:migrate`.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Development server on port 5173 |
| `npm run build` / `npm start` | Production build, served on Node |
| `npm run lint` / `lint-fix` | ESLint, including the Cloudflare edge-compatibility rules |
| `npm run db:generate` | Turn schema changes into a migration file |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:push` | Sync the schema with no migration file — development only |
| `npm run db:studio` | Browse the data |
| `npm run pages:build` / `pages:deploy` / `pages:dev` | Cloudflare Pages build, deploy, and local run of the build output |
| `ANALYZE=true npm run build` | Bundle analysis |

## Deployment

Production is Cloudflare Pages, built through `@cloudflare/next-on-pages`. Pull requests are built automatically and published to a preview URL. Because the app runs on Cloudflare's edge runtime, nearly every route declares `export const runtime = 'edge'` and cannot use Node built-ins such as `fs`; `npm run lint` flags violations before they reach a build.

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
