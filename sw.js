// Bump VERSION when any shell file changes.
const VERSION = 'fpvcheck-v1';
const SHELL = [
  './', 'index.html', 'styles.css', 'app.js', 'rules.js', 'i18n.js', 'manifest.webmanifest',
  'icon.svg', 'icon-192.png', 'icon-512.png', 'data/airports.json',
  'fonts/barlow-cond-500.woff2', 'fonts/barlow-cond-700.woff2', 'fonts/barlow-cond-800.woff2',
  'fonts/plex-mono-400.woff2', 'fonts/plex-mono-600.woff2',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Network first (so edits show up on localhost), cache fallback for the field.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('index.html')))
  );
});
