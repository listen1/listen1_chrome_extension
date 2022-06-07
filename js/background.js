/* eslint-disable no-unused-vars */
/* global GithubClient */
chrome.browserAction.onClicked.addListener((tab) => {
  chrome.tabs.create(
    {
      url: chrome.extension.getURL('listen1.html'),
    },
    (new_tab) => {
      // Tab opened.
    }
  );
});
const MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30';

function hack_referer_header(details) {
  const replace_referer = true;
  let replace_origin = true;
  let add_referer = true;
  let add_origin = true;

  let referer_value = '';
  let origin_value = '';
  let ua_value = '';

  if (details.url.includes('://music.163.com/')) {
    referer_value = 'https://music.163.com/';
  }
  if (details.url.includes('://interface3.music.163.com/')) {
    referer_value = 'https://music.163.com/';
  }
  if (details.url.includes('://gist.githubusercontent.com/')) {
    referer_value = 'https://gist.githubusercontent.com/';
  }

  if (details.url.includes('.xiami.com/')) {
    add_origin = false;
    add_referer = false;
    // referer_value = "https://www.xiami.com";
  }

  if (details.url.includes('c.y.qq.com/')) {
    referer_value = 'https://y.qq.com/';
    origin_value = 'https://y.qq.com';
  }
  if (
    details.url.includes('i.y.qq.com/') ||
    details.url.includes('qqmusic.qq.com/') ||
    details.url.includes('music.qq.com/') ||
    details.url.includes('imgcache.qq.com/')
  ) {
    referer_value = 'https://y.qq.com/';
  }

  if (details.url.includes('.kugou.com/')) {
    referer_value = 'https://www.kugou.com/';
    ua_value = MOBILE_UA;
  }
  if (details.url.includes('m.kugou.com/')) {
    ua_value = MOBILE_UA;
  }
  if (details.url.includes('.kuwo.cn/')) {
    referer_value = 'https://www.kuwo.cn/';
  }

  if (
    details.url.includes('.bilibili.com/') ||
    details.url.includes('.bilivideo.com/')
  ) {
    referer_value = 'https://www.bilibili.com/';
    replace_origin = false;
    add_origin = false;
  }

  if (details.url.includes('.taihe.com/')) {
    referer_value = 'https://music.taihe.com/';
  }

  if (details.url.includes('.migu.cn')) {
    referer_value = 'https://music.migu.cn/v3/music/player/audio?from=migu';
  }

  if (details.url.includes('m.music.migu.cn')) {
    referer_value = 'https://m.music.migu.cn/';
  }

  if (
    details.url.includes('app.c.nf.migu.cn') ||
    details.url.includes('d.musicapp.migu.cn')
  ) {
    ua_value = MOBILE_UA;
    add_origin = false;
    add_referer = false;
  }

  if (details.url.includes('jadeite.migu.cn')) {
    ua_value = 'okhttp/3.12.12';
    add_origin = false;
    add_referer = false;
  }

  if (origin_value === '') {
    origin_value = referer_value;
  }

  let isRefererSet = false;
  let isOriginSet = false;
  let isUASet = false;
  const headers = details.requestHeaders;
  const blockingResponse = {};

  for (let i = 0, l = headers.length; i < l; i += 1) {
    if (
      replace_referer &&
      headers[i].name === 'Referer' &&
      referer_value !== ''
    ) {
      headers[i].value = referer_value;
      isRefererSet = true;
    }
    if (replace_origin && headers[i].name === 'Origin' && origin_value !== '') {
      headers[i].value = origin_value;
      isOriginSet = true;
    }
    if (headers[i].name === 'User-Agent' && ua_value !== '') {
      headers[i].value = ua_value;
      isUASet = true;
    }
  }

  if (add_referer && !isRefererSet && referer_value !== '') {
    headers.push({
      name: 'Referer',
      value: referer_value,
    });
  }

  if (add_origin && !isOriginSet && origin_value !== '') {
    headers.push({
      name: 'Origin',
      value: origin_value,
    });
  }

  if (!isUASet && ua_value !== '') {
    headers.push({
      name: 'User-Agent',
      value: ua_value,
    });
  }

  blockingResponse.requestHeaders = headers;
  return blockingResponse;
}

const urls = [
  '*://*.music.163.com/*',
  '*://music.163.com/*',
  '*://*.xiami.com/*',
  '*://i.y.qq.com/*',
  '*://c.y.qq.com/*',
  '*://*.kugou.com/*',
  '*://*.kuwo.cn/*',
  '*://*.bilibili.com/*',
  '*://*.bilivideo.com/*',
  '*://*.migu.cn/*',
  '*://*.githubusercontent.com/*',
];

try {
  chrome.webRequest.onBeforeSendHeaders.addListener(
    hack_referer_header,
    {
      urls,
    },
    ['requestHeaders', 'blocking', 'extraHeaders']
  );
} catch (err) {
  // before chrome v72, extraHeader is not supported
  chrome.webRequest.onBeforeSendHeaders.addListener(
    hack_referer_header,
    {
      urls,
    },
    ['requestHeaders', 'blocking']
  );
}

/**
 * Get tokens.
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type !== 'code') {
    return;
  }

  GithubClient.github.handleCallback(request.code);
  sendResponse();
});
