# Gold Signal Bot V2

TanStack Start app that generates hourly **XAU/USD** signals on the server and renders them in a **Cloudflare Workers**–ready SSR dashboard. Live candles come from **Twelve Data** (`XAU/USD` and `DXY`).

**Source of truth:** [GitHub](https://github.com/uibobix/gold-signal-bot-v2). CI runs on every push/PR to `main` (see [.github/workflows/ci.yml](.github/workflows/ci.yml)).

## Stack

- React 19, TanStack Start / Router, Vite 7, Tailwind 4  
- Cloudflare Workers (`wrangler`, `nodejs_compat`)  
- `@lovable.dev/vite-tanstack-config` so Lovable can edit the same repo without duplicate Vite plugins  

## Prerequisites

- [Bun](https://bun.sh/) **recommended** (this repo ships `bun.lock`; CI uses Bun), **or** Node 20+ with npm

## Local development

1. Install dependencies:

   ```bash
   bun install
   ```

   With npm only: `npm install` (creates `package-lock.json`; that file is gitignored here to avoid conflicting lockfiles).

2. **Twelve Data API key** — use one of:

   - **Recommended:** copy [`.env.example`](.env.example) to `.env` and set `TWELVEDATA_API_KEY` (TanStack Start loads `.env` for server code).  
   - **Wrangler-style:** copy [`.dev.vars.example`](.dev.vars.example) to `.dev.vars` (same variable name).

3. Start the dev server:

   ```bash
   bun run dev
   ```

   (`npm run dev` works if you used npm install.)

If `TWELVEDATA_API_KEY` is missing or invalid, the dashboard shows a feed error. Resolution order at runtime: `process.env` → `.dev.vars` (local file read) → Cloudflare Worker `env` binding in production.

## Production (Cloudflare)

```bash
npx wrangler login
npx wrangler secret put TWELVEDATA_API_KEY
bun run deploy
```

Worker name is `gold-signal-bot-v2` (see `wrangler.jsonc`).

## Scripts

| Command | Purpose |
|--------|---------|
| `bun run dev` | Local dev |
| `bun run build` | Production build |
| `bun run preview` | Preview build |
| `bun run lint` | ESLint |
| `bun run format` | Prettier |
| `bun run deploy` | `wrangler deploy` |

## Workflow & collaboration

- [COLLABORATION.md](./COLLABORATION.md) — branches, merges, secrets, ownership.  
- [SESSION_HANDOFF.md](./SESSION_HANDOFF.md) — checklist when switching tools.  
- [docs/WORKFLOW.md](./docs/WORKFLOW.md) — short GitHub-first summary.  
- [docs/GITHUB.md](./docs/GITHUB.md) — branch protection and housekeeping on GitHub.  
- PRs: [.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md)

## Notes

- SSR only — not a static-only host.  
- The Twelve Data key stays on the server; it is not exposed to the browser.  

This is not financial advice.
