const { app, Menu, Tray } = require('electron');
const { join } = require('path');

let appTray;
/**
 * @param {electron.BrowserWindow} mainWindow
 * @param {{ title: string; artist: string; }} [track]
 */
function initialTray(mainWindow, track) {
  track ||= {
    title: '暂无歌曲',
    artist: '  '
  };

  let nowPlayingTitle = `${track.title}`;
  let nowPlayingArtist = `歌手: ${track.artist}`;

  function toggleVisiable() {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  }
  const menuTemplate = [
    {
      label: nowPlayingTitle,
      click() {
        mainWindow.show();
      }
    },
    {
      label: nowPlayingArtist,
      click() {
        mainWindow.show();
      }
    },
    { type: 'separator' },
    {
      label: '播放/暂停',
      click() {
        mainWindow.webContents.send('globalShortcut', 'space');
      }
    },
    {
      label: '上一首',
      click() {
        mainWindow.webContents.send('globalShortcut', 'left');
      }
    },
    {
      label: '下一首',
      click() {
        mainWindow.webContents.send('globalShortcut', 'right');
      }
    },
    {
      label: '显示/隐藏窗口',
      click() {
        toggleVisiable();
      }
    },
    {
      label: '退出',
      click() {
        app.quit();
      }
    }
  ];
  const contextMenu = Menu.buildFromTemplate(menuTemplate);

  if (appTray?.destroy != undefined) {
    // appTray had create, just refresh tray menu here
    appTray?.setContextMenu(contextMenu);
    return;
  }

  let trayIconPath = '';
  //platform-specific
  switch (process.platform) {
    case 'darwin':
      trayIconPath = join(__dirname, '/resources/logo_16.png');

      break;
    case 'linux':
    case 'win32':
      trayIconPath = join(__dirname, '/resources/logo_32.png');
      // fix transparent window not working in linux bug
      app.disableHardwareAcceleration();
      break;
    default:
      break;
  }

  appTray = new Tray(trayIconPath);

  appTray.setContextMenu(contextMenu);
  appTray.on('click', () => {
    toggleVisiable();
  });
}
module.exports = { initialTray };
