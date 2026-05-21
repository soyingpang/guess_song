# Update Progress - 2026-05-21 14:24:03 HKT

## GitHub status

Pending push at the time this file is created. This update should be committed and pushed immediately after verification.

## Issue found

Remote player mode still had the old phone sync player visible for YouTube-based questions. After host audio broadcast became the preferred sound path, that extra sync player could push the normal answering area down on small phones, making the 4-choice controls feel missing.

## Completed update

- Kept the 4-choice answer flow intact.
- Prioritized the normal answer area in remote player mode.
- Hid the remote roster in the joined remote layout to save vertical space.
- Stopped showing the old phone sync player for YouTube-only questions.
- Kept the sync player available for direct audio files (`audioUrl`) as a backup path.
- Updated the player script cache-busting version to `remote-choice-priority-1`.

## Changed files

- `player.js`
- `player.html`
- `docs/UPDATE_PROGRESS_2026-05-21_142403_HKT.md`

## Verification run

- `node --check player.js`
- `git diff --check`

## Note

The 4-choice feature was not removed. It is still rendered when the host is in choice mode, a question is active, playback is running, and the answer has not been revealed.
