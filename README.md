# walnut-webapp

The Walnut web app: a debugger and transaction explorer for Starknet and Cairo developers, running in production at [app.walnut.dev](https://app.walnut.dev).

Next.js 14 (App Router), React 18, TypeScript, Tailwind + shadcn/ui, Monaco for the source view and step debugger.

The app renders; it does not compute. Transaction simulation, the debugger trace, source verification and search all come over HTTP from the Walnut backend, so a reachable backend is required for anything beyond the login screen.

## Requirements

- **Node v22.8.0** — pinned in `.nvmrc`, use `nvm`
- **npm** — the lockfile is `package-lock.json`, do not mix in yarn or pnpm
- **Postgres** — production uses [Neon](https://neon.tech); locally a free Neon dev branch is the least trouble, since the app talks to the database over Neon's HTTP driver
- **A GitHub OAuth app** — for signing in
- **A Walnut backend** — [walnuthq/walnut-server](https://github.com/walnuthq/walnut-server); `https://api.walnut.dev` by default, or your own instance via `NEXT_PUBLIC_API_URL`

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

## Database

A [Neon](https://neon.tech) Postgres database, used only for the sign-in flow — the Better Auth tables. Nothing else is stored here, so an empty database is a fine starting point: `npm run db:push` creates the schema.

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

## Contributing

Issues and pull requests are welcome. Run `npm run lint` before opening one; it covers both the ESLint rules and the Cloudflare edge-compatibility checks that the build enforces. If you change anything under `src/db/schema/`, run `npm run db:generate` and commit the generated migration alongside it.

## License

Apache License 2.0 — see [LICENSE](LICENSE) and [NOTICE](NOTICE).
