
/**
 * Get and send oauth tokens from query string.
 */

chrome.runtime.sendMessage({type: 'code', query: window.location.search.substr(1)}, function(response) {
    // window.open('', '_self', '');
    // window.close();
});