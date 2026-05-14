# Collaboration Workflow

This repo uses GitHub as the source of truth. The handoff between Lovable,
Cursor, and Codex happens through branches, commits, and PR descriptions, not
through chat memory.

## Runtime Context

- The repo is Cloudflare-compatible, but the primary live workflow for this
  project is Lovable.
- Use Wrangler directly only when you intentionally want a non-Lovable deploy.
- For normal live updates, merge to `main`, sync Lovable, and publish/update
  there.

## Core Rules

- `main` is the stable branch and the only branch Lovable should publish from.
- Lovable should stay connected to `main` unless you are intentionally testing
  a staging branch.
- Cursor and Codex should work in short-lived feature branches such as
  `cursor/*` and `codex/*`.
- Do not have Lovable and Cursor/Codex editing the same branch at the same
  time.
- Do not rely on unstaged local changes as a handoff mechanism.
- Every meaningful session should end with a push to GitHub or a deliberate
  rollback.

## Branch Policy

- `main`: latest stable state
- `codex/*`: work created by Codex
- `cursor/*`: work created in Cursor
- `lovable/*`: optional staging branch for larger Lovable experiments

If one tool hits limits, the next tool should continue from the latest pushed
branch or merged PR, not from a paraphrased recap.

## Session Start

Before working in any tool:

1. Pull the latest branch state from GitHub.
2. Read [SESSION_HANDOFF.md](/private/tmp/gold-signal-bot-v2/SESSION_HANDOFF.md).
3. Check the active PR or latest commit on the branch.
4. Verify whether Lovable is currently attached to `main` or another branch.
5. Confirm whether the branch already has a handoff note in the PR template.

## Session End

Before leaving any tool:

1. Commit or discard local changes.
2. Push the branch to GitHub.
3. Update the PR description or handoff note with:
   - what changed
   - what was tested
   - what is blocked
   - what the next tool should do
4. If `main` changed, sync Lovable and publish/update the app if needed.
5. If production behavior changed, note whether secrets or manual publish steps
   are required.

## Merge Flow

1. Create a feature branch.
2. Work happens on that branch only.
3. Open a PR into `main`.
4. Fill in the PR template completely.
5. Merge after review or after the next tool finishes the handoff work.
6. Sync Lovable to the updated `main`.
7. Publish or update the Lovable app.

## Secrets

- Keep runtime secrets in Lovable Cloud secrets, not in Git.
- Required secret:
  - `TWELVEDATA_API_KEY`
- If a secret is rotated, update Lovable before assuming the app is broken.

## Recommended Ownership

- Lovable: UI iteration, copy, branch sync, publishing
- Cursor: local debugging, package changes, rapid implementation
- Codex: repo-wide fixes, reviews, strategy changes, PR-sized work
