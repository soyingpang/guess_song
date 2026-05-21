# Codex Workflow Notes

## GitHub publishing

- After each completed update, commit and push the finished changes to `origin/main` unless the user explicitly says not to.
- Do not leave completed work only in the local working tree.
- If GitHub publishing fails, record the blocker clearly in the update progress file.

## Progress records

- After each update, create a dated progress file in `docs/`.
- Use this filename pattern: `UPDATE_PROGRESS_YYYY-MM-DD_HHMMSS_HKT.md`.
- Include the update time, changed files, verification run, GitHub status, and next action.

## Testing preference

- Do not suggest local in-app browser testing as the default next step unless the user explicitly asks for it.
- Prefer code checks and GitHub publishing status for routine updates.
