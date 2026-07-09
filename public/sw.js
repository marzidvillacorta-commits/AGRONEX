const CACHE = "agronex-v5";
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/icons/agronex-192.png",
  "/icons/agronex-512.png",
  "/icons/agronex-maskable-512.png",
  "/icons/agronex-apple-180.png",
];

const OFFLINE_HTML = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>AgroNex</title>
    <style>
      body{margin:0;min-height:100vh;display:grid;place-items:center;background:#123f2e;color:#fff;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:24px}
      main{max-width:360px}
      h1{font-size:32px;margin:0 0 12px}
      p{line-height:1.6;color:rgba(255,255,255,.72)}
    </style>
  </head>
  <body>
    <main>
      <h1>AgroNex</h1>
      <p>AgroNex está sin conexión. Puedes seguir trabajando con los datos guardados en este equipo.</p>
    </main>
  </body>
</html>`;

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))),
      self.clients.claim(),
    ]),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || !request.url.startsWith(self.location.origin)) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

async function networkFirstNavigation(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put("/", response.clone());
    return response;
  } catch {
    return (await cache.match("/")) ?? new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok && response.type === "basic") cache.put(request, response.clone());
    return response;
  }).catch(() => cached);

  return cached ?? fetchPromise ?? new Response("", { status: 504, statusText: "Offline" });
}
