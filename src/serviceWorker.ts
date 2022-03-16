import GithubClient from './services/GithubWorker';
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

/**
 * Get tokens.
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!request.code) {
    return;
  }
  GithubClient.github.handleCallback(request.code);
  sendResponse();
});
