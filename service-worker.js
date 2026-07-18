'use strict';
const CACHE='golf-voice-test-v3.8.0-dev-build-01';
const FILES=['./','./index.html','./css/style.css','./js/app.js','./manifest.webmanifest','./icons/icon.svg','./icons/apple-touch-icon.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(n=>{if(n&&n.status===200){const copy=n.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return n}).catch(()=>caches.match('./index.html'))))});
