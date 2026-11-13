/* Service worker: la app funciona sin conexión.
   ACTUALIZAR: al publicar cambios, sube VERSION aquí y APP_VERSION en index.html.
   El navegador detecta el cambio de este archivo y la app muestra el aviso «Nueva versión disponible». */
const VERSION = 'desbloquea-v36';
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  ...Array.from({length:10},(_,i)=>'./backgrounds/zone-'+(i+1)+'.webp'),
  ...['lia','jean','van'].flatMap(h=>['start','ready','map','story','victory','defeat'].map(p=>'./heroes/'+h+(p==='start'?'':'-'+p)+'.webp')),
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  // Revalidate the illustrated assets: a new app version must not reuse old HTTP-cached art.
  const resources = SHELL.map(url => new Request(new URL(url, self.location.href), { cache: 'reload' }));
  e.waitUntil(caches.open(VERSION).then(cache => cache.addAll(resources)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Caché primero + actualización en segundo plano (stale-while-revalidate) */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(VERSION).then(async cache => {
      const hit = await cache.match(req, { ignoreSearch: true });
      const net = fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
      if (hit) { net.catch(() => {}); return hit; }
      return (await net) || (req.mode === 'navigate' ? cache.match('./index.html') : Response.error());
    })
  );
});

/* La página pide activar la versión nueva cuando el usuario pulsa «Actualizar» */
self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });

