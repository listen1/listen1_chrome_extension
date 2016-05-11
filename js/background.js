chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.create({'url': chrome.extension.getURL('listen1.html')}, function(tab) {
    // Tab opened.
  });
});


function hack_referer_header(details) {
    var referer_value = '';
    if (details.url.indexOf("://music.163.com/") != -1) {
        referer_value = "http://music.163.com/";
    }

    if (details.url.indexOf(".xiami.com/") != -1) {
        referer_value = "http://m.xiami.com/";
    }

    if ((details.url.indexOf("y.qq.com/") != -1) || 
        (details.url.indexOf("qqmusic.qq.com/") != -1) ||
        (details.url.indexOf("music.qq.com/") != -1) ||
        (details.url.indexOf("imgcache.qq.com/") != -1)) {
        referer_value = "http://y.qq.com/";
    }

    var isRefererSet = false;
    var headers = details.requestHeaders,
        blockingResponse = {};

    for (var i = 0, l = headers.length; i < l; ++i) {
        if ((headers[i].name == 'Referer') && (referer_value != '')) {
            headers[i].value = referer_value;
            isRefererSet = true;
            break;
        }
    }

    if ((!isRefererSet) && (referer_value != '')) {
        headers.push({
            name: "Referer",
            value: referer_value
        });
    }

    blockingResponse.requestHeaders = headers;
    return blockingResponse;
};

chrome.webRequest.onBeforeSendHeaders.addListener(hack_referer_header, {
    urls: ["*://music.163.com/*", "*://*.xiami.com/*", "*://*.qq.com/*"]
}, ['requestHeaders', 'blocking']);