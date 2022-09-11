const cacheName = 'cache_dev';

export function handleFetch(event: FetchEvent) {
  const { destination, url } = event.request;
  if ((destination === 'image' || destination === 'audio') && !url.startsWith('chrome-extension')) {
    event.respondWith(
      caches.open(cacheName).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        const fetchedResponse = fetch(event.request).then((networkResponse) => {
          //can not perform put on partial response
          if (networkResponse.ok && networkResponse.status !== 206) {
            cache.put(event.request, networkResponse.clone());
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
