const { contextBridge, ipcRenderer, session, webFrame } = require('electron');

const store = require('./store');
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
  store.set('theme', theme);
};
const getCookie = (request) => ipcRenderer.invoke('getCookie', request);
const setCookie = (cookie) => ipcRenderer.send('setCookie', cookie);
const removeCookie = (url, name) => ipcRenderer.send('removeCookie', url, name);
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
  ipcOn,
  ipcOnce
});
