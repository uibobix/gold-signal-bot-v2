# Workflow summary

## Source of truth

**GitHub** (`main`) is canonical. Cursor, Codex, and optional Lovable all push
here.

## Day-to-day

1. `git pull` before you start.  
2. Work on `cursor/*`, `codex/*`, or `lovable/*` — not the same branch from two tools at once.  
3. Open a PR to `main`; wait for **CI** (lint + build).  
4. Merge, then sync any external host (Lovable, Cloudflare) you actually use.  

## Secrets

Use **`.env`** (see `.env.example`) or **`.dev.vars`** locally; **`wrangler secret put`** on Cloudflare. Add **Lovable Cloud secrets** only if Lovable’s hosted environment must call Twelve Data.

See [COLLABORATION.md](../COLLABORATION.md) for the full policy.
