# walnut-webapp

The Walnut web app: a debugger and transaction explorer for Starknet and Cairo developers, running in production at [app.walnut.dev](https://app.walnut.dev).

Next.js 14 (App Router), React 18, TypeScript, Tailwind + shadcn/ui, Monaco for the source view and step debugger.

The app renders; it does not compute. Transaction simulation, the debugger trace, source verification and search all come over HTTP from the Walnut backend, so a reachable backend is required for anything beyond the landing page.

## Requirements

- **Node v22.8.0** — pinned in `.nvmrc`, use `nvm`
- **npm** — the lockfile is `package-lock.json`, do not mix in yarn or pnpm
- **A Walnut backend** — [walnuthq/walnut-server](https://github.com/walnuthq/walnut-server); `https://api.walnut.dev` by default, or your own instance via `NEXT_PUBLIC_API_URL`

## Getting started

```bash
nvm use
npm install

cp .env.example .env
# fill in the values

npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Layout

```
src/
  app/          routes (App Router)
  components/   UI, call trace, code viewer, step debugger, forms
  lib/          API clients, contexts, shared types and utilities
```

Files are `kebab-case.tsx`, components are `PascalCase`, and each feature gets its own folder under `src/components/`.

## Contributing

Issues and pull requests are welcome. Run `npm run lint` before opening one; it covers both the ESLint rules and the Cloudflare edge-compatibility checks that the build enforces.

## License

Apache License 2.0 — see [LICENSE](LICENSE) and [NOTICE](NOTICE).
