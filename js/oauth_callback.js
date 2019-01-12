/* global chrome window */
/**
 * Get and send oauth tokens from query string.
 */

chrome.runtime.sendMessage({
  type: 'code',
  query: window.location.search.substr(1),
}, (response) => { // eslint-disable-line no-unused-vars
  // window.open('', '_self', '');
  // window.close();
});
