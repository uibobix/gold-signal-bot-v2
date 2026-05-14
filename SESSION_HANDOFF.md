# Session Handoff

Use this file as the operating checklist when switching between Lovable, Cursor,
and Codex because tool memory does not transfer, but GitHub state does.

## Start Checklist

1. Confirm the repo and branch you are about to edit.
2. Pull the latest branch from GitHub.
3. Read the latest PR description or latest commit message on that branch.
4. Check whether there are open comments, failing checks, or missing secrets.
5. Confirm whether Lovable is publishing from `main`.

## End Checklist

1. Make sure local changes are either committed or intentionally discarded.
2. Push the branch to GitHub.
3. Leave a clear handoff in the PR description, PR comment, or final commit
   message covering:
   - what changed
   - what was tested
   - what still needs work
   - whether production secrets or publishing steps are required
4. If the branch is ready, open or update the PR into `main`.
5. If `main` changed, re-sync Lovable and publish/update the live app.

## Required Handoff Fields

Every branch handoff should capture these fields somewhere visible on GitHub:

- scope
- files changed
- test status
- deploy status
- blockers
- next recommended action

## Fastest Safe Workflow

1. Work in a feature branch.
2. Push early and often.
3. Use the PR as the shared notebook.
4. Merge only when the branch state is understandable without chat history.
5. Treat `main` as publishable, not experimental.

## Emergency Handoff

If one service hits limits mid-task:

1. Push the branch immediately.
2. Write a short PR comment or commit message with the current state.
3. Move to the next service.
4. Continue from the pushed branch, not from local unstaged work.

## Lovable-Specific Notes

- Lovable should usually stay on `main`.
- After merging to `main`, Lovable may still need a manual sync and
  publish/update step.
- Lovable Cloud secrets must contain `TWELVEDATA_API_KEY`.

## Cursor-Specific Notes

- Pull before editing.
- Avoid long-lived local-only changes.
- Prefer small focused branches over one giant working branch.

## Codex-Specific Notes

- Work in `codex/*` branches unless explicitly asked otherwise.
- Leave testing and next-step notes in the PR so another tool can resume cleanly.
