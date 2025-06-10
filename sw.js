// public/sw.js
/* eslint-disable no-restricted-globals */
/* eslint-env serviceworker */
console.log('[SW] starting');

importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

if (workbox) {
    console.log('[SW] Workbox is loaded');
    workbox.setConfig({ debug: true });

    workbox.routing.registerRoute(
        ({ url }) =>
            url.origin === 'https://api.mapbox.com' ||
            url.origin === 'https://events.mapbox.com',
        new workbox.strategies.CacheFirst({
            cacheName: 'mapbox-cache',
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 500,
                    maxAgeSeconds: 30 * 24 * 60 * 60,
                }),
            ],
        })
    );
} else {
    console.log('[SW] Workbox failed to load');
}