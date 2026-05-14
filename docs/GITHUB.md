# GitHub housekeeping

## Branch protection (recommended)

On GitHub: **Settings → Branches → Add branch protection rule** for `main`.

Suggested options:

- Require a pull request before merging (optionally require approvals).  
- Require status checks to pass: enable the **CI** workflow (`check` job) once it appears after the first push that includes `.github/workflows/ci.yml`).  
- Block force pushes.  

## Stale branches

After a PR is merged, delete the head branch on GitHub (**Delete branch** on the merged PR) unless you still need it. Example: `codex/handoff-workflow` after it landed on `main`.

## Commit messages

Prefer concrete subjects, for example:

- `fix: align RSI gate with trend pullback rules`  
- `docs: clarify secrets for Wrangler vs Lovable`  
- `chore: add GitHub Actions CI`  

Avoid repeated **`Changes`** — it makes history and `git bisect` harder.

## Commit signing (optional)

**Settings → SSH and GPG keys** — add a signing key and enable “vigilant mode” if you want verified commits on `main`.
