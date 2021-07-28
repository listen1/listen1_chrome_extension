/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */
/* eslint-disable import/no-unresolved */
/* eslint-disable global-require */
/* global angular notyf i18next MediaService l1Player hotkeys GithubClient isElectron require getLocalStorageValue getPlayer getPlayerAsync addPlayerListener smoothScrollTo lastfm */

function getCSSStringFromSetting(setting) {
  let { backgroundAlpha } = setting;
  if (backgroundAlpha === 0) {
    // NOTE: background alpha 0 results total transparent
    // which will cause mouse leave event not trigger
    // correct in windows platform for lyic window if disable
    // hardware accelerate
    backgroundAlpha = 0.01;
  }
  return `div.content.lyric-content{
      font-size: ${setting.fontSize}px;
      color: ${setting.color};
      background: rgba(36, 36, 36, ${backgroundAlpha});
    }
    div.content.lyric-content span.contentTrans {
      font-size: ${setting.fontSize - 4}px;
    }
    `;
}

angular.module('listenone').controller('PlayController', [
  '$scope',
  '$timeout',
  '$log',
  '$anchorScroll',
  '$location',
  '$rootScope',
  ($scope, $timeout, $log, $anchorScroll, $location, $rootScope) => {
    $scope.menuHidden = true;
    $scope.volume = l1Player.status.volume;
    $scope.mute = l1Player.status.muted;
    $scope.settings = {
      playmode: 0,
      nowplaying_track_id: -1,
    };
    $scope.lyricArray = [];
    $scope.lyricLineNumber = -1;
    $scope.lastTrackId = null;

    $scope.enableGloablShortcut = false;
    $scope.isChrome = !isElectron();
    $scope.isMac = false;

    $scope.currentDuration = '0:00';
    $scope.currentPosition = '0:00';

    if (!$scope.isChrome) {
      // eslint-disable-next-line no-undef
      $scope.isMac = process.platform === 'darwin';
    }

    function switchMode(mode) {
      // playmode 0:loop 1:shuffle 2:repeat one
      switch (mode) {
        case 0:
          l1Player.setLoopMode('all');
          break;
        case 1:
          l1Player.setLoopMode('shuffle');
          break;
        case 2:
          l1Player.setLoopMode('one');
          break;
        default:
      }
    }

    $scope.loadLocalSettings = () => {
      const defaultSettings = {
        playmode: 0,
        nowplaying_track_id: -1,
        volume: 90,
      };
      const localSettings = localStorage.getObject('player-settings');
      if (localSettings === null) {
        $scope.settings = defaultSettings;
        $scope.saveLocalSettings();
      } else {
        $scope.settings = localSettings;
      }
      // apply settings
      switchMode($scope.settings.playmode);

      $scope.volume = $scope.settings.volume;
      if ($scope.volume === null) {
        $scope.volume = 90;
        $scope.saveLocalSettings();
      } else {
        l1Player.setVolume($scope.volume);
      }
      $scope.enableGlobalShortCut = localStorage.getObject(
        'enable_global_shortcut'
      );
      $scope.enableLyricFloatingWindow = localStorage.getObject(
        'enable_lyric_floating_window'
      );
      $scope.enableLyricTranslation = localStorage.getObject(
        'enable_lyric_translation'
      );
      $scope.enableLyricFloatingWindowTranslation = localStorage.getObject(
        'enable_lyric_floating_window_translation'
      );
      $scope.enableAutoChooseSource = getLocalStorageValue(
        'enable_auto_choose_source',
        true
      );
      $scope.autoChooseSourceList = getLocalStorageValue(
        'auto_choose_source_list',
        ['kuwo', 'qq', 'migu']
      );
      $scope.enableStopWhenClose =
        isElectron() || getLocalStorageValue('enable_stop_when_close', true);
      $scope.enableNowplayingCoverBackground = getLocalStorageValue(
        'enable_nowplaying_cover_background',
        false
      );
      $scope.enableNowplayingBitrate = getLocalStorageValue(
        'enable_nowplaying_bitrate',
        false
      );
      $scope.enableNowplayingPlatform = getLocalStorageValue(
        'enable_nowplaying_platform',
        false
      );

      const defaultFloatWindowSetting = {
        fontSize: 20,
        color: '#ffffff',
        backgroundAlpha: 0.2,
      };

      $scope.floatWindowSetting = getLocalStorageValue(
        'float_window_setting',
        defaultFloatWindowSetting
      );

      $scope.applyGlobalShortcut();
      $scope.openLyricFloatingWindow();
    };

    // electron global shortcuts
    $scope.applyGlobalShortcut = (toggle) => {
      if (!isElectron()) {
        return;
      }
      let message = '';
      if (toggle === true) {
        $scope.enableGlobalShortCut = !$scope.enableGlobalShortCut;
      }
      if ($scope.enableGlobalShortCut === true) {
        message = 'enable_global_shortcut';
      } else {
        message = 'disable_global_shortcut';
      }

      // check if globalShortcuts is allowed
      localStorage.setObject(
        'enable_global_shortcut',
        $scope.enableGlobalShortCut
      );

      const { ipcRenderer } = require('electron');
      ipcRenderer.send('control', message);
    };

    $scope.openLyricFloatingWindow = (toggle) => {
      if (!isElectron()) {
        return;
      }
      let message = '';
      if (toggle === true) {
        $scope.enableLyricFloatingWindow = !$scope.enableLyricFloatingWindow;
      }
      if ($scope.enableLyricFloatingWindow === true) {
        message = 'enable_lyric_floating_window';
      } else {
        message = 'disable_lyric_floating_window';
      }
      localStorage.setObject(
        'enable_lyric_floating_window',
        $scope.enableLyricFloatingWindow
      );
      const { ipcRenderer } = require('electron');
      ipcRenderer.send(
        'control',
        message,
        getCSSStringFromSetting($scope.floatWindowSetting)
      );
    };

    if (isElectron()) {
      const { webFrame, ipcRenderer } = require('electron');
      // webFrame.setVisualZoomLevelLimits(1, 3);
      ipcRenderer.on('setZoomLevel', (event, level) => {
        webFrame.setZoomLevel(level);
      });
      ipcRenderer.on('lyricWindow', (event, arg) => {
        if (arg === 'float_window_close') {
          $scope.openLyricFloatingWindow(true);
        } else if (
          arg === 'float_window_font_small' ||
          arg === 'float_window_font_large'
        ) {
          const MIN_FONT_SIZE = 12;
          const MAX_FONT_SIZE = 50;
          const offset = arg === 'float_window_font_small' ? -1 : 1;
          $scope.floatWindowSetting.fontSize += offset;
          if ($scope.floatWindowSetting.fontSize < MIN_FONT_SIZE) {
            $scope.floatWindowSetting.fontSize = MIN_FONT_SIZE;
          } else if ($scope.floatWindowSetting.fontSize > MAX_FONT_SIZE) {
            $scope.floatWindowSetting.fontSize = MAX_FONT_SIZE;
          }
        } else if (
          arg === 'float_window_background_light' ||
          arg === 'float_window_background_dark'
        ) {
          const MIN_BACKGROUND_ALPHA = 0;
          const MAX_BACKGROUND_ALPHA = 1;
          const offset = arg === 'float_window_background_light' ? -0.1 : 0.1;
          $scope.floatWindowSetting.backgroundAlpha += offset;
          if (
            $scope.floatWindowSetting.backgroundAlpha < MIN_BACKGROUND_ALPHA
          ) {
            $scope.floatWindowSetting.backgroundAlpha = MIN_BACKGROUND_ALPHA;
          } else if (
            $scope.floatWindowSetting.backgroundAlpha > MAX_BACKGROUND_ALPHA
          ) {
            $scope.floatWindowSetting.backgroundAlpha = MAX_BACKGROUND_ALPHA;
          }
        } else if (arg === 'float_window_font_change_color') {
          const floatWindowlyricColors = [
            '#ffffff',
            '#65d29f',
            '#3c87eb',
            '#ec63af',
            '#4f5455',
            '#eb605b',
          ];
          const currentIndex = floatWindowlyricColors.indexOf(
            $scope.floatWindowSetting.color
          );
          const nextIndex = (currentIndex + 1) % floatWindowlyricColors.length;
          $scope.floatWindowSetting.color = floatWindowlyricColors[nextIndex];
        }
        localStorage.setObject(
          'float_window_setting',
          $scope.floatWindowSetting
        );
        const { ipcRenderer } = require('electron');
        const message = 'update_lyric_floating_window_css';
        ipcRenderer.send(
          'control',
          message,
          getCSSStringFromSetting($scope.floatWindowSetting)
        );
      });
    }

    $scope.saveLocalSettings = () => {
      localStorage.setObject('player-settings', $scope.settings);
    };

    $scope.changePlaymode = () => {
      const playmodeCount = 3;
      $scope.settings.playmode = ($scope.settings.playmode + 1) % playmodeCount;
      switchMode($scope.settings.playmode);
      $scope.saveLocalSettings();
    };

    $rootScope.openGithubAuth = GithubClient.github.openAuthUrl;
    $rootScope.GithubLogout = () => {
      GithubClient.github.logout();
      $scope.$evalAsync(() => {
        $scope.githubStatus = 0;
        $scope.githubStatusText = GithubClient.github.getStatusText();
      });
    };
    $rootScope.updateGithubStatus = () => {
      GithubClient.github.updateStatus((data) => {
        $scope.$evalAsync(() => {
          $scope.githubStatus = data;
          $scope.githubStatusText = GithubClient.github.getStatusText();
        });
      });
    };

    $scope.togglePlaylist = () => {
      const anchor = `song${l1Player.status.playing.id}`;
      $scope.menuHidden = !$scope.menuHidden;
      if (!$scope.menuHidden) {
        $anchorScroll(anchor);
      }
    };

    $scope.toggleMuteStatus = () => {
      // mute function is indeed toggle mute status.
      l1Player.toggleMute();
    };

    $scope.myProgress = 0;
    $scope.changingProgress = false;

    $scope.copyrightNotice = () => {
      notyf.info(i18next.t('_COPYRIGHT_ISSUE'), true);
    };
    $scope.failAllNotice = () => {
      notyf.warning(i18next.t('_FAIL_ALL_NOTICE'), true);
    };
    $rootScope.$on('track:myprogress', (event, data) => {
      $scope.$evalAsync(() => {
        // should use apply to force refresh ui
        $scope.myProgress = data;
      });
    });

    function parseLyric(lyric, tlyric) {
      const lines = lyric.split('\n');
      let result = [];
      const timeResult = [];

      if (typeof tlyric !== 'string') {
        tlyric = '';
      }
      const linesTrans = tlyric.split('\n');
      const resultTrans = [];
      const timeResultTrans = [];
      if (tlyric === '') {
        linesTrans.splice(0);
      }

      function rightPadding(str, length, padChar) {
        const newstr = str + new Array(length - str.length + 1).join(padChar);
        return newstr;
      }

      const process =
        (result, timeResult, translationFlag) => (line, index) => {
          const tagReg = /\[\D*:([^\]]+)\]/g;
          const tagRegResult = tagReg.exec(line);
          if (tagRegResult) {
            const lyricObject = {};
            lyricObject.seconds = 0;
            [lyricObject.content] = tagRegResult;
            result.push(lyricObject);
            return;
          }

          const timeReg = /\[(\d{2,})\:(\d{2})(?:\.(\d{1,3}))?\]/g; // eslint-disable-line no-useless-escape

          let timeRegResult = null;
          // eslint-disable-next-line no-cond-assign
          while ((timeRegResult = timeReg.exec(line)) !== null) {
            const htmlUnescapes = {
              '&amp;': '&',
              '&lt;': '<',
              '&gt;': '>',
              '&quot;': '"',
              '&#39;': "'",
              '&apos;': "'",
            };
            timeResult.push({
              content: line
                .replace(timeRegResult[0], '')
                .replace(
                  /&(?:amp|lt|gt|quot|#39|apos);/g,
                  (match) => htmlUnescapes[match]
                ),
              seconds:
                parseInt(timeRegResult[1], 10) * 60 * 1000 + // min
                parseInt(timeRegResult[2], 10) * 1000 + // sec
                (timeRegResult[3]
                  ? parseInt(rightPadding(timeRegResult[3], 3, '0'), 10)
                  : 0), // microsec
              translationFlag,
              index,
            });
          }
        };

      lines.forEach(process(result, timeResult, false));
      linesTrans.forEach(process(resultTrans, timeResultTrans, true));

      // sort time line
      result = timeResult.concat(timeResultTrans).sort((a, b) => {
        const keyA = a.seconds;
        const keyB = b.seconds;

        // Compare the 2 dates
        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;
        if (a.translationFlag !== b.translationFlag) {
          if (a.translationFlag === false) {
            return -1;
          }
          return 1;
        }
        if (a.index < b.index) return -1;
        if (a.index > b.index) return 1;
        return 0;
      });
      // disable tag info, because music provider always write
      // tag info in lyric timeline.
      // result.push.apply(result, timeResult);
      // result = timeResult; // executed up there

      for (let i = 0; i < result.length; i += 1) {
        result[i].lineNumber = i;
      }

      return result;
    }
    const mode =
      isElectron() || getLocalStorageValue('enable_stop_when_close', true)
        ? 'front'
        : 'background';

    getPlayer(mode).setMode(mode);
    if (mode === 'front') {
      if (!isElectron()) {
        // avoid background keep playing when change to front mode
        getPlayerAsync('background', (player) => {
          player.pause();
        });
      }
    }

    addPlayerListener(mode, (msg, sender, sendResponse) => {
      if (
        typeof msg.type === 'string' &&
        msg.type.split(':')[0] === 'BG_PLAYER'
      ) {
        switch (msg.type.split(':').slice(1).join('')) {
          case 'READY': {
            break;
          }
          case 'PLAY_FAILED': {
            notyf.info(i18next.t('_COPYRIGHT_ISSUE'), true);
            break;
          }

          case 'VOLUME': {
            $scope.$evalAsync(() => {
              $scope.volume = msg.data;
            });
            break;
          }

          case 'FRAME_UPDATE': {
            // 'currentTrack:position'
            // update lyric position
            if (!l1Player.status.playing.id) break;
            const currentSeconds = msg.data.pos;
            let lastObject = null;
            let lastObjectTrans = null;
            $scope.lyricArray.forEach((lyric) => {
              if (currentSeconds >= lyric.seconds / 1000) {
                if (lyric.translationFlag !== true) {
                  lastObject = lyric;
                } else {
                  lastObjectTrans = lyric;
                }
              }
            });
            if (
              lastObject &&
              lastObject.lineNumber !== $scope.lyricLineNumber
            ) {
              const lineElement = document.querySelector(
                `.page .playsong-detail .detail-songinfo .lyric p[data-line="${lastObject.lineNumber}"]`
              );
              const windowHeight = document.querySelector(
                '.page .playsong-detail .detail-songinfo .lyric'
              ).offsetHeight;

              const adjustOffset = 30;
              const offset =
                lineElement.offsetTop - windowHeight / 2 + adjustOffset;
              smoothScrollTo(document.querySelector('.lyric'), offset, 500);
              $scope.lyricLineNumber = lastObject.lineNumber;
              if (
                lastObjectTrans &&
                lastObjectTrans.lineNumber !== $scope.lyricLineNumberTrans
              ) {
                $scope.lyricLineNumberTrans = lastObjectTrans.lineNumber;
              }
              if (isElectron()) {
                const { ipcRenderer } = require('electron');
                const currentLyric =
                  $scope.lyricArray[lastObject.lineNumber].content;
                let currentLyricTrans = '';
                if (
                  $scope.enableLyricFloatingWindowTranslation === true &&
                  lastObjectTrans
                ) {
                  currentLyricTrans =
                    $scope.lyricArray[lastObjectTrans.lineNumber].content;
                }
                ipcRenderer.send('currentLyric', {
                  lyric: currentLyric,
                  tlyric: currentLyricTrans,
                });
              }
            }

            // 'currentTrack:duration'
            (() => {
              const durationSec = Math.floor(msg.data.duration);
              const durationStr = `${Math.floor(durationSec / 60)}:${`0${
                durationSec % 60
              }`.substr(-2)}`;
              if (
                msg.data.duration === 0 ||
                $scope.currentDuration === durationStr
              ) {
                return;
              }
              $scope.currentDuration = durationStr;
            })();

            // 'track:progress'
            if ($scope.changingProgress === false) {
              $scope.$evalAsync(() => {
                if (msg.data.duration === 0) {
                  $scope.myProgress = 0;
                } else {
                  $scope.myProgress = (msg.data.pos / msg.data.duration) * 100;
                }
                const posSec = Math.floor(msg.data.pos);
                const posStr = `${Math.floor(posSec / 60)}:${`0${
                  posSec % 60
                }`.substr(-2)}`;
                $scope.currentPosition = posStr;
              });
            }
            break;
          }

          case 'LOAD': {
            $scope.currentPlaying = msg.data;
            if (msg.data.id === undefined) {
              break;
            }
            $scope.currentPlaying.platformText = i18next.t(
              $scope.currentPlaying.platform
            );
            $scope.myProgress = 0;
            if ($scope.lastTrackId === msg.data.id) {
              break;
            }
            const current = localStorage.getObject('player-settings') || {};
            current.nowplaying_track_id = msg.data.id;
            localStorage.setObject('player-settings', current);
            // update lyric
            $scope.lyricArray = [];
            $scope.lyricLineNumber = -1;
            $scope.lyricLineNumberTrans = -1;
            smoothScrollTo(document.querySelector('.lyric'), 0, 300);
            const track = msg.data;
            $rootScope.page_title = {
              title: track.title,
              artist: track.artist,
              status: 'playing',
            };
            if (lastfm.isAuthorized()) {
              lastfm.sendNowPlaying(track.title, track.artist, () => {});
            }

            MediaService.getLyric(
              msg.data.id,
              msg.data.album_id,
              track.lyric_url,
              track.tlyric_url
            ).success((res) => {
              const { lyric, tlyric } = res;
              if (!lyric) {
                return;
              }
              $scope.lyricArray = parseLyric(lyric, tlyric);
            });
            $scope.lastTrackId = msg.data.id;
            if (isElectron()) {
              const { ipcRenderer } = require('electron');
              ipcRenderer.send('currentLyric', track.title);
              ipcRenderer.send('trackPlayingNow', track);
            }
            break;
          }

          case 'MUTE': {
            // 'music:mute'
            $scope.$evalAsync(() => {
              $scope.mute = msg.data;
            });
            break;
          }

          case 'PLAYLIST': {
            // 'player:playlist'
            $scope.$evalAsync(() => {
              $scope.playlist = msg.data;
              localStorage.setObject('current-playing', msg.data);
            });

            break;
          }

          case 'PLAY_STATE': {
            // 'music:isPlaying'
            $scope.$evalAsync(() => {
              $scope.isPlaying = !!msg.data.isPlaying;
            });
            let title = 'Listen 1';
            if ($rootScope.page_title !== undefined) {
              title = '';
              if (msg.data.isPlaying) {
                $rootScope.page_title.status = 'playing';
              } else {
                $rootScope.page_title.status = 'paused';
              }
              if ($rootScope.page_title.status !== '') {
                if ($rootScope.page_title.status === 'playing') {
                  title += '▶ ';
                } else if ($rootScope.page_title.status === 'paused') {
                  title += '❚❚ ';
                }
              }
              title += $rootScope.page_title.title;
              if ($rootScope.page_title.artist !== '') {
                title += ` - ${$rootScope.page_title.artist}`;
              }
            }

            $rootScope.document_title = title;
            if (isElectron()) {
              const { ipcRenderer } = require('electron');
              if (msg.data.isPlaying) {
                ipcRenderer.send('isPlaying', true);
              } else {
                ipcRenderer.send('isPlaying', false);
              }
            }

            if (msg.data.reason === 'Ended') {
              if (!lastfm.isAuthorized()) {
                break;
              }
              // send lastfm scrobble
              const track = l1Player.getTrackById(l1Player.status.playing.id);
              lastfm.scrobble(
                l1Player.status.playing.playedFrom,
                track.title,
                track.artist,
                track.album,
                () => {}
              );
            }

            break;
          }
          case 'RETRIEVE_URL_SUCCESS': {
            $scope.currentPlaying = msg.data;
            // update translate whenever set value
            $scope.currentPlaying.platformText = i18next.t(
              $scope.currentPlaying.platform
            );
            break;
          }
          case 'RETRIEVE_URL_FAIL': {
            $scope.copyrightNotice();
            break;
          }
          case 'RETRIEVE_URL_FAIL_ALL': {
            $scope.failAllNotice();
            break;
          }
          default:
            break;
        }
      }
      if (sendResponse !== undefined) {
        sendResponse();
      }
    });

    // connect player should run after all addListener function finished
    l1Player.connectPlayer();

    // define keybind
    // description: '播放/暂停',
    hotkeys('p', l1Player.togglePlayPause);

    // description: '上一首',
    hotkeys('[', l1Player.prev);

    // description: '下一首',
    hotkeys(']', l1Player.next);

    // description: '静音/取消静音',
    hotkeys('m', l1Player.toggleMute);

    // description: '打开/关闭播放列表',
    hotkeys('l', $scope.togglePlaylist);

    // description: '切换播放模式（顺序/随机/单曲循环）',
    hotkeys('s', $scope.changePlaymode);

    // description: '音量增加',
    hotkeys('u', () => {
      $timeout(() => {
        l1Player.adjustVolume(true);
      });
    });

    // description: '音量减少',
    hotkeys('d', () => {
      $timeout(() => {
        l1Player.adjustVolume(false);
      });
    });

    $scope.toggleLyricTranslation = () => {
      $scope.enableLyricTranslation = !$scope.enableLyricTranslation;
      localStorage.setObject(
        'enable_lyric_translation',
        $scope.enableLyricTranslation
      );
    };

    $scope.toggleLyricFloatingWindowTranslation = () => {
      $scope.enableLyricFloatingWindowTranslation =
        !$scope.enableLyricFloatingWindowTranslation;
      localStorage.setObject(
        'enable_lyric_floating_window_translation',
        $scope.enableLyricFloatingWindowTranslation
      );
    };

    if (isElectron()) {
      require('electron').ipcRenderer.on('globalShortcut', (event, message) => {
        if (message === 'right') {
          l1Player.next();
        } else if (message === 'left') {
          l1Player.prev();
        } else if (message === 'space') {
          l1Player.togglePlayPause();
        }
      });
    }

    $scope.setAutoChooseSource = (toggle) => {
      if (toggle === true) {
        $scope.enableAutoChooseSource = !$scope.enableAutoChooseSource;
      }
      localStorage.setObject(
        'enable_auto_choose_source',
        $scope.enableAutoChooseSource
      );
    };

    $scope.enableSource = (source) => {
      if ($scope.autoChooseSourceList.indexOf(source) > -1) {
        return;
      }
      $scope.autoChooseSourceList = [...$scope.autoChooseSourceList, source];
      localStorage.setObject(
        'auto_choose_source_list',
        $scope.autoChooseSourceList
      );
    };

    $scope.disableSource = (source) => {
      if ($scope.autoChooseSourceList.indexOf(source) === -1) {
        return;
      }
      $scope.autoChooseSourceList = $scope.autoChooseSourceList.filter(
        (i) => i !== source
      );
      localStorage.setObject(
        'auto_choose_source_list',
        $scope.autoChooseSourceList
      );
    };

    $scope.setStopWhenClose = (status) => {
      $scope.enableStopWhenClose = status;
      localStorage.setObject(
        'enable_stop_when_close',
        $scope.enableStopWhenClose
      );
    };

    $scope.setNowplayingCoverBackground = (toggle) => {
      if (toggle === true) {
        $scope.enableNowplayingCoverBackground =
          !$scope.enableNowplayingCoverBackground;
      }
      localStorage.setObject(
        'enable_nowplaying_cover_background',
        $scope.enableNowplayingCoverBackground
      );
    };
    $scope.setNowplayingBitrate = (toggle) => {
      if (toggle === true) {
        $scope.enableNowplayingBitrate = !$scope.enableNowplayingBitrate;
      }
      localStorage.setObject(
        'enable_nowplaying_bitrate',
        $scope.enableNowplayingBitrate
      );
    };
    $scope.setNowplayingPlatform = (toggle) => {
      if (toggle === true) {
        $scope.enableNowplayingPlatform = !$scope.enableNowplayingPlatform;
      }
      localStorage.setObject(
        'enable_nowplaying_platform',
        $scope.enableNowplayingPlatform
      );
    };
  },
]);
