/**
 * Get and send oauth tokens from query string.
 */

chrome.runtime.sendMessage(
  {
    type: 'code',
    code: (new URLSearchParams(window.location.search)).get('code'),
  },
  // eslint-disable-next-line no-unused-vars
  (response) => {
    // window.open('', '_self', '');
    // window.close();
  }
);
