# Collaboration Workflow

This repo uses GitHub as the source of truth. Handoff between Lovable, Cursor,
and Codex happens through branches, commits, and PR descriptions, not through
chat memory.

## Runtime targets

You can run the same codebase in more than one place:

| Target | When to use it |
|--------|----------------|
| **Local** (`bun run dev`) | Fast iteration, full logs, `.env` / `.dev.vars`. |
| **Cloudflare Workers** (`bun run deploy`) | Production or staging on your account. |
| **Lovable hosted preview** | Optional UI iteration; needs Lovable-side secrets if the preview calls live APIs. |

Pick one primary “live” target for the team and document it in the active PR when it matters.

## Core rules

- `main` is the stable branch and the only branch Lovable should publish from when you use Lovable as host.
- Lovable should stay connected to `main` unless you are intentionally testing another branch.
- Cursor and Codex should work in short-lived feature branches such as `cursor/*` and `codex/*`.
- Do not have Lovable and Cursor/Codex editing the same branch at the same time.
- Do not rely on unstaged local changes as a handoff mechanism.
- Every meaningful session should end with a push to GitHub or a deliberate rollback.

## Branch policy

- `main`: latest stable state  
- `codex/*`: Codex work  
- `cursor/*`: Cursor work  
- `lovable/*`: optional Lovable staging for larger experiments  

If one tool hits limits, the next tool continues from the latest **pushed** branch or merged PR, not from a paraphrased recap.

## Session start

Before working in any tool:

1. Pull the latest branch state from GitHub.  
2. Read [SESSION_HANDOFF.md](./SESSION_HANDOFF.md).  
3. Check the active PR or latest commit on the branch.  
4. Check GitHub Actions for failing checks on `main`.  
5. If using Lovable as host, confirm which branch Lovable is attached to.  

## Session end

Before leaving any tool:

1. Commit or discard local changes.  
2. Push the branch to GitHub.  
3. Update the PR description (or final commit message) with what changed, what was tested, blockers, and next steps.  
4. If `main` changed and Lovable hosts the app, sync Lovable and publish/update as needed.  
5. If production behavior changed, note whether secrets or manual deploy steps are required.  

## Merge flow

1. Create a feature branch.  
2. Work on that branch only.  
3. Open a PR into `main`.  
4. Fill in the PR template.  
5. Merge after review (and after CI is green).  
6. Sync Lovable if you use it as host.  

## Secrets (`TWELVEDATA_API_KEY`)

Never commit API keys. Prefer this order:

1. **Local Cursor / Codex / CLI:** `.env` from [`.env.example`](./.env.example) (gitignored), or `.dev.vars` for Wrangler-style dev.  
2. **Cloudflare production:** `npx wrangler secret put TWELVEDATA_API_KEY`.  
3. **Lovable Cloud secrets:** only if you rely on Lovable’s hosted preview or Lovable-managed deploy and Twelve Data is called from that environment.

If a key is rotated, update every runtime that calls Twelve Data (local `.env`, Wrangler secret, Lovable secret if applicable).

## Recommended ownership

- **Lovable:** UI iteration, copy, optional publish when Lovable is the host.  
- **Cursor:** local debugging, package changes, rapid implementation.  
- **Codex:** repo-wide fixes, reviews, strategy changes, PR-sized work.  
