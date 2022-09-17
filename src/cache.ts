const cacheName = 'cache_dev';
/**
 * Use stale-while-revalidate strategy to cache image and audio
 * https://developer.chrome.com/docs/workbox/caching-strategies-overview/#stale-while-revalidate
 */
export function handleFetch(event: FetchEvent) {
  const { respondWith, request } = event;
  const { destination, url } = request;
  if ((destination === 'image' || destination === 'audio') && !url.startsWith('chrome-extension')) {
    respondWith(
      caches.open(cacheName).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        const fetchedResponse = fetch(request).then((networkResponse) => {
          //can not perform put on partial response
          if (networkResponse.ok && networkResponse.status !== 206) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        });
        return cachedResponse || fetchedResponse;
      })
    );
  } else {
    return;
  }
}

self.addEventListener('fetch', handleFetch);
