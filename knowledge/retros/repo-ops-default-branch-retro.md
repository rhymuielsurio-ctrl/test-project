# Repo-ops retro — make `main` the GitHub default branch

## Completed

- Discovered the GitHub default branch was still `feat/postgres-user-auth` (a
  long-merged feature branch), not `main` — found via
  `gh repo view --json defaultBranchRef` and `git remote show origin`
  ("HEAD branch: feat/postgres-user-auth").
- Switched with `gh repo edit <owner>/<repo> --default-branch main`;
  verified `defaultBranchRef` = `main` via the API.
- Re-pointed the local symref with `git remote set-head origin main`;
  `git branch -r` now shows `origin/HEAD -> origin/main`.
- Repo-metadata change only: zero source files touched, zero graph churn.

## Pattern

- **Keep the GitHub default branch explicitly aligned with the integration
  trunk (`main`).** GitHub rarely surfaces the default branch to the user, so it
  silently drifts after repo creation (here: a Day 1 experiment branch became
  the default). Add to onboarding: check `gh repo view --json defaultBranchRef`
  once after repo setup. New PRs default their base to whatever the default is —
  a stale default quietly reminds reviewers to re-target every single PR.
- `gh repo edit --default-branch <name>` is the entire fix; no branch-protection
  or workflow changes are needed to re-point PR bases, the code tab, and Actions.

## Backlog

- **Stale remote branches** from PRs squash-merged into `main`: delete
  `feat/postgres-user-auth`, `fix/vercel-cron-delivery`,
  `chore/dev-local-cron`, `feat/postgres-data-layer`, and
  `feat/ui-modernize-shadcn` (if kept, note that `origin/HEAD` now tracks `main`,
  so none are load-bearing). Deleting `feat/postgres-user-auth` removes the last
  trace of "day 1 experiment" naming; `day2-data-layer` history lives on in
  `main`.
