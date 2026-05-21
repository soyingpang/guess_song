# Update Progress - 2026-05-21 16:55:58 HKT

## GitHub status

Pending push at the time this file is created. This update should be committed and pushed immediately after verification.

## Request

Change the phone join flow so the player first enters a name, then chooses whether they are on-site or remote. The on-site/remote choice should not remain visible during gameplay.

## Completed update

- Changed the phone player join flow to two steps:
  - Step 1: enter player name.
  - Step 2: choose `在現場` or `不在現場`.
- Selecting the location now immediately connects to the room.
- The player mode selector is hidden initially and only appears after a valid name is entered.
- The player mode selector remains hidden once the player joins the game.
- Connection failure now returns the player to the appropriate step:
  - back to name entry if no name was confirmed
  - back to location choice if the name was already confirmed
- Updated player script cache-busting version to `join-flow-1`.

## Changed files

- `player.html`
- `player.js`
- `docs/UPDATE_PROGRESS_2026-05-21_165558_HKT.md`

## Verification run

- `node --check player.js`
- `git diff --check`

## Note

No local in-app browser test was run, following the project workflow preference.
