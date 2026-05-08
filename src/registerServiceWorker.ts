export function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator) || import.meta.env.DEV) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/co-parent-vault/sw.js").catch(() => {
      // Production console output is intentionally quiet; failures only disable offline caching.
    });
  });
}
