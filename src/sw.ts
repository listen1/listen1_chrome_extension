/// <reference lib="webworker" /> 

// import { registerRoute } from 'workbox-routing';
// import { CacheFirst } from 'workbox-strategies';
export { }; // Avoid type checking error

declare const self: ServiceWorkerGlobalScope;

self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;

  if (!request.destination || request.destination === 'image') {
    const reqUrl = new URL(request.url);
    if (reqUrl.host !== location.host) {
      const req = { ...request };
      // req.redirect = 'error';
      // const req = new Request(request);
      req.url = `/proxy/${reqUrl.protocol}/${reqUrl.hostname}${reqUrl.pathname}${reqUrl.search}`;
      console.log(req.url);
      event.respondWith(fetch(req.url, req));
    }
  }

  // if (request.destination === 'image') {
  //   const reqUrl = new URL(request.url);
  //   if (reqUrl.host !== location.host && !reqUrl.pathname.startsWith('/images')) {
  //     event.respondWith(
  //       fetch('/images/mycover.jpg', request)
  //     );
  //   }
  // }
});

// registerRoute(
//   ({request}) => request.destination === 'image',
//   new CacheFirst({
//     cacheName: 'image-cache',
//   })
// );



