(() => {
  const BUILD_VERSION = "premium-mobile-16";

  if (!("serviceWorker" in navigator)) return;
  if (!window.isSecureContext && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`./sw.js?v=${BUILD_VERSION}`, { scope: "./" })
      .catch(() => {
        // The game still works as a normal webpage if install support is unavailable.
      });
  });
})();
