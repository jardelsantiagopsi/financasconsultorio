'use strict';

const CACHE = 'financasconsultorio-v3';
const STATIC = [
  '/financasconsultorio/manifest.json',
  '/financasconsultorio/logo-256.jpg',
  '/financasconsultorio/icon-192.png',
  '/financasconsultorio/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(STATIC))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.hostname !== self.location.hostname) return;

  const isHTML = url.pathname.endsWith('/') || url.pathname.endsWith('.html');

  if (isHTML) {
    // Network-first para o app: sempre busca versão mais recente, cai no cache se offline
    e.respondWith(
      fetch(request)
        .then(resp => {
          if (resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE).then(c => c.put(request, clone));
          }
          return resp;
        })
        .catch(() => caches.match(request))
    );
  } else {
    // Cache-first para assets estáticos (imagens, ícones)
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(resp => {
          if (resp.ok && url.pathname.startsWith('/financasconsultorio/')) {
            const clone = resp.clone();
            caches.open(CACHE).then(c => c.put(request, clone));
          }
          return resp;
        });
      })
    );
  }
});
