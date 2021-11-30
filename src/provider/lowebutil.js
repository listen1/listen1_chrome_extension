import parallel from 'async-es/parallel';
export function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&'); // eslint-disable-line no-useless-escape
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);

  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

export function isElectron() {
  return Boolean(window.api?.platform);
}
export function isMac() {
  return window.api?.platform === 'darwin';
}

export function cookieGet(cookieRequest, callback) {
  if (!isElectron()) {
    return chrome.cookies.get(cookieRequest, (cookie) => {
      callback(cookie);
    });
  }
  window.api.getCookie(cookieRequest).then((cookieArray) => {
    let cookie = null;
    if (cookieArray.length > 0) {
      [cookie] = cookieArray;
    }
    callback(cookie);
  });
}
export async function cookieGetPromise(cookieRequest) {
  return new Promise((res, rej) => {
    if (!isElectron()) {
      chrome.cookies.get(cookieRequest, (cookie) => {
        res(cookie);
      });
    } else {
      window.api.getCookie(cookieRequest).then((cookieArray) => {
        let cookie = null;
        if (cookieArray.length > 0) {
          [cookie] = cookieArray;
        }
        res(cookie);
      });
    }
  });
}

export function cookieSet(cookie, callback) {
  if (!isElectron()) {
    return chrome.cookies.set(cookie, (arg1, arg2) => {
      callback(arg1, arg2);
    });
  }
  window.api.setCookie(cookie);
  callback(null);
}
export function cookieSetPromise(cookie) {
  return new Promise(async (res, rej) => {
    if (!isElectron()) {
      return chrome.cookies.set(cookie, (arg1, arg2) => {
        res(arg1, arg2);
      });
    }
    await window.api.setCookie(cookie);
    res(null);
  });
}

export function cookieRemove(cookie, callback) {
  if (!isElectron()) {
    return chrome.cookies.remove(cookie, (arg1, arg2) => {
      callback(arg1, arg2);
    });
  }
  window.api.removeCookie(cookie.url, cookie.name);
  callback(null);
}

function easeInOutQuad(t, b, c, d) {
  // t = current time
  // b = start value
  // c = change in value
  // d = duration
  t /= d / 2;
  if (t < 1) return (c / 2) * t * t + b;
  t -= 1;
  return (-c / 2) * (t * (t - 2) - 1) + b;
}

export function smoothScrollTo(element, to, duration) {
  if (element == undefined || element === null) {
    return;
  }
  /* https://gist.github.com/andjosh/6764939 */
  const start = element.scrollTop;
  const change = to - start;
  let currentTime = 0;
  const increment = 20;

  const animateScroll = () => {
    currentTime += increment;
    const val = easeInOutQuad(currentTime, start, change, duration);
    element.scrollTop = val;
    if (currentTime < duration) {
      setTimeout(animateScroll, increment);
    }
  };
  animateScroll();
}

export function async_process(data_list, handler, handler_extra_param_list) {
  const fnDict = {};
  data_list.forEach((item, index) => {
    fnDict[index] = (cb) => handler(index, item, handler_extra_param_list, cb);
  });
  return new Promise((res, rej) => {
    parallel(fnDict, (err, results) => res(data_list.map((item, index) => results[index])));
  });
}
