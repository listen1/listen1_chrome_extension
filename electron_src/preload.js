const { contextBridge, ipcRenderer, session, webFrame } = require('electron');
const Store = require('electron-store');
const store = new Store();
const ipcOn = (channel) => (fn) => {
  ipcRenderer.on(channel, (event, ...args) => fn(...args));
};
const setZoomLevel = (level) => {
  webFrame.setZoomLevel(level);
};
const setTheme = (theme) => {
  store.set('theme', theme);
};
const getCookie = (request) => ipcRenderer.invoke('getCookie', request);
const setCookie = (cookie) => ipcRenderer.invoke('setCookie', cookie);
contextBridge.exposeInMainWorld('api', {
  setZoomLevel,
  setTheme,
  getCookie,
  setCookie,
  ipcRenderer,
  session,
  platform: process.platform
});
