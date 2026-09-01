/**
 * Service worker cangkang aplikasi (app shell).
 *
 * Catatan penting: konten Apps Script (script.google.com / googleusercontent.com)
 * TIDAK pernah di-cache — selalu diambil langsung dari jaringan karena bersifat
 * dinamis dan lintas-origin. Yang di-cache hanya cangkang PWA-nya.
 */
// Naikkan nomor versi setiap kali isi cangkang berubah, agar service worker lama
// digantikan dan seluruh cache lamanya dibuang saat aktivasi.
const CACHE = 'log-aktivitas-shell-v3';
const SHELL = [
  './',
  './index.html',
  './config.js',
  './manifest.webmanifest',
  './icons/favicon-32.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon-180.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Biarkan semua permintaan lintas-origin (Apps Script, CDN Bootstrap, dll) apa adanya.
  if (url.origin !== self.location.origin) return;

  // Navigasi dan konfigurasi: selalu utamakan jaringan, jatuh ke cache bila offline.
  // `cache: 'reload'` melewati cache HTTP peramban — tanpa ini GitHub Pages
  // (max-age=600) masih menyajikan cangkang lama sampai sepuluh menit setelah rilis.
  const isNavigasi = req.mode === 'navigate';
  const isConfig = url.pathname.endsWith('/config.js');

  if (isNavigasi || isConfig) {
    const kunci = isNavigasi ? './index.html' : req;
    event.respondWith(
      fetch(new Request(req.url, { cache: 'reload', credentials: 'same-origin' }))
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(kunci, copy));
          return res;
        })
        .catch(() => caches.match(kunci))
    );
    return;
  }

  // Aset cangkang: cache dulu, perbarui di latar belakang.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
