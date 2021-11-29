/* eslint-disable @typescript-eslint/no-var-requires */
const { app, BrowserWindow, ipcMain, session, Menu, dialog, screen, Tray } = require('electron');
// import reloader from 'electron-reloader';
const { fixCORS } = require('./cors');
const isDev = require('./isDev');
const store = require('./store');
const { readAudioTags } = require('./readtag');
const { initialTray } = require('./tray');
// isDev && reloader(module);
if (isDev) {
  require('electron-reloader')(module);
}
const { getFloatingWindow, createFloatingWindow, updateFloatingWindow } = require('./float_window');

const theme = store.safeGet('theme');
/** @type {{ width: number; height: number; maximized: boolean; zoomLevel: number}} */
const windowState = store.safeGet('windowState');
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
  initialTray(mainWindow);
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

ipcMain.on('currentLyric', (event, arg) => {
  const floatingWindow = getFloatingWindow();
  if (floatingWindow && floatingWindow !== null) {
    floatingWindow.webContents.send('currentLyric', arg.lyric);
    floatingWindow.webContents.send('currentLyricTrans', arg.tlyric);
  }
});

ipcMain.on('control', async (event, arg, params) => {
  const floatingWindow = getFloatingWindow();
  switch (arg) {
    case 'enable_lyric_floating_window':
      createFloatingWindow(params);
      break;

    case 'disable_lyric_floating_window':
      floatingWindow?.hide();
      break;

    case 'float_window_accept_mouse_event':
      floatingWindow.setIgnoreMouseEvents(false);
      break;

    case 'float_window_ignore_mouse_event':
      floatingWindow.setIgnoreMouseEvents(true, { forward: true });
      break;

    case 'float_window_close':
    case 'float_window_font_small':
    case 'float_window_font_large':
    case 'float_window_background_light':
    case 'float_window_background_dark':
    case 'float_window_font_change_color':
      // sync float window settings
      mainWindow.webContents.send('lyricWindow', arg);
      break;

    case 'update_lyric_floating_window_css':
      await updateFloatingWindow(params);
      break;

    case 'window_min':
      mainWindow.minimize();
      break;

    case 'window_max':
      windowState.maximized ? mainWindow.unmaximize() : mainWindow.maximize();
      windowState.maximized = !windowState.maximized;
      break;

    case 'window_close':
      mainWindow.close();
      break;
    default:
      break;
  }
});

ipcMain.on('floatWindowMoving', (e, { mouseX, mouseY }) => {
  const floatingWindow = getFloatingWindow();

  const { x, y } = screen.getCursorScreenPoint();
  floatingWindow?.setPosition(x - mouseX, y - mouseY);
});

ipcMain.on('chooseLocalFile', async (event, listId) => {
  const result = await dialog.showOpenDialog({
    title: '添加歌曲',
    properties: ['openFile', 'multiSelections'],
    filters: [
      {
        name: 'Music Files',
        extensions: ['mp3', 'flac', 'ape']
      }
    ]
  });

  if (result.canceled) {
    return;
  }
  const tracks = [];
  for (let i = 0; i < result.filePaths.length; i++) {
    const fp = result.filePaths[i];
    const md = await readAudioTags(fp);
    const imgBase64 = md.common.picture?.[0]?.data?.toString('base64');
    const track = {
      id: `lmtrack_${fp}`,
      title: md.common.title,
      artist: md.common.artist,
      artist_id: `lmartist_${md.common.artist}`,
      album: md.common.album,
      album_id: `lmalbum_${md.common.album}`,
      source: 'localmusic',
      source_url: '',
      img_url: imgBase64 ? `data:${md.common.picture?.[0].format}; base64, ${imgBase64}` : 'images/mycover.jpg',
      lyrics: md.common.lyrics,
      // url: "lmtrack_"+fp,
      sound_url: `file://${fp}`
    };
    tracks.push(track);
  }

  mainWindow.webContents.send('chooseLocalFile', { tracks, id: listId });
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
  else {
    mainWindow.show();
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
