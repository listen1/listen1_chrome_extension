/* eslint-disable @typescript-eslint/no-var-requires */
const { contextBridge, ipcRenderer, session, webFrame } = require('electron');
const ipcOn = (channel) => (fn) => {
  ipcRenderer.on(channel, (event, ...args) => fn(...args));
};
const ipcOnce = (channel) => (fn) => {
  ipcRenderer.once(channel, (event, ...args) => fn(...args));
};
const setZoomLevel = (level) => {
  webFrame.setZoomLevel(level);
};
try {
  const { safeGet } = require('./store');
  setZoomLevel(safeGet('windowState').zoomLevel);
} catch (error) {
  // ignore on error
}
const getCookie = (request) => ipcRenderer.invoke('getCookie', request);
const setCookie = (cookie) => ipcRenderer.send('setCookie', cookie);
const removeCookie = (url, name) => ipcRenderer.send('removeCookie', url, name);
const updateTheme = ({ color, symbolColor }) => ipcRenderer.send('updateTheme', { color, symbolColor });
const sendControl = (args, params) => ipcRenderer.send('control', args, params);
const sendLyric = (args, params) => ipcRenderer.send('currentLyric', args, params);
const sendTrackPlayingNow = (args, params) => ipcRenderer.send('trackPlayingNow', args, params);
const sendFloatWindowMoving = (args, params) => ipcRenderer.send('floatWindowMoving', args, params);
const readTag = (fp)=> ipcRenderer.invoke("readTag", fp)
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
  getCookie,
  setCookie,
  removeCookie,
  updateTheme,
  session,
  ipcRenderer,
  platform: process.platform,
  readTag,
  onLyric,
  onTranslLyric,
  onLyricWindow,
  sendControl,
  sendLyric,
  sendTrackPlayingNow,
  sendFloatWindowMoving,
  ipcOn,
  ipcOnce
});
