# Collaboration Workflow

This repo uses GitHub as the source of truth.

## Branch Rules

- `main` is the only branch Lovable should publish from.
- Lovable should stay connected to `main` unless you are intentionally testing a
  staging branch.
- Cursor and Codex should work in short-lived feature branches such as
  `cursor/*` and `codex/*`.
- Do not have Lovable and Cursor/Codex editing the same branch at the same
  time.

## Merge Flow

1. Lovable, Cursor, or Codex creates a feature branch.
2. Work happens on that branch only.
3. Open a PR into `main`.
4. Merge after review.
5. Sync Lovable to the updated `main`.
6. Publish or update the Lovable app.

## Secrets

- Keep runtime secrets in Lovable Cloud secrets, not in Git.
- Required secret:
  - `TWELVEDATA_API_KEY`

## Recommended Ownership

- Lovable: UI iteration, copy, publishing
- Cursor: local debugging, package changes, fast edits
- Codex: repo-wide fixes, reviews, strategy changes, PR-sized work
