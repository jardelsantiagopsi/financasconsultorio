'use strict';

const CACHE = 'financasconsultorio-v1';
const APP_SHELL = [
  '/financasconsultorio/',
  '/financasconsultorio/index.html',
  '/financasconsultorio/manifest.json',
  '/financasconsultorio/icon.svg',
  '/financasconsultorio/icon-maskable.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(APP_SHELL))
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

  // Pass through Firebase, CDN, and other external requests
  if (url.hostname !== self.location.hostname) return;

  // Cache-first for app shell assets
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
});
