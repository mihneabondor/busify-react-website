/* eslint-disable no-restricted-globals */
/* eslint-env serviceworker */
console.log('[SW] starting');

// Load Workbox from CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

if (workbox) {
    console.log('[SW] Workbox is loaded');
    workbox.setConfig({ debug: true });

    // Cache Mapbox requests with CacheFirst strategy
    workbox.routing.registerRoute(
        ({ url }) =>
            url.origin === 'https://api.mapbox.com' ||
            url.origin === 'https://events.mapbox.com',
        new workbox.strategies.CacheFirst({
            cacheName: 'mapbox-cache',
            plugins: [
                new workbox.cacheableResponse.CacheableResponsePlugin({
                    statuses: [0, 200], // Only cache valid responses
                }),
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 500,
                    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                }),
            ],
        })
    );

} else {
    console.log('[SW] Workbox failed to load');
}