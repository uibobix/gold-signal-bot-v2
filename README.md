# Gold Signal Bot V2

`gold-signal-bot-v2` is a TanStack Start app that generates hourly `XAU/USD`
signals server-side and renders them in a Cloudflare-ready SSR dashboard.

## Stack

- React 19
- TanStack Start
- Cloudflare Workers via the Vite plugin
- Twelve Data for `XAU/USD` and `DXY` candles

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Add your Twelve Data API key:

```bash
cp .dev.vars.example .dev.vars
```

Then edit `.dev.vars` so it contains your real key:

```bash
TWELVEDATA_API_KEY=your_api_key_here
```

3. Start the dev server:

```bash
npm run dev
```

The app will render a feed error if `TWELVEDATA_API_KEY` is missing or invalid.
Local dev now reads the key from `.dev.vars` or from a shell-exported
`TWELVEDATA_API_KEY`.

## Environment

Required local and production secret:

```bash
TWELVEDATA_API_KEY=your_api_key_here
```

For local Cloudflare-style secret loading, place it in `.dev.vars`.

## Scripts

- `npm run dev`: local development
- `npm run build`: production build
- `npm run preview`: preview the built app
- `npm run lint`: ESLint checks
- `npm run format`: Prettier formatting
- `npm run deploy`: deploy to Cloudflare Workers with Wrangler

## Deployment

This repo is currently configured for Cloudflare Workers.

1. Authenticate Wrangler:

```bash
npx wrangler login
```

2. Set the production secret:

```bash
npx wrangler secret put TWELVEDATA_API_KEY
```

3. Deploy:

```bash
npm run deploy
```

## Primary Workflow

The day-to-day operating model for this project is:

1. GitHub is the source of truth.
2. Lovable stays connected to `main`.
3. Cursor and Codex work in feature branches.
4. Merged changes flow back to Lovable through GitHub sync and
   publish/update.

If you are running the live app in Lovable, keep `TWELVEDATA_API_KEY` in
Lovable Cloud secrets and publish from `main` after merges.

## Notes

- The app is SSR and cannot be deployed to a static-only host.
- `XAU/USD` and `DXY` are fetched server-side; the API key is not exposed to the
  browser.

## Collaboration

Use [COLLABORATION.md](/private/tmp/gold-signal-bot-v2/COLLABORATION.md) as the
working agreement for Lovable, Cursor, and Codex.

Use [SESSION_HANDOFF.md](/private/tmp/gold-signal-bot-v2/SESSION_HANDOFF.md) as
the checklist for switching from one tool to another without losing state.

Use [.github/PULL_REQUEST_TEMPLATE.md](/private/tmp/gold-signal-bot-v2/.github/PULL_REQUEST_TEMPLATE.md)
to capture test status, publish state, blockers, and next steps inside each PR.
