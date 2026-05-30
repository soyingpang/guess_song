(function () {
  const DEFAULT_SDK_VERSION = "12.7.0";
  let initPromise = null;

  function config() {
    return window.GUESS_SONG_FIREBASE_CONFIG || {};
  }

  function isConfigured() {
    const current = config();
    return Boolean(
      current &&
        current.enabled !== false &&
        current.apiKey &&
        current.databaseURL &&
        current.projectId
    );
  }

  function firebaseKey(value) {
    return encodeURIComponent(String(value || "room"))
      .replace(/[.#$/[\]%]/g, "_")
      .slice(0, 180);
  }

  async function loadFirebase() {
    if (!isConfigured()) return null;
    if (initPromise) return initPromise;

    initPromise = (async () => {
      const current = config();
      const version = current.sdkVersion || DEFAULT_SDK_VERSION;
      const [appModule, databaseModule] = await Promise.all([
        import(`https://www.gstatic.com/firebasejs/${version}/firebase-app.js`),
        import(`https://www.gstatic.com/firebasejs/${version}/firebase-database.js`),
      ]);

      const appName = "guess-song-global";
      const existingApp = appModule.getApps().find((item) => item.name === appName);
      const app = existingApp || appModule.initializeApp(
        {
          apiKey: current.apiKey,
          authDomain: current.authDomain,
          databaseURL: current.databaseURL,
          projectId: current.projectId,
          appId: current.appId,
        },
        appName
      );

      return {
        database: databaseModule.getDatabase(app),
        ...databaseModule,
      };
    })();

    return initPromise;
  }

  async function createRoomClient({ roomId, role }) {
    const firebase = await loadFirebase();
    if (!firebase) return null;

    const roomKey = firebaseKey(roomId);
    const basePath = `rooms/${roomKey}`;
    const cleanups = [];

    function roomRef(parts = []) {
      const path = [basePath, ...parts].filter(Boolean).join("/");
      return firebase.ref(firebase.database, path);
    }

    function track(unsubscribe) {
      if (typeof unsubscribe === "function") cleanups.push(unsubscribe);
      return unsubscribe;
    }

    async function setValue(parts, value) {
      return firebase.set(roomRef(parts), value);
    }

    async function updateValue(parts, value) {
      return firebase.update(roomRef(parts), value);
    }

    async function pushValue(parts, value) {
      return firebase.push(roomRef(parts), value);
    }

    function onValue(parts, callback) {
      return track(firebase.onValue(roomRef(parts), (snapshot) => {
        callback(snapshot.val(), snapshot.key);
      }));
    }

    function onChildAdded(parts, callback) {
      return track(firebase.onChildAdded(roomRef(parts), (snapshot) => {
        callback(snapshot.val(), snapshot.key);
      }));
    }

    function onDisconnectSet(parts, value) {
      return firebase.onDisconnect(roomRef(parts)).set(value);
    }

    function cleanup() {
      while (cleanups.length) {
        const unsubscribe = cleanups.pop();
        try {
          unsubscribe();
        } catch {
          // Ignore listener cleanup failures during page shutdown.
        }
      }
    }

    await updateValue(["meta"], {
      roomId,
      role,
      updatedAt: Date.now(),
    });

    return {
      enabled: true,
      roomId,
      roomKey,
      set: setValue,
      update: updateValue,
      push: pushValue,
      onValue,
      onChildAdded,
      onDisconnectSet,
      cleanup,
    };
  }

  window.GuessSongFirebase = {
    isConfigured,
    createRoomClient,
  };
})();
