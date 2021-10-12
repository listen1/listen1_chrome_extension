/// <reference lib="webworker" /> 

export { }; // Avoid type checking error

declare const self: ServiceWorkerGlobalScope;

self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;

  if (!request.destination || request.destination === 'image') {
    const reqUrl = new URL(request.url);
    if (reqUrl.host !== location.host) {
      const req = { ...request };
      req.url = `/proxy/${reqUrl.protocol}/${reqUrl.hostname}${reqUrl.pathname}${reqUrl.search}`;
      console.log(req.url);
      event.respondWith(fetch(req.url, req));
    }
  }

});
