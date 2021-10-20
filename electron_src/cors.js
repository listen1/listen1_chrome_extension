const { session } = require('electron');

/**
 * @param {electron.OnBeforeSendHeadersListenerDetails} details
 */
function hack_referer_header(details) {
  let replace_referer = true;
  let replace_origin = true;
  let add_referer = true;
  let add_origin = true;
  let referer_value = '';
  let origin_value = '';

  if (details.url.includes('://music.163.com/')) {
    referer_value = 'http://music.163.com/';
  }
  if (details.url.includes('://interface3.music.163.com/')) {
    referer_value = 'http://music.163.com/';
  }
  if (details.url.includes('://gist.githubusercontent.com/')) {
    referer_value = 'https://gist.githubusercontent.com/';
  }

  if (details.url.includes('.xiami.com/')) {
    add_origin = false;
    referer_value = 'https://www.xiami.com/';
  }
  if (details.url.includes('www.xiami.com/api/search/searchSongs')) {
    const key = /key%22:%22(.*?)%22/.exec(details.url)[1];
    add_origin = false;
    referer_value = `https://www.xiami.com/search?key=${key}`;
  }
  if (details.url.includes('c.y.qq.com/')) {
    referer_value = 'https://y.qq.com/';
    origin_value = 'https://y.qq.com';
  }
  if (
    details.url.includes('y.qq.com/') ||
    details.url.includes('qqmusic.qq.com/') ||
    details.url.includes('music.qq.com/') ||
    details.url.includes('imgcache.qq.com/')
  ) {
    referer_value = 'http://y.qq.com/';
  }
  if (details.url.includes('.kugou.com/')) {
    referer_value = 'http://www.kugou.com/';
  }
  if (details.url.includes('.kuwo.cn/')) {
    referer_value = 'http://www.kuwo.cn/';
  }
  if (details.url.includes('.bilibili.com/') || details.url.includes('.bilivideo.com/')) {
    referer_value = 'https://www.bilibili.com/';
    replace_origin = false;
    add_origin = false;
  }
  if (details.url.includes('.migu.cn')) {
    referer_value = 'http://music.migu.cn/v3/music/player/audio?from=migu';
  }
  if (details.url.includes('m.music.migu.cn')) {
    referer_value = 'https://m.music.migu.cn/';
  }
  if (origin_value == '') {
    origin_value = referer_value;
  }
  let isRefererSet = false;
  let isOriginSet = false;
  let headers = details.requestHeaders;

  for (let i = 0, l = headers.length; i < l; ++i) {
    if (replace_referer && headers[i].name == 'Referer' && referer_value != '') {
      headers[i].value = referer_value;
      isRefererSet = true;
    }
    if (replace_origin && headers[i].name == 'Origin' && referer_value != '') {
      headers[i].value = origin_value;
      isOriginSet = true;
    }
  }

  if (add_referer && !isRefererSet && referer_value != '') {
    headers['Referer'] = referer_value;
  }

  if (add_origin && !isOriginSet && referer_value != '') {
    headers['Origin'] = origin_value;
  }

  details.requestHeaders = headers;
}

function fixCORS() {
  const filter = {
    urls: [
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
      'https://listen1.github.io/listen1/callback.html?code=*'
    ]
  };

  session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    if (details.url.startsWith('https://listen1.github.io/listen1/callback.html?code=')) {
      const { url } = details;
      const code = url.split('=')[1];
      mainWindow.webContents.executeJavaScript('GithubClient.github.handleCallback("' + code + '");');
    } else {
      hack_referer_header(details);
    }
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });
}
module.exports = { fixCORS, hack_referer_header };
