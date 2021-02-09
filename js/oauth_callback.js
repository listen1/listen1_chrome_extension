/**
 * Get and send oauth tokens from query string.
 */

chrome.runtime.sendMessage(
  {
    type: 'code',
    query: window.location.search.substr(1),
  },
  // eslint-disable-next-line no-unused-vars
  (response) => {
    // window.open('', '_self', '');
    // window.close();
  }
);
