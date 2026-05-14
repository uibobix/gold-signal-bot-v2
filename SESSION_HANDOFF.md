# Session Handoff

Use this checklist when switching between Lovable, Cursor, and Codex. Tool
memory does not transfer; GitHub state does.

## Branch naming

- `main`: stable branch  
- `codex/*`: Codex work  
- `cursor/*`: Cursor work  
- `lovable/*`: optional Lovable staging  

## Start checklist

1. Confirm repo and branch.  
2. `git pull` the latest for that branch.  
3. Read the latest PR description or newest commit on the branch.  
4. Open **GitHub → Actions** and confirm checks for `main` / your branch.  
5. If Twelve Data fails locally, confirm `.env` or `.dev.vars` has `TWELVEDATA_API_KEY`.  
6. If Lovable hosts the app, confirm it is synced to the branch you expect (usually `main`).  
7. If the branch has an open PR, skim the PR template fields.  

## End checklist

1. Commit or intentionally discard local changes.  
2. Push the branch to GitHub.  
3. Leave a clear handoff in the PR or final commit: what changed, what was tested, blockers, next owner.  
4. Open or update the PR into `main` when ready.  
5. If `main` changed and Lovable is the host, sync and publish/update there.  
6. If production or secrets changed, say so explicitly in the PR.  

## Required handoff fields

Capture these on GitHub (PR body or comment):

- active tool  
- scope  
- files changed  
- test status (`bun run lint` / `bun run build` or note why skipped)  
- deploy / publish status  
- blockers  
- next recommended action  

## Fastest safe workflow

1. Feature branch, not experimental work directly on `main`.  
2. Push early and often.  
3. Use the PR as the shared notebook.  
4. Merge only when CI is green and the diff is understandable without chat.  
5. Treat `main` as publishable.  

## Emergency handoff

If a service hits limits mid-task:

1. Push immediately.  
2. Short PR comment or commit message with current state.  
3. Continue from the pushed branch in the next tool.  

## Lovable-specific notes

- Prefer staying attached to `main` for publishing.  
- After merges, Lovable may need a manual sync and publish/update.  
- If Lovable **hosted preview** calls Twelve Data, set `TWELVEDATA_API_KEY` in Lovable Cloud secrets for that preview.  
- For **local** or **Cloudflare-only** workflows, use `.env` / Wrangler secrets instead; Lovable secrets are not required.  

## Cursor-specific notes

- Pull before editing.  
- Avoid long-lived local-only changes.  
- Prefer small focused branches.  

## Codex-specific notes

- Prefer `codex/*` branches.  
- Leave testing and next-step notes in the PR.  
