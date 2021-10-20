const electron = require('electron');
// import reloader from 'electron-reloader';
const { fixCORS } = require('./cors');
const isDev = require('./isDev');
const Store = require('electron-store');
const { app, BrowserWindow, ipcMain, session } = electron;
// isDev && reloader(module);
if (isDev) {
  require('electron-reloader')(module);
}
const store = new Store();
const theme = store.get('theme');
/** @type {{ width: number; height: number; maximized: boolean; zoomLevel: number}} */
const windowState = store.get('windowState') || {
  width: 1000,
  height: 670,
  maximized: false,
  zoomLevel: 0
};
let titleStyle;
let titleBarStyle;
switch (theme) {
  case 'black':
    titleStyle = { color: '#333333', symbolColor: '#e5e5e5' };
    break;
  case 'white':
    titleStyle = { color: '#ffffff', symbolColor: '#3c3c3c' };
    break;
  default:
    store.set('theme', 'black');
    titleStyle = { color: '#333333', symbolColor: '#e5e5e5' };
    break;
}
//platform specific
switch (process.platform) {
  case 'darwin':
    titleBarStyle = 'hiddenInset';
    break;
  case 'win32':
    titleBarStyle = 'hidden';
    break;
  case 'linux':
    titleBarStyle = 'hidden';
    break;
  default:
    break;
}
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
/** @type {BrowserWindow}*/
let mainWindow;

function createWindow() {
  fixCORS();
  const transparent = false;
  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    show: false,
    minHeight: 300,
    minWidth: 600,
    webPreferences: {
      contextIsolation: true,
      preload: `${__dirname}/preload.js`
    },
    //icon: iconPath,
    titleBarStyle,
    titleBarOverlay: titleStyle,
    transparent: transparent,
    vibrancy: 'light',
    frame: false,
    hasShadow: true
  });
  if (windowState.maximized) {
    mainWindow.maximize();
  }
  mainWindow.show();
  // and load the index.html of the app.
  const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.119 Safari/537.36';

  mainWindow.loadURL(`file://${__dirname}/dist/index.html`, { userAgent: ua });
  mainWindow.on('resized', () => {
    if (!mainWindow.isMaximized() && !mainWindow.isFullScreen()) {
      const [width, height] = mainWindow.getSize();
      windowState.width = width;
      windowState.height = height;
    }
  });
  mainWindow.on('maximize', () => {
    windowState.maximized = true;
  });
  mainWindow.on('unmaximize', () => {
    windowState.maximized = false;
  });
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

ipcMain.on('setCookie', async (e, cookie) => {
  await session.defaultSession.cookies.set(cookie);
});

ipcMain.handle('getCookie', async (e, request) => {
  return session.defaultSession.cookies.get(request);
});

ipcMain.on('removeCookie', async (e, url, name) => {
  await session.defaultSession.cookies.remove(url, name);
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});
app.on('before-quit', () => {
  store.set('windowState', windowState);
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
