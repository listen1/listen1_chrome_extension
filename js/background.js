/* global chrome Github */
chrome.browserAction.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.extension.getURL('listen1.html') });
});


function hack_referer_header(details) {
  const replace_referer = true;
  let replace_origin = true;
  const add_referer = true;
  let add_origin = true;

  let referer_value = '';

  if (details.url.indexOf('://music.163.com/') !== -1) {
    referer_value = 'http://music.163.com/';
  }
  if (details.url.indexOf('://gist.githubusercontent.com/') !== -1) {
    referer_value = 'https://gist.githubusercontent.com/';
  }

  if (details.url.indexOf('api.xiami.com/') !== -1 || details.url.indexOf('.xiami.com/song/playlist/id/') !== -1) {
    referer_value = 'https://www.xiami.com/';
  }

  if ((details.url.indexOf('c.y.qq.com/') !== -1)
        || (details.url.indexOf('i.y.qq.com/') !== -1)
        || (details.url.indexOf('qqmusic.qq.com/') !== -1)
        || (details.url.indexOf('music.qq.com/') !== -1)
        || (details.url.indexOf('imgcache.qq.com/') !== -1)) {
    referer_value = 'https://y.qq.com/';
  }

  if (details.url.indexOf('.kugou.com/') !== -1) {
    referer_value = 'http://www.kugou.com/';
  }

  if (details.url.indexOf('.kuwo.cn/') !== -1) {
    referer_value = 'http://www.kuwo.cn/';
  }

  if (details.url.indexOf('.bilibili.com/') !== -1) {
    referer_value = 'http://www.bilibili.com/';
    replace_origin = false;
    add_origin = false;
  }

  let isRefererSet = false;
  let isOriginSet = false;

  const blockingResponse = {};


  const headers = details.requestHeaders.map((item) => {
    const header = item;
    if (replace_referer && (header.name === 'Referer') && (referer_value !== '')) {
      header.value = referer_value;
      isRefererSet = true;
    }
    if (replace_origin && (header.name === 'Origin') && (referer_value !== '')) {
      header.value = referer_value;
      isOriginSet = true;
    }
    return header;
  });

  if (add_referer && (!isRefererSet) && (referer_value !== '')) {
    headers.push({
      name: 'Referer',
      value: referer_value,
    });
  }

  if (add_origin && (!isOriginSet) && (referer_value !== '')) {
    headers.push({
      name: 'Origin',
      value: referer_value,
    });
  }

  blockingResponse.requestHeaders = headers;
  return blockingResponse;
}

chrome.webRequest.onBeforeSendHeaders.addListener(hack_referer_header, {
  urls: ['*://music.163.com/*', '*://*.xiami.com/*', '*://*.qq.com/*', '*://*.kugou.com/*', '*://*.bilibili.com/*', '*://*.githubusercontent.com/*'],
}, ['requestHeaders', 'blocking']);


/**
 * Get tokens.
 */

chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    const code = request.query.split('=')[1];
    Github.handleCallback(code);
    sendResponse();
  },
);
