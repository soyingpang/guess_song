const fs = require('node:fs');
const path = require('node:path');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');

(async () => {
  const testEnv = await initializeTestEnvironment({
    projectId: 'demo-guess-song',
    database: {
      host: '127.0.0.1',
      port: 9000,
      rules: fs.readFileSync(path.resolve(__dirname, '../database.rules.json'), 'utf8'),
    },
  });
  try {
    const anon = testEnv.unauthenticatedContext().database();
    const host = testEnv.authenticatedContext('host-1').database();
    const player = testEnv.authenticatedContext('player-1').database();
    const stranger = testEnv.authenticatedContext('player-2').database();
    const base = 'rooms/test-room';
    await assertFails(anon.ref(`${base}/meta`).once('value'));
    await assertSucceeds(host.ref(`${base}/meta`).set({
      hostUid: 'host-1', hostOnline: true, hostHeartbeatAt: Date.now(), roomId: 'test-room',
    }));
    await assertFails(stranger.ref(`${base}/meta`).update({ hostOnline: false }));
    await assertFails(player.ref(`${base}/players/player-1`).set({
      id: 'player-1', authUid: 'player-1', name: 'Test Player', connected: true, score: 999,
    }));
    await assertSucceeds(player.ref(`${base}/players/player-1`).update({
      id: 'player-1', authUid: 'player-1', name: 'Test Player', connected: true,
    }));
    await assertSucceeds(host.ref(`${base}/players`).once('value'));
    await assertFails(player.ref(`${base}/players`).once('value'));
    await assertSucceeds(host.ref(`${base}/players/player-1`).update({ score: 5 }));
    await assertSucceeds(player.ref(`${base}/players/player-1`).update({ name: 'Test Player Again' }));
    await assertFails(player.ref(`${base}/players/player-1`).update({ score: 999 }));
    await assertFails(stranger.ref(`${base}/players/player-1`).update({ connected: false }));
    await assertSucceeds(host.ref(`${base}/playerStates/player-1`).set({ questionId: 'q1', score: 5 }));
    await assertSucceeds(player.ref(`${base}/playerStates/player-1`).once('value'));
    await assertFails(stranger.ref(`${base}/playerStates/player-1`).once('value'));
    await assertFails(player.ref(`${base}/playerStates/player-1`).set({ score: 999 }));
    await assertFails(anon.ref(`${base}/displayState`).once('value'));
    await assertSucceeds(host.ref(`${base}/displayState`).set({ roomId: 'test-room', round: 1, revealed: false }));
    await assertSucceeds(player.ref(`${base}/displayState`).once('value'));
    await assertFails(player.ref(`${base}/displayState`).set({ revealed: true }));
    await assertSucceeds(player.ref(`${base}/events`).push({
      playerId: 'player-1', type: 'answer', message: { type: 'answer', questionId: 'q1', answer: 'Test' },
    }));
    await assertFails(stranger.ref(`${base}/events`).push({
      playerId: 'player-1', type: 'answer', message: { type: 'answer', questionId: 'q1', answer: 'Test' },
    }));
    await assertSucceeds(host.ref(`${base}/meta`).update({ hostOnline: false }));
    await assertSucceeds(stranger.ref(`${base}/meta`).transaction((meta) => ({
      ...meta, hostUid: 'player-2', hostOnline: true, hostHeartbeatAt: Date.now(),
    })));
    console.log('Secure room rules: all permission checks passed');
  } finally {
    await testEnv.cleanup();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
