const CACHE = 'jarvis-local-shell-3.3.0-rc.2-web.2';
const PREVIOUS = 'jarvis-local-shell-3.3.0-rc.2-web.1';
const ENGINE = 'jarvis-local-engine-onnx-1.22.0-dev.20250409-89f8206ba4';
const FILES = [
  './', './index.html', './styles.css', './app.js', './models.js', './inference-worker.js',
  './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png',
];
const ENGINE_FILES = [
  './vendor/transformers.min.js',
  './vendor/ort-wasm-simd-threaded.jsep.mjs',
  './vendor/ort-wasm-simd-threaded.jsep.wasm',
];
const engineURLs = new Set(ENGINE_FILES.map(file => new URL(file, self.registration.scope).href));

self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES))));
self.addEventListener('activate', event => event.waitUntil((async () => {
  const names = await caches.keys();
  if (names.includes(PREVIOUS)) {
    const previous = await caches.open(PREVIOUS);
    const engine = await caches.open(ENGINE);
    for (const file of ENGINE_FILES) {
      const saved = await previous.match(file);
      if (saved && !await engine.match(file)) {
        try { await engine.put(file, saved); } catch { /* The previous copy remains available. */ }
      }
    }
    if (!(await Promise.all(ENGINE_FILES.map(file => engine.match(file)))).every(Boolean)) {
      await self.clients.claim();
      return;
    }
  }
  for (const name of names) if (name.startsWith('jarvis-local-shell-') && name !== CACHE) await caches.delete(name);
  await self.clients.claim();
})()));

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  url.search = '';
  if (engineURLs.has(url.href)) {
    if (event.request.headers.has('Range')) return;
    const response = caches.match(url.href).then(cached => cached || fetch(event.request));
    event.waitUntil(response.then(async result => {
      if (!result.ok || result.status !== 200) return;
      const copy = result.clone();
      const cache = await caches.open(ENGINE);
      if (!await cache.match(url.href)) await cache.put(url.href, copy);
      else await copy.body?.cancel();
    }).catch(() => {}));
    event.respondWith(response);
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(event.request, { ignoreSearch: true });
    if (cached) return cached;
    try { return await fetch(event.request); }
    catch (error) {
      if (event.request.mode === 'navigate') return cache.match('./index.html');
      throw error;
    }
  })());
});
