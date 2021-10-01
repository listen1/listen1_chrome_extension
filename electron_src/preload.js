const { contextBridge, ipcRenderer, BrowserWindow, session, webFrame } = require('electron');
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
contextBridge.exposeInMainWorld('api', {
  setZoomLevel,
  setTheme,
  platform: process.platform,
  isElectron: true
});
