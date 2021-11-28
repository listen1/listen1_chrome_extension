const electron = require('electron');
// import reloader from 'electron-reloader';
const { fixCORS } = require('./cors');
const isDev = require('./isDev');
const store = require('./store');
const { app, BrowserWindow, ipcMain, session, Menu } = electron;
// isDev && reloader(module);
if (isDev) {
  require('electron-reloader')(module);
}

const theme = store.get('theme');
/** @type {{ width: number; height: number; maximized: boolean; zoomLevel: number}} */
const windowState = store.get('windowState');
let titleStyle;
let titleBarStyle;
switch (theme) {
  case 'black':
    titleStyle = { color: '#333333', symbolColor: '#e5e5e5' };
    break;
  case 'white':
    titleStyle = { color: '#ffffff', symbolColor: '#3c3c3c' };
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
/** @type {electron.BrowserWindow}*/
let mainWindow;
let willQuitApp = false;

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
      preload: `${__dirname}/preload.js`,
      webSecurity: false
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
  mainWindow.on('ready-to-show', () => {
    mainWindow.webContents.setZoomLevel(windowState.zoomLevel);
    mainWindow.show();
  });
  const menu = Menu.buildFromTemplate([
    {
      label: 'Application',
      submenu: [
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+=',
          click() {
            if (windowState.zoomLevel <= 2.5) {
              windowState.zoomLevel += 0.5;
              mainWindow.webContents.setZoomLevel(windowState.zoomLevel);
            }
          }
        },
        {
          label: 'Zoom in',
          accelerator: 'CmdOrCtrl+-',
          click() {
            if (windowState.zoomLevel >= -1) {
              windowState.zoomLevel -= 0.5;
              mainWindow.webContents.setZoomLevel(windowState.zoomLevel);
            }
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'F12',
          click() {
            mainWindow.webContents.toggleDevTools();
          }
        },
        {
          label: 'About Application',
          selector: 'orderFrontStandardAboutPanel:'
        },
        { type: 'separator' },
        {
          label: 'Close Window',
          accelerator: 'CmdOrCtrl+W',
          click() {
            mainWindow.close();
          }
        },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click() {
            app.quit();
          }
        }
      ]
    }
  ]);
  mainWindow.setMenu(menu);
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

  mainWindow.on('close', (e) => {
    if (willQuitApp) {
      /* the user tried to quit the app */
      mainWindow = null;
    } else {
      /* the user only tried to close the window */
      //if (process.platform != 'linux') {
      e.preventDefault();
      mainWindow.hide();
      //mainWindow.minimize();
      //}
    }
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
  if (mainWindow.webContents.isDevToolsOpened()) {
    mainWindow.webContents.closeDevTools();
  }

  store.set('windowState', windowState);

  willQuitApp = true;
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
