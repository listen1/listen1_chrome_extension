/* eslint-disable no-unused-vars */
/*
build a bridge between UI and audio player

audio player has 2 modes, but share same protocol: front and background.

* front: audio player and UI are in same environment
* background: audio player is in background page.

*/

function getFrontPlayer() {
  return undefined;
}

function getBackgroundPlayer() {
  return chrome.extension.getBackgroundPage().threadPlayer;
}

function getBackgroundPlayerAsync(callback) {
  (chrome || browser).runtime.getBackgroundPage((w) => {
    callback(w.threadPlayer);
  });
}

function getPlayer(mode) {
  if (mode === 'front') {
    return getFrontPlayer();
  }
  if (mode === 'background') {
    return getBackgroundPlayer();
  }
  return undefined;
}

function getPlayerAsync(mode, callback) {
  if (mode === 'front') {
    const player = getFrontPlayer();
    return callback(player);
  }
  if (mode === 'background') {
    return getBackgroundPlayerAsync(callback);
  }
  return undefined;
}

function addFrontPlayerListener(listener) {

}

function addBackgroundPlayerListener(listener) {
  return (chrome || browser).runtime.onMessage.addListener((msg, sender, res) => {
    if (!msg.type.startsWith('BG_PLAYER:')) {
      return null;
    }
    return listener(msg, sender, res);
  });
}

function addPlayerListener(mode, listener) {
  if (mode === 'front') {
    return addFrontPlayerListener(listener);
  }
  if (mode === 'background') {
    return addBackgroundPlayerListener(listener);
  }
  return null;
}

function frontPlayerSendMessage(message) {

}

function backgroundPlayerSendMessage(message) {
  (chrome || browser).runtime.sendMessage(message);
}

function playerSendMessage(mode, message) {
  if (mode === 'front') {
    frontPlayerSendMessage(message);
  }
  if (mode === 'background') {
    backgroundPlayerSendMessage(message);
  }
}
