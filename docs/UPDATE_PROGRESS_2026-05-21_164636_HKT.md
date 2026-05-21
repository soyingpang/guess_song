# Update Progress - 2026-05-21 16:46:36 HKT

## GitHub status

Pending push at the time this file is created. This update should be committed and pushed immediately after verification.

## Request

Support a no-computer-microphone setup where the host can use a phone as a microphone, and remote players can hear whoever opens the mic.

## Completed update

- Added host-side relay for player phone microphones.
- When any phone opens mic, the host receives the stream and relays it to all connected remote-mode players.
- The mic stream is not sent back to the same phone that opened the mic, reducing self-echo.
- New remote players receive already-active mic streams after they join.
- Relay calls are cleaned up when a player disconnects, reconnects, or stops mic.
- Remote player phones can now receive and play relayed mic streams from other players/host phone.
- The same "enable listening" speaker button can unlock relayed mic audio if mobile autoplay blocks it.
- Updated cache-busting versions to `phone-mic-relay-1`.

## Recommended usage

- If the venue has no computer microphone, use one phone as the host microphone.
- That phone should join as `在現場`, then press the mic button when the host speaks.
- Remote players joined as `不在現場` will hear that phone mic through the host computer relay.
- Avoid joining the host mic phone as `不在現場`, because it may also receive remote audio and create feedback.

## Changed files

- `app.js`
- `player.js`
- `index.html`
- `player.html`
- `docs/UPDATE_PROGRESS_2026-05-21_164636_HKT.md`

## Verification run

- `node --check app.js`
- `node --check player.js`
- `git diff --check`

## Note

No local in-app browser test was run, following the project workflow preference.
