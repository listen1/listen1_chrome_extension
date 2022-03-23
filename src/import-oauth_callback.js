/**
 * Get and send oauth tokens from query string.
 */

chrome.runtime.sendMessage(
  {
    type: 'code',
    code: new URLSearchParams(window.location.search).get('code')
  },
  (response) => {
    // window.open('', '_self', '');
    // window.close();
  }
);
