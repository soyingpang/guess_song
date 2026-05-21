# Update Progress - 2026-05-21 14:37:53 HKT

## GitHub status

Pending push at the time this file is created. This update should be committed and pushed immediately after verification.

## Request

Make the phone-side interface fit in one screen without needing to scroll. Reduce oversized button controls and replace some long button labels with shorter, understandable labels.

## Completed update

- Added a compact joined-player layout for the phone page.
- Hid repeated joined-state elements that waste vertical space:
  - title
  - connection status block
  - mic status text block
  - remote header/grid in remote-player mode
- Kept the answer area as the main visible area.
- Reduced 4-choice button height, padding, index badge size, and title text size.
- Limited long song titles and choice labels to two lines.
- Reduced score, mic, leaderboard, remote listen, result, and buzz button sizes.
- Shortened button labels:
  - leaderboard button -> `榜`
  - close leaderboard -> `×`
  - mic button -> `咪` / `關咪`
  - backup sync player -> `播放` / `同步`
- Updated player script cache-busting version to `phone-one-screen-1`.

## Changed files

- `player.html`
- `player.js`
- `docs/UPDATE_PROGRESS_2026-05-21_143753_HKT.md`

## Verification run

- `node --check player.js`
- `git diff --check`

## Note

This update focuses on the phone player page because the visible issue is on the mobile player experience. Host/admin pages contain many management controls and may need a separate compact-mode pass if they also must fit into a single non-scrolling screen.
