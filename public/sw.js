const CACHE_NAME = "scholara-static-v1";

self.addEventListener("install", (event) => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((cacheName) => cacheName !== CACHE_NAME)
                    .map((cacheName) => caches.delete(cacheName))
            );
        })
    );

    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const request = event.request;

    if (request.method !== "GET") {
        return;
    }

    const url = new URL(request.url);

    // Only handle requests belonging to Scholara.
    if (url.origin !== self.location.origin) {
        return;
    }

    // Never cache API requests.
    if (url.pathname.startsWith("/api/")) {
        return;
    }

    // Never cache authentication routes.
    if (
        url.pathname.startsWith("/login") ||
        url.pathname.startsWith("/logout") ||
        url.pathname.includes("/auth/")
    ) {
        return;
    }

    // Cache only static Next.js assets.
    const isNextStaticAsset =
        url.pathname.startsWith("/_next/static/");

    const isPublicStaticAsset =
        url.pathname.startsWith("/icons/") ||
        url.pathname.endsWith(".png") ||
        url.pathname.endsWith(".jpg") ||
        url.pathname.endsWith(".jpeg") ||
        url.pathname.endsWith(".webp") ||
        url.pathname.endsWith(".svg") ||
        url.pathname.endsWith(".woff") ||
        url.pathname.endsWith(".woff2");

    if (!isNextStaticAsset && !isPublicStaticAsset) {
        return;
    }

    event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
            const cachedResponse = await cache.match(request);

            if (cachedResponse) {
                return cachedResponse;
            }

            try {
                const networkResponse = await fetch(request);

                if (
                    networkResponse &&
                    networkResponse.ok
                ) {
                    cache.put(
                        request,
                        networkResponse.clone()
                    );
                }

                return networkResponse;
            } catch {
                return new Response(
                    "Scholara is currently offline.",
                    {
                        status: 503,
                        headers: {
                            "Content-Type": "text/plain",
                        },
                    }
                );
            }
        })
    );
});