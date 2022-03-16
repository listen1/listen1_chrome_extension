chrome.action.onClicked.addListener(() => {
  const url = chrome.runtime.getURL('index.html');
  chrome.tabs.query({ url }).then((tabs) => {
    if (tabs.length === 0) {
      chrome.tabs.create({ url });
    } else {
      chrome.tabs.update(tabs[0].id || 0, { active: true });
    }
  });
});
