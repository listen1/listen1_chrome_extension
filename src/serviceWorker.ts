chrome.action.onClicked.addListener(() => {
  const url = chrome.runtime.getURL('index.html');
  chrome.tabs.query({ url }, (tabs) => {
    if (tabs.length === 0) {
      chrome.tabs.create({ url });
    } else {
      chrome.tabs.update(tabs[0].id || 0, { active: true });
    }
  });
});

const OAUTH_URL = 'https://github.com/login/oauth';
const API_URL = 'https://api.github.com';

const client_id = 'e099a4803bb1e2e773a3';
const client_secret = '81fbfc45c65af8c0fbf2b4dae6f23f22e656cfb8';
/**
 * Get tokens.
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!request.code) {
    return;
  }
  const url = `${OAUTH_URL}/access_token`;
  const params = {
    client_id,
    client_secret,
    code: request.code
  };
  const searchParams = new URLSearchParams(params);
  fetch(url, { method: 'POST', body: searchParams, headers: { accept: 'application/json' } })
    .then((data) => data.json())
    .then((res) => {
      const ak = (res as any)?.access_token;
      sendResponse(ak);
    });
});
