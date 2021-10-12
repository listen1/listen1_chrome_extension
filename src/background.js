/* eslint-disable no-unused-vars */
/* global GithubClient */
import HeaderRules from '../headerRules.json';

chrome.browserAction.onClicked.addListener((tab) => {
  chrome.tabs.create(
    {
      url: chrome.extension.getURL('index.html')
    },
    (new_tab) => {
      // Tab opened.
    }
  );
});

function hack_referer_header(details) {
  const { url } = details;
  const modHeaders = {};

  HeaderRules.forEach((rule) => {
    if (rule.pattern.some((p) => url.includes(p)))
      Object.assign(modHeaders, rule.headers);
  })

  if (!modHeaders.Origin && modHeaders.Referer) {
    modHeaders.Origin = modHeaders.Referer;
  }

  const headers = details.requestHeaders;
  const blockingResponse = {};

  headers.forEach(header => {
    if (modHeaders[header.name]) {
      headers.value = modHeaders[header.name];
      delete modHeaders[header.name];
    }
  });

  Object.keys(modHeaders).forEach((header) => {
    headers.push({
      name: header,
      value: modHeaders[header],
    });
  })


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
  '*://*.githubusercontent.com/*'
];

try {
  chrome.webRequest.onBeforeSendHeaders.addListener(
    hack_referer_header,
    {
      urls
    },
    ['requestHeaders', 'blocking', 'extraHeaders']
  );
} catch (err) {
  // before chrome v72, extraHeader is not supported
  chrome.webRequest.onBeforeSendHeaders.addListener(
    hack_referer_header,
    {
      urls
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

// at end of background.js
