// Sahaba Timeline service worker: lets the timeline be installed and open without a connection.
// Network first, so the newest version is used whenever online; the last copy is kept for when offline.
// The fonts are kept too, so the Arabic still looks right offline.
const CACHE = 'sahaba-v1';
const CORE = ['/sahaba/', '/sahaba/site.webmanifest', '/favicon.svg', '/sahaba/icon-192.png', '/sahaba/icon-512.png'];
const FONTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('sahaba-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const own = url.origin === self.location.origin;
  if (!own && !FONTS.includes(url.hostname)) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: own }).then((hit) => hit || (req.mode === 'navigate' ? caches.match('/sahaba/') : Response.error())))
  );
});
