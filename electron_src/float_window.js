const { BrowserWindow, screen } = require('electron');
const { safeGet } = require('./store');
const { join } = require('path');

/** @type {BrowserWindow} */
let floatingWindow;
let floatingWindowCssKey = undefined;
/**
 * @param {string} cssStyle
 */
function createFloatingWindow(cssStyle) {
  const display = screen.getPrimaryDisplay();
  if (process.platform === 'linux') {
    // fix transparent window not working in linux bug
    floatingWindow?.destroy();
    floatingWindow = null;
  }
  if (!floatingWindow) {
    /** @type {Electron.Rectangle} */
    const winBounds = safeGet('floatingWindowBounds');

    floatingWindow = new BrowserWindow({
      width: 1000,
      minWidth: 640,
      maxWidth: 1920,
      height: 100,
      // titleBarStyle: 'hidden',
      transparent: true,
      frame: false,
      resizable: true,
      hasShadow: false,
      alwaysOnTop: true,
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
        preload: join(__dirname, 'preload.js')
      },
      ...winBounds
    });

    if (winBounds === undefined) {
      floatingWindow.setPosition(floatingWindow.getPosition()[0], display.bounds.height - 150);
    }
    floatingWindow.setVisibleOnAllWorkspaces(true);
    floatingWindow.setSkipTaskbar(true);
    floatingWindow.loadURL(`file://${__dirname}/floatingWindow.html`);
    floatingWindow.setAlwaysOnTop(true, 'floating');
    floatingWindow.setIgnoreMouseEvents(false);
    // NOTICE: setResizable should be set, otherwise mouseleave event won't trigger in windows environment
    floatingWindow.webContents.on('did-finish-load', async () => {
      await updateFloatingWindow(cssStyle);
    });
    floatingWindow.on('closed', () => {
      floatingWindow = null;
    });

    // floatingWindow.webContents.openDevTools();
  }
  floatingWindow.showInactive();
}

/**
 * @param {string} cssStyle
 */
async function updateFloatingWindow(cssStyle) {
  if (cssStyle === undefined) {
    return;
  }
  try {
    const newCssKey = await floatingWindow.webContents.insertCSS(cssStyle, {
      cssOrigin: 'author'
    });
    if (floatingWindowCssKey !== undefined) {
      await floatingWindow.webContents.removeInsertedCSS(floatingWindowCssKey);
    }
    floatingWindowCssKey = newCssKey;
  } catch (err) {
    console.log(err);
  }
}
const getFloatingWindow = () => {
  return floatingWindow;
};

module.exports = {
  getFloatingWindow,
  createFloatingWindow,
  updateFloatingWindow
};
