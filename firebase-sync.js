(function () {
  const DEFAULT_SDK_VERSION = "12.7.0";
  const initPromises = new Map();

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

  async function loadFirebase(role = "host") {
    if (!isConfigured()) return null;
    const clientRole = role === "player" ? "player" : "host";
    if (initPromises.has(clientRole)) return initPromises.get(clientRole);

    const initPromise = (async () => {
      const current = config();
      const version = current.sdkVersion || DEFAULT_SDK_VERSION;
      const [appModule, databaseModule, authModule] = await Promise.all([
        import(`https://www.gstatic.com/firebasejs/${version}/firebase-app.js`),
        import(`https://www.gstatic.com/firebasejs/${version}/firebase-database.js`),
        current.anonymousAuth
          ? import(`https://www.gstatic.com/firebasejs/${version}/firebase-auth.js`)
          : Promise.resolve(null),
      ]);

      const appName = `guess-song-${clientRole}`;
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

      let authUid = "";
      if (authModule) {
        const auth = authModule.getAuth(app);
        const credential = auth.currentUser || (await authModule.signInAnonymously(auth)).user;
        authUid = credential.uid;
      }

      return {
        database: databaseModule.getDatabase(app),
        authUid,
        ...databaseModule,
      };
    })();

    const ready = initPromise.catch((error) => {
      if (initPromises.get(clientRole) === ready) initPromises.delete(clientRole);
      throw error;
    });
    initPromises.set(clientRole, ready);
    return ready;
  }

  async function createRoomClient({ roomId, role }) {
    const firebase = await loadFirebase(role);
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

    return {
      enabled: true,
      roomId,
      roomKey,
      authUid: firebase.authUid,
      set: setValue,
      update: updateValue,
      push: pushValue,
      onValue,
      onChildAdded,
      onDisconnectSet,
      cleanup,
    };
  }

  async function claimHostRoom({ roomIds, instanceId, buildVersion, staleMs }) {
    const firebase = await loadFirebase("host");
    if (!firebase) return null;

    const candidates = Array.isArray(roomIds) ? roomIds : [roomIds];
    const cleanRoomIds = candidates
      .map((roomId) => String(roomId || "").trim())
      .filter(Boolean);
    const ownerId = String(instanceId || "").trim();
    const staleAfter = Math.max(30000, Number(staleMs || 120000));

    for (const roomId of cleanRoomIds) {
      const roomKey = firebaseKey(roomId);
      const metaRef = firebase.ref(firebase.database, `rooms/${roomKey}/meta`);
      const now = Date.now();

      try {
        const result = await firebase.runTransaction(
          metaRef,
          (current) => {
            const meta = current && typeof current === "object" ? current : {};
            const currentOwner = String(meta.hostInstanceId || "");
            const heartbeatAt = Number(meta.hostHeartbeatAt || meta.updatedAt || 0);
            const hostOnline = meta.hostOnline === true;
            const sameOwner = ownerId && currentOwner === ownerId;
            const stale = !heartbeatAt || now - heartbeatAt > staleAfter;

            if (hostOnline && !sameOwner && !stale) return;

            return {
              ...meta,
              roomId,
              role: "host",
              buildVersion,
              hostOnline: true,
              hostInstanceId: ownerId,
              ...(firebase.authUid ? { hostUid: firebase.authUid } : {}),
              hostHeartbeatAt: now,
              updatedAt: now,
            };
          },
          { applyLocally: false }
        );

        if (result.committed) {
          return {
            roomId,
            roomKey,
            meta: result.snapshot.val(),
          };
        }
      } catch {
        // Try the next candidate; callers can still use PeerJS fallback.
      }
    }

    return null;
  }

  window.GuessSongFirebase = {
    isConfigured,
    createRoomClient,
    claimHostRoom,
  };
})();
