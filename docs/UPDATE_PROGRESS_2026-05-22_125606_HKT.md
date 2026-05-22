# Update Progress - 2026-05-22 12:56:06 HKT

## Summary
- Checked the live page relationship between host, display, player, QR, and room parameters.
- Confirmed the deployed static links all use the same fixed room: `soyingpang-guess-song-fellowship-room`.
- Confirmed the display QR points to `player.html?room=soyingpang-guess-song-fellowship-room`.
- Confirmed the phone player reads the same `room` query parameter.

## Finding
- The host created the room correctly and copy-link buttons became available, but the top `開前台` button could stay disabled because only the player panel was re-rendered after PeerJS opened.

## Change
- Re-render the host page controls after the room opens so `開前台`, copy links, player state, and display state are refreshed together.
- Bumped the host app script version to `link-relationship-fix-1` so GitHub Pages clients fetch the updated `app.js`.

## Verification
- `git diff --check`
- Static code check for the room-open render path and host script version
- Live GitHub Pages relationship check for host/display/player URLs, QR target, shared room ID, self-hosted PeerJS, CSS cache key, and 200-song list
