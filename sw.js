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

self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // Intercept Mapbox style JSON
    if (url.includes('api.mapbox.com/styles/v1/')) {
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request).then((resp) => {
                    // Optionally, rewrite URLs in the style JSON here
                    // and cache the response
                    return resp;
                });
            })
        );
        return;
    }

    // Intercept Mapbox tiles
    if (url.includes('api.mapbox.com/v4/') || url.includes('api.mapbox.com/tiles/')) {
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request).then((resp) => {
                    // Cache and return tile
                    return resp;
                });
            })
        );
        return;
    }

    // Intercept Mapbox glyphs
    if (url.includes('api.mapbox.com/fonts/v1/')) {
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request).then((resp) => {
                    // Cache and return glyph
                    return resp;
                });
            })
        );
        return;
    }

    // Intercept Mapbox sprites
    if (url.includes('sprite') && url.includes('api.mapbox.com')) {
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request).then((resp) => {
                    // Cache and return sprite
                    return resp;
                });
            })
        );
        return;
    }

    if (url.includes('api.mapbox.com')) {
        event.respondWith(
            caches.open('mapbox-cache').then(async (cache) => {
                const cached = await cache.match(event.request);
                if (cached) return cached;
                const response = await fetch(event.request);
                cache.put(event.request, response.clone());
                return response;
            })
        );
        return;
    }
});