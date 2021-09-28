/* eslint-disable no-unused-vars */
/*
build a bridge between UI and audio player

audio player has 2 modes, but share same protocol: front and background.

* front: audio player and UI are in same environment
* background: audio player is in background page.

*/
import { threadPlayer, Player } from './player_thread';
function getFrontPlayer() {
  return threadPlayer;
}
/** @returns {Player}*/
function getBackgroundPlayer() {
  return chrome.extension.getBackgroundPage().threadPlayer;
}

function getBackgroundPlayerAsync(callback: (player: Player) => void) {
  chrome.runtime.getBackgroundPage((w) => {
    callback(w.threadPlayer);
  });
}

export function getPlayer(mode: Mode) {
  if (mode === 'front') {
    return getFrontPlayer();
  }
  if (mode === 'background') {
    return getBackgroundPlayer();
  }
  return undefined;
}

export function getPlayerAsync(mode: Mode, callback: (player: Player) => void) {
  if (mode === 'front') {
    const player = getFrontPlayer();
    return callback(player);
  }
  if (mode === 'background') {
    return getBackgroundPlayerAsync(callback);
  }
  return undefined;
}
var frontPlayerListener = [];
function addFrontPlayerListener(listener) {
  frontPlayerListener.push(listener);
}

function addBackgroundPlayerListener(listener) {
  return chrome.runtime.onMessage.addListener((msg, sender, res) => {
    if (!msg.type.startsWith('BG_PLAYER:')) {
      return null;
    }
    return listener(msg, sender, res);
  });
}

export function addPlayerListener(mode, listener) {
  if (mode === 'front') {
    return addFrontPlayerListener(listener);
  }
  if (mode === 'background') {
    return addBackgroundPlayerListener(listener);
  }
  return null;
}

function frontPlayerSendMessage(message) {
  if (frontPlayerListener !== [] && frontPlayerListener !== undefined) {
    frontPlayerListener.forEach((listener) => {
      listener(message);
    });
  }
}

function backgroundPlayerSendMessage(message) {
  chrome.runtime.sendMessage(message);
}

export function playerSendMessage(mode, message) {
  if (mode === 'front') {
    frontPlayerSendMessage(message);
  }
  if (mode === 'background') {
    backgroundPlayerSendMessage(message);
  }
}
