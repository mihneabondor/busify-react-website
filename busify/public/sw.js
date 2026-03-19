/* eslint-disable no-restricted-globals */
/* eslint-env serviceworker */
console.log('[SW] starting');

importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

if (workbox) {
    workbox.setConfig({ debug: false });

    // ===========================================
    // MAPBOX CACHING STRATEGIES
    // ===========================================

    // 1. Vector Tiles - Aggressive caching (largest payload, rarely changes)
    workbox.routing.registerRoute(
        ({ url }) =>
            url.hostname === 'api.mapbox.com' &&
            url.pathname.includes('/v4/'),
        new workbox.strategies.CacheFirst({
            cacheName: 'mapbox-tiles-cache',
            plugins: [
                new workbox.cacheableResponse.CacheableResponsePlugin({
                    statuses: [0, 200],
                }),
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 1000,
                    maxAgeSeconds: 60 * 24 * 60 * 60, // 60 days
                }),
            ],
        })
    );

    // 2. Map Styles - StaleWhileRevalidate (may update occasionally)
    workbox.routing.registerRoute(
        ({ url }) =>
            url.hostname === 'api.mapbox.com' &&
            url.pathname.includes('/styles/'),
        new workbox.strategies.StaleWhileRevalidate({
            cacheName: 'mapbox-styles-cache',
            plugins: [
                new workbox.cacheableResponse.CacheableResponsePlugin({
                    statuses: [0, 200],
                }),
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 20,
                    maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
                }),
            ],
        })
    );

    // 3. Sprites & Icons - Long-term cache (static assets)
    workbox.routing.registerRoute(
        ({ url }) =>
            url.hostname === 'api.mapbox.com' &&
            url.pathname.includes('/sprites/'),
        new workbox.strategies.CacheFirst({
            cacheName: 'mapbox-sprites-cache',
            plugins: [
                new workbox.cacheableResponse.CacheableResponsePlugin({
                    statuses: [0, 200],
                }),
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 50,
                    maxAgeSeconds: 90 * 24 * 60 * 60, // 90 days
                }),
            ],
        })
    );

    // 4. Fonts/Glyphs - Long-term cache (static assets)
    workbox.routing.registerRoute(
        ({ url }) =>
            url.hostname === 'api.mapbox.com' &&
            url.pathname.includes('/fonts/'),
        new workbox.strategies.CacheFirst({
            cacheName: 'mapbox-fonts-cache',
            plugins: [
                new workbox.cacheableResponse.CacheableResponsePlugin({
                    statuses: [0, 200],
                }),
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 100,
                    maxAgeSeconds: 90 * 24 * 60 * 60, // 90 days
                }),
            ],
        })
    );

    // 5. Fallback for other Mapbox API requests
    workbox.routing.registerRoute(
        ({ url }) =>
            url.hostname === 'api.mapbox.com' &&
            !url.pathname.includes('/v4/') &&
            !url.pathname.includes('/styles/') &&
            !url.pathname.includes('/sprites/') &&
            !url.pathname.includes('/fonts/'),
        new workbox.strategies.StaleWhileRevalidate({
            cacheName: 'mapbox-api-cache',
            plugins: [
                new workbox.cacheableResponse.CacheableResponsePlugin({
                    statuses: [0, 200],
                }),
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 100,
                    maxAgeSeconds: 24 * 60 * 60, // 24 hours
                }),
            ],
        })
    );

    // 6. Mapbox Events/Telemetry - Network only (no need to cache analytics)
    workbox.routing.registerRoute(
        ({ url }) => url.hostname === 'events.mapbox.com',
        new workbox.strategies.NetworkOnly()
    );

    // ===========================================
    // BUSIFY API CACHING
    // ===========================================

    // 7. Mapbox token endpoint - Cache to avoid repeated fetches
    workbox.routing.registerRoute(
        ({ url }) =>
            url.hostname === 'busifyserver.onrender.com' &&
            url.pathname === '/mapbox',
        new workbox.strategies.StaleWhileRevalidate({
            cacheName: 'busify-config-cache',
            plugins: [
                new workbox.cacheableResponse.CacheableResponsePlugin({
                    statuses: [0, 200],
                }),
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 5,
                    maxAgeSeconds: 24 * 60 * 60, // 24 hours
                }),
            ],
        })
    );

    // 8. Static data (stops, routes) - Changes infrequently
    workbox.routing.registerRoute(
        ({ url }) =>
            url.hostname === 'busifyserver.onrender.com' &&
            (url.pathname === '/stops' || url.pathname === '/routes'),
        new workbox.strategies.StaleWhileRevalidate({
            cacheName: 'busify-static-cache',
            plugins: [
                new workbox.cacheableResponse.CacheableResponsePlugin({
                    statuses: [0, 200],
                }),
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 10,
                    maxAgeSeconds: 6 * 60 * 60, // 6 hours
                }),
            ],
        })
    );

    // 9. Schedule data from orare.busify.ro
    workbox.routing.registerRoute(
        ({ url }) => url.hostname === 'orare.busify.ro',
        new workbox.strategies.StaleWhileRevalidate({
            cacheName: 'busify-schedules-cache',
            plugins: [
                new workbox.cacheableResponse.CacheableResponsePlugin({
                    statuses: [0, 200],
                }),
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60, // 1 hour
                }),
            ],
        })
    );

} else {
    console.log('[SW] Workbox failed to load');
}