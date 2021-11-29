/* eslint-disable @typescript-eslint/no-var-requires */
const { contextBridge, ipcRenderer, session, webFrame } = require('electron');
// TODO: import store will throw exception
// const store = require('./store');
const ipcOn = (channel) => (fn) => {
  ipcRenderer.on(channel, (event, ...args) => fn(...args));
};
const ipcOnce = (channel) => (fn) => {
  ipcRenderer.once(channel, (event, ...args) => fn(...args));
};
const setZoomLevel = (level) => {
  webFrame.setZoomLevel(level);
};
const setTheme = (theme) => {
  // store.set('theme', theme);
};
const getCookie = (request) => ipcRenderer.invoke('getCookie', request);
const setCookie = (cookie) => ipcRenderer.send('setCookie', cookie);
const removeCookie = (url, name) => ipcRenderer.send('removeCookie', url, name);

const sendControl = (args, params) => ipcRenderer.send('control', args, params);
const sendLyric = (args, params) => ipcRenderer.send('currentLyric', args, params);
const sendFloatWindowMoving = (args, params) => ipcRenderer.send('floatWindowMoving', args, params);
const onLyric = (fn) => {
  ipcRenderer.on('currentLyric', (event, ...args) => fn(...args));
};
const onTranslLyric = (fn) => {
  ipcRenderer.on('currentLyricTrans', (event, ...args) => fn(...args));
};

const onLyricWindow = (fn) => {
  ipcRenderer.on('lyricWindow', (event, ...args) => fn(...args));
};

const chooseLocalFile = (listId) => ipcRenderer.send('chooseLocalFile', listId);

contextBridge.exposeInMainWorld('api', {
  chooseLocalFile,
  setZoomLevel,
  setTheme,
  getCookie,
  setCookie,
  removeCookie,
  session,
  ipcRenderer,
  platform: process.platform,
  onLyric,
  onTranslLyric,
  onLyricWindow,
  sendControl,
  sendLyric,
  sendFloatWindowMoving,
  ipcOn,
  ipcOnce
});
