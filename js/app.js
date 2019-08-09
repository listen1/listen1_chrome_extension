/* global Storage localStorage window document Blob navigator */
/* global $ angular Timer FileReader soundManager */
/* eslint-disable global-require */
/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
/* eslint-disable import/no-unresolved */
const main = () => {
  localStorage.__proto__.setObject = function setObject(key, value) {
    this.setItem(key, JSON.stringify(value));
  };

  localStorage.__proto__.getObject = function getObject(key) {
    const value = this.getItem(key);
    return value && JSON.parse(value);
  };

  const app = angular.module('listenone', ['angularSoundManager', 'ui-notification', 'loWebManager', 'cfp.hotkeys', 'lastfmClient', 'githubClient', 'pascalprecht.translate']);

  app.config([
    '$compileProvider',
    ($compileProvider) => {
      $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|moz-extension|file):/);
    },
  ]);

  app.config((NotificationProvider) => {
    NotificationProvider.setOptions({
      delay: 2000,
      startTop: 20,
      startRight: 10,
      verticalSpacing: 20,
      horizontalSpacing: 20,
      positionX: 'center',
      positionY: 'top',
    });
  });

  app.config((hotkeysProvider) => {
    hotkeysProvider.templateTitle = '快捷键列表'; // eslint-disable-line no-param-reassign
    hotkeysProvider.cheatSheetDescription = '显示/隐藏快捷键列表'; // eslint-disable-line no-param-reassign
  });

  app.config((lastfmProvider) => {
    lastfmProvider.setOptions({
      apiKey: '6790c00a181128dc7c4ce06cd99d17c8',
      apiSecret: 'd68f1dfc6ff43044c96a79ae7dfb5c27',
    });
  });

  app.config(['$translateProvider', ($translateProvider) => {
    // Register a loader for the static files
    $translateProvider.useStaticFilesLoader({
      prefix: './i18n/',
      suffix: '.json',
    });
    $translateProvider.use('zh_CN');
    // Tell the module what language to use by default
    $translateProvider.preferredLanguage('zh_CN');
  }]);

  app.run(['angularPlayer', 'Notification', 'loWeb', '$translate',
    (angularPlayer, Notification, loWeb, $translate) => {
      angularPlayer.setBootstrapTrack(
        loWeb.bootstrapTrack(
          () => {},
          () => {
            const d = {
              message: $translate.instant('_COPYRIGHT_ISSUE'),
              replaceMessage: true,
            };
            Notification.info(d);
          },
        ),
      );
    },
  ]);

  app.filter('playmode_title', () => ((input) => {
    switch (input) {
      case 0:
        return '顺序';
      case 1:
        return '随机';
      case 2:
        return '单曲循环';
      default:
        return '';
    }
  }));

  function getSourceName(sourceId) {
    if (sourceId === 0) {
      return 'netease';
    }
    if (sourceId === 1) {
      return 'xiami';
    }
    if (sourceId === 2) {
      return 'qq';
    }
    if (sourceId === 4) {
      return 'kugou';
    }
    if (sourceId === 5) {
      return 'kuwo';
    }
    if (sourceId === 6) {
      return 'bilibili';
    }
    if (sourceId === 7) {
      return 'migu';
    }
    return '';
  }


  app.controller('ProfileController', ['$scope', '$translate', '$http', ($scope, $translate, $http) => {
    let defaultLang = 'zh_CN';
    const supportLangs = ['zh_CN', 'en_US'];
    if (supportLangs.indexOf(navigator.language) !== -1) {
      defaultLang = navigator.language;
    }
    if (supportLangs.indexOf(localStorage.getObject('language')) !== -1) {
      defaultLang = localStorage.getObject('language');
    }

    $scope.setLang = (langKey) => {
      // You can change the language during runtime
      $translate.use(langKey).then(() => {
        $http.get('./i18n/zh_CN.json')
          .then((res) => {
            Object.keys(res.data).forEach((key) => {
              $scope[key] = $translate.instant(key);
            });
          });
        localStorage.setObject('language', langKey);
      });
    };
    $scope.setLang(defaultLang);

    let defaultTheme = 'white';
    if (localStorage.getObject('theme') !== null) {
      defaultTheme = localStorage.getObject('theme');
    }
    $scope.setTheme = (theme) => {
      var themeFiles = {
        'white':"css/iparanoid.css",
        'black': "css/origin.css"
      }
      // You can change the language during runtime
      if(themeFiles[theme]!==undefined) {
        document.getElementById('theme').href = themeFiles[theme];
        localStorage.setObject('theme', theme);
      }      
    };
    $scope.setTheme(defaultTheme);
  }]);

  // control main view of page, it can be called any place
  app.controller('NavigationController', ['$scope', '$http',
    '$httpParamSerializerJQLike', '$timeout',
    'angularPlayer', 'Notification', '$rootScope', 'loWeb',
    'hotkeys', 'lastfm', 'github', 'gist', '$translate',
    ($scope, $http, $httpParamSerializerJQLike,
      $timeout, angularPlayer, Notification, $rootScope,
      loWeb, hotkeys, lastfm, github, gist, $translate) => {
      $rootScope.page_title = 'Listen 1'; // eslint-disable-line no-param-reassign
      $scope.window_url_stack = [];
      $scope.window_poped_url_stack = [];
      $scope.current_tag = 2;
      $scope.is_window_hidden = 1;
      $scope.is_dialog_hidden = 1;

      $scope.songs = [];
      $scope.current_list_id = -1;

      $scope.dialog_song = '';
      $scope.dialog_type = 0;
      $scope.dialog_title = '';

      $scope.isDoubanLogin = false;

      $scope.lastfm = lastfm;
      $scope.github = github;

      $scope.$on('isdoubanlogin:update', (event, data) => {
        $scope.isDoubanLogin = data;
      });

      // tag
      $scope.showTag = (tag_id) => {
        $scope.current_tag = tag_id;
        $scope.is_window_hidden = 1;
        $scope.window_url_stack = [];
        $scope.window_poped_url_stack = [];
        $scope.closeWindow();
      };

      $scope.$on('search:keyword_change', (event, data) => { // eslint-disable-line no-unused-vars
        $scope.showTag(3);
      });

      // playlist window
      $scope.resetWindow = () => {
        $scope.cover_img_url = 'images/loading.svg';
        $scope.playlist_title = '';
        $scope.playlist_source_url = '';
        $scope.songs = [];
        $scope.window_type = 'list';
        document.getElementsByClassName('browser')[0].scrollTop = 0;
      };

      $scope.showWindow = (url) => {
        if ($scope.window_url_stack.length > 0
          && $scope.window_url_stack[$scope.window_url_stack.length - 1] === url) {
          return;
        }
        $scope.is_window_hidden = 0;
        $scope.resetWindow();

        if ($scope.window_url_stack.length > 0 && $scope.window_url_stack[$scope.window_url_stack.length - 1] === '/now_playing') {
          // if now playing is top, pop it
          $scope.window_url_stack.splice(-1, 1);
        }

        if (url === '/now_playing') {
          $scope.window_type = 'track';
          $scope.window_url_stack.push(url);
          $scope.window_poped_url_stack = [];
          return;
        }
        $scope.window_url_stack.push(url);
        $scope.window_poped_url_stack = [];

        loWeb.get(url).success((data) => {
          if (data.status === '0') {
            Notification.info(data.reason);
            $scope.popWindow();
            return;
          }
          $scope.songs = data.tracks;
          $scope.cover_img_url = data.info.cover_img_url;
          $scope.playlist_title = data.info.title;
          $scope.playlist_source_url = data.info.source_url;
          $scope.list_id = data.info.id;
          $scope.is_mine = (data.info.id.slice(0, 2) === 'my');
          $scope.window_type = 'list';
        });
      };

      $scope.closeWindow = () => {
        $scope.is_window_hidden = 1;
        $scope.resetWindow();
        $scope.window_url_stack = [];
        $scope.window_poped_url_stack = [];
      };

      function refreshWindow(url) {
        if (url === '/now_playing') {
          $scope.window_type = 'track';
          return;
        }
        loWeb.get(url).success((data) => {
          $scope.songs = data.tracks;
          $scope.list_id = data.info.id;
          $scope.cover_img_url = data.info.cover_img_url;
          $scope.playlist_title = data.info.title;
          $scope.playlist_source_url = data.info.source_url;
          $scope.is_mine = (data.info.id.slice(0, 2) === 'my');
        });
      }
      $scope.popWindow = () => {
        const poped = $scope.window_url_stack.pop();
        $scope.window_poped_url_stack.push(poped);
        if ($scope.window_url_stack.length === 0) {
          $scope.closeWindow();
        } else {
          $scope.resetWindow();
          const url = $scope.window_url_stack[$scope.window_url_stack.length - 1];
          refreshWindow(url);
        }
      };

      $scope.toggleWindow = (url) => {
        if ($scope.window_url_stack.length > 0
          && $scope.window_url_stack[$scope.window_url_stack.length - 1] === url) {
          return $scope.popWindow();
        }
        return $scope.showWindow(url);
      };

      $scope.forwardWindow = () => {
        if ($scope.window_poped_url_stack.length === 0) {
          return;
        }

        $scope.resetWindow();
        const url = $scope.window_poped_url_stack.pop();
        $scope.window_url_stack.push(url);
        refreshWindow(url);
      };

      $scope.showPlaylist = (list_id) => {
        const url = `/playlist?list_id=${list_id}`;
        $scope.showWindow(url);
      };

      $scope.directplaylist = (list_id) => {
        const url = `/playlist?list_id=${list_id}`;

        loWeb.get(url).success((data) => {
          $scope.songs = data.tracks;
          $scope.current_list_id = list_id;

          $timeout(() => {
            // use timeout to avoid stil in digest error.
            angularPlayer.clearPlaylist((res) => {
              // add songs to playlist
              angularPlayer.addTrackArray($scope.songs);
              // play first song
              let index = 0;
              if (angularPlayer.getShuffle()) {
                const max = $scope.songs.length - 1;
                const min = 0;
                index = Math.floor(Math.random() * (max - min + 1)) + min;
              }
              angularPlayer.playTrack($scope.songs[index].id);
            });
          }, 0);
        });
      };

      $scope.showDialog = (dialog_type, data) => {
        $scope.is_dialog_hidden = 0;
        const dialogWidth = 285;
        const left = $(window).width() / 2 - dialogWidth / 2;
        $scope.myStyle = {
          left: `${left}px`,
        };

        if (dialog_type === 0) {
          $scope.dialog_title = $translate.instant('_ADD_TO_PLAYLIST');
          const url = '/show_myplaylist';
          $scope.dialog_song = data;
          loWeb.get(url).success((res) => { // eslint-disable-line no-param-reassgin
            $scope.myplaylist = res.result;
          });
        }

        // if (dialog_type === 2) {
        //   $scope.dialog_title = '登录豆瓣';
        //   $scope.dialog_type = 2;
        // }

        if (dialog_type === 3) {
          $scope.dialog_title = $translate.instant('_EDIT_PLAYLIST');
          $scope.dialog_type = 3;
          $scope.dialog_cover_img_url = data.cover_img_url;
          $scope.dialog_playlist_title = data.playlist_title;
        }
        if (dialog_type === 4) {
          $scope.dialog_title = $translate.instant('_CONNECT_TO_LASTFM');
          $scope.dialog_type = 4;
        }
        if (dialog_type === 5) {
          $scope.dialog_title = $translate.instant('_OPEN_PLAYLIST');
          $scope.dialog_type = 5;
        }
        if (dialog_type === 6) {
          $scope.dialog_title = $translate.instant('_IMPORT_PLAYLIST');
          const url = '/show_myplaylist';
          loWeb.get(url).success((res) => { // eslint-disable-line no-param-reassgin
            $scope.myplaylist = res.result;
          });
          $scope.dialog_type = 6;
        }
        if (dialog_type === 7) {
          $scope.dialog_title = $translate.instant('_CONNECT_TO_GITHUB');
          $scope.dialog_type = 7;
        }
        if (dialog_type === 8) {
          $scope.dialog_title = $translate.instant('_EXPORT_TO_GITHUB_GIST');
          $scope.dialog_type = 8;
          gist.listExistBackup().then((res) => {
            $scope.myBackup = res;
          }, (err) => {
            $scope.myBackup = [];
          });
        }
        if (dialog_type === 10) {
          $scope.dialog_title = $translate.instant('_RECOVER_FROM_GITHUB_GIST');
          $scope.dialog_type = 10;
          gist.listExistBackup().then((res) => {
            $scope.myBackup = res;
          }, (err) => {
            $scope.myBackup = [];
          });
        }
      };

      $scope.chooseDialogOption = (option_id) => {
        const url = '/add_myplaylist';
        loWeb.post({
          url,
          method: 'POST',
          data: $httpParamSerializerJQLike({
            list_id: option_id,
            track: JSON.stringify($scope.dialog_song),
          }),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }).success(() => {
          Notification.success($translate.instant('_ADD_TO_PLAYLIST_SUCCESS'));
          $scope.closeDialog();
          // add to current playing list
          if (option_id === $scope.current_list_id) {
            angularPlayer.addTrack($scope.dialog_song);
          }
        });
      };

      $scope.newDialogOption = (option) => {
        $scope.dialog_type = option;
      };

      $scope.cancelNewDialog = (option) => {
        $scope.dialog_type = option;
      };

      $scope.createAndAddPlaylist = () => {
        const url = '/create_myplaylist';

        loWeb.post({
          url,
          method: 'POST',
          data: $httpParamSerializerJQLike({
            list_title: $scope.newlist_title,
            track: JSON.stringify($scope.dialog_song),
          }),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }).success(() => {
          $rootScope.$broadcast('myplaylist:update');
          Notification.success($translate.instant('_ADD_TO_PLAYLIST_SUCCESS'));
          $scope.closeDialog();
        });
      };

      $scope.editMyPlaylist = () => {
        const url = '/edit_myplaylist';

        loWeb.post({
          url,
          method: 'POST',
          data: $httpParamSerializerJQLike({
            list_id: $scope.list_id,
            title: $scope.dialog_playlist_title,
            cover_img_url: $scope.dialog_cover_img_url,
          }),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }).success(() => {
          $rootScope.$broadcast('myplaylist:update');
          $scope.playlist_title = $scope.dialog_playlist_title;
          $scope.cover_img_url = $scope.dialog_cover_img_url;
          Notification.success($translate.instant('_EDIT_PLAYLIST_SUCCESS'));
          $scope.closeDialog();
        });
      };

      $scope.mergePlaylist = (target_list_id) => {
        Notification.info($translate.instant('_IMPORTING_PLAYLIST'));
        const url = '/merge_playlist';
        loWeb.post({
          url,
          method: 'POST',
          data: $httpParamSerializerJQLike({
            source: $scope.list_id,
            target: target_list_id,
          }),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }).success(() => {
          Notification.success($translate.instant('_IMPORTING_PLAYLIST_SUCCESS'));
          $scope.closeDialog();
          $scope.popWindow();
          $scope.showPlaylist($scope.list_id);
        });
      };

      $scope.removeSongFromPlaylist = (song, list_id) => {
        const url = '/remove_track_from_myplaylist';

        loWeb.post({
          url,
          method: 'POST',
          data: $httpParamSerializerJQLike({
            list_id,
            track_id: song.id,
          }),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }).success(() => {
          // remove song from songs
          const index = $scope.songs.indexOf(song);
          if (index > -1) {
            $scope.songs.splice(index, 1);
          }
          Notification.success($translate.instant('_REMOVE_SONG_FROM_PLAYLIST_SUCCESS'));
        });
      };

      $scope.closeDialog = () => {
        $scope.is_dialog_hidden = 1;
        $scope.dialog_type = 0;
        // update lastfm status if not authorized
        if (lastfm.isAuthRequested()) {
          lastfm.updateStatus();
        }
      };

      $scope.setCurrentList = (list_id) => {
        $scope.current_list_id = list_id;
      };

      $scope.playMylist = (list_id) => {
        $timeout(() => {
          angularPlayer.clearPlaylist((data) => {
            // add songs to playlist
            angularPlayer.addTrackArray($scope.songs);
            let index = 0;
            if (angularPlayer.getShuffle()) {
              const max = $scope.songs.length - 1;
              const min = 0;
              index = Math.floor(Math.random() * (max - min + 1)) + min;
            }
            // play first song
            angularPlayer.playTrack($scope.songs[index].id);
          });
        }, 0);
        $scope.setCurrentList(list_id);
      };

      $scope.addMylist = (list_id) => {
        $timeout(() => {
          // add songs to playlist
          angularPlayer.addTrackArray($scope.songs);
          Notification.success($translate.instant('_ADD_TO_QUEUE_SUCCESS'));
        }, 0);
      };

      $scope.copyrightNotice = () => {
        const d = {
          message: $translate.instant('_COPYRIGHT_ISSUE'),
          replaceMessage: true,
        };
        Notification.info(d);
      };

      $scope.clonePlaylist = (list_id) => {
        const url = '/clone_playlist';
        loWeb.post({
          url,
          method: 'POST',
          data: $httpParamSerializerJQLike({
            list_id,
          }),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }).success(() => {
          $rootScope.$broadcast('myplaylist:update');
          $scope.closeWindow();
          Notification.success($translate.instant('_ADD_TO_PLAYLIST_SUCCESS'));
        });
      };

      $scope.removeMyPlaylist = (list_id) => {
        const url = '/remove_myplaylist';

        loWeb.post({
          url,
          method: 'POST',
          data: $httpParamSerializerJQLike({
            list_id,
          }),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }).success(() => {
          $rootScope.$broadcast('myplaylist:update');
          $scope.closeDialog();
          $scope.closeWindow();
          Notification.success($translate.instant('_REMOVE_PLAYLIST_SUCCESS'));
        });
      };


      $scope.downloadFile = (fileName, fileType, content) => {
        window.URL = window.URL || window.webkitURL;
        const blob = new Blob([content], {
          type: fileType,
        });
        const link = document.createElement('a');
        link.download = fileName;
        link.href = window.URL.createObjectURL(blob);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        link.remove();
      };

      $scope.backupMySettings = () => {
        const items = {};
        Object.keys(localStorage).forEach((key) => {
          items[key] = localStorage.getObject(key);
        });

        const content = JSON.stringify(items);
        $scope.downloadFile('listen1_backup.json', 'application/json', content);
      };

      $scope.importMySettings = (event) => {
        const fileObject = event.target.files[0];
        if (fileObject === null) {
          Notification.warning('请选择备份文件');
          return;
        }
        const reader = new FileReader();
        reader.onloadend = (readerEvent) => {
          if (readerEvent.target.readyState === FileReader.DONE) {
            const data_json = readerEvent.target.result;
            // parse json
            let data = null;
            try {
              data = JSON.parse(data_json);
            } catch (e) {
              Notification.warning('备份文件格式错误，请重新选择');
              return;
            }

            Object.keys(data).forEach(item => localStorage.setObject(item, data[item]));
            $rootScope.$broadcast('myplaylist:update');
            Notification.success('成功导入我的歌单');
          }
        };
        reader.readAsText(fileObject);
      };

      $scope.gistBackupLoading = false;
      $scope.backupMySettings2Gist = (gistId, isPublic) => {
        const items = {};
        Object.keys(localStorage).forEach((key) => {
          if (key !== 'gistid' && key !== 'githubOauthAccessKey') { // avoid token leak
            items[key] = localStorage.getObject(key);
          }
        });
        const gistFiles = gist.json2gist(items);
        $scope.gistBackupLoading = true;
        gist.backupMySettings2Gist(gistFiles, gistId, isPublic).then(() => {
          Notification.clearAll();
          Notification.success('成功导出我的歌单到Gist');
          $scope.gistBackupLoading = false;
        }, (err) => {
          Notification.clearAll();
          Notification.warning('导出我的歌单失败，检查后重试');
          $scope.gistBackupLoading = false;
        });
        Notification({
          message: '正在导出我的歌单到Gist...',
          delay: null,
        });
      };

      $scope.gistRestoreLoading = false;
      $scope.importMySettingsFromGist = (gistId) => {
        $scope.gistRestoreLoading = true;
        gist.importMySettingsFromGist(gistId).then((raw) => {
          gist.gist2json(raw, (data) => {
            Object.keys(data).forEach(item => localStorage.setObject(item, data[item]));
            Notification.clearAll();
            Notification.success('导入我的歌单成功');
            $scope.gistRestoreLoading = false;
            $rootScope.$broadcast('myplaylist:update');
          });
        }, (err) => {
          Notification.clearAll();
          if (err === 404) {
            Notification.warning('未找到备份歌单，请先备份');
          } else {
            Notification.warning('导入我的歌单失败，检查后重试');
          }
          $scope.gistRestoreLoading = false;
        });
        Notification({
          message: '正在从Gist导入我的歌单...',
          delay: null,
        });
      };


      $scope.showShortcuts = () => {
        hotkeys.toggleCheatSheet();
      };

      hotkeys.add({
        combo: 'f',
        description: '快速搜索',
        callback() {
          $scope.showTag(3);
          $timeout(() => {
            $('#search-input').focus();
          }, 0);
        },
      });

      $scope.openUrl = (url) => {
        loWeb.post({
          url: '/parse_url',
          method: 'POST',
          data: $httpParamSerializerJQLike({
            url,
          }),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }).success((data) => {
          const { result } = data;
          if (result !== undefined) {
            $scope.showPlaylist(result.id);
          } else {
            Notification.info($translate.instant('_FAIL_OPEN_PLAYLIST_URL'));
          }
        });
      };
    },
  ]);

  app.directive('customOnChange', () => {
    const ret = {
      restrict: 'A',
      link: (scope, element, attrs) => {
        const onChangeHandler = scope.$eval(attrs.customOnChange);
        element.bind('change', onChangeHandler);
      },
    };
    return ret;
  });

  app.directive('volumeWheel', () => ((scope, element, attrs) => {
    element.bind('mousewheel', () => {
      scope.adjustVolume(window.event.wheelDelta > 0);
    });
  }));

  app.controller('PlayController', ['$scope', '$timeout', '$log',
    '$anchorScroll', '$location', 'angularPlayer', '$http',
    '$httpParamSerializerJQLike', '$rootScope', 'Notification',
    'loWeb', 'hotkeys', 'lastfm',
    ($scope, $timeout, $log, $anchorScroll, $location,
      angularPlayer, $http, $httpParamSerializerJQLike,
      $rootScope, Notification, loWeb, hotkeys, lastfm) => {
      $scope.menuHidden = true;
      $scope.volume = angularPlayer.getVolume();
      $scope.mute = angularPlayer.getMuteStatus();
      $scope.settings = {
        playmode: 0,
        nowplaying_track_id: -1,
      };
      $scope.lyricArray = [];
      $scope.lyricLineNumber = -1;
      $scope.lastTrackId = null;

      $scope.scrobbleTrackId = null;
      $scope.scrobbleTimer = new Timer();
      $scope.adjustVolume = angularPlayer.adjustVolume;
      $scope.enableGloablShortcut = false;
      $scope.isChrome = (typeof chrome !== 'undefined');
      $scope.isMac = false;

      if (!$scope.isChrome) {
        $scope.isMac = require('electron').remote.process.platform === 'darwin';
      }


      function switchMode(mode) {
        // playmode 0:loop 1:shuffle 2:repeat one
        switch (mode) {
          case 0:
            if (angularPlayer.getShuffle()) {
              angularPlayer.toggleShuffle();
            }
            angularPlayer.setRepeatOneStatus(false);
            break;
          case 1:
            if (!angularPlayer.getShuffle()) {
              angularPlayer.toggleShuffle();
            }
            angularPlayer.setRepeatOneStatus(false);
            break;
          case 2:
            if (angularPlayer.getShuffle()) {
              angularPlayer.toggleShuffle();
            }
            angularPlayer.setRepeatOneStatus(true);
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
          $timeout(() => {
            angularPlayer.adjustVolumeSlider($scope.volume);
          }, 0);
        }
        $scope.enableGlobalShortCut = localStorage.getObject('enable_global_shortcut');
        $scope.enableLyricFloatingWindow = localStorage.getObject('enable_lyric_floating_window');
        $scope.applyGlobalShortcut();
        $scope.openLyricFloatingWindow();
      };

      $scope.saveLocalSettings = () => {
        localStorage.setObject('player-settings', $scope.settings);
      };

      $scope.loadLocalCurrentPlaying = () => {
        const localSettings = localStorage.getObject('current-playing');
        if (localSettings === null) {
          return;
        }
        // apply local current playing;
        angularPlayer.addTrackArray(localSettings);
      };

      $scope.saveLocalCurrentPlaying = () => {
        localStorage.setObject('current-playing', angularPlayer.playlist);
      };

      $scope.changePlaymode = () => {
        const playmodeCount = 3;
        $scope.settings.playmode = ($scope.settings.playmode + 1) % playmodeCount;
        switchMode($scope.settings.playmode);
        $scope.saveLocalSettings();
      };

      $scope.$on('music:volume', (event, data) => {
        $scope.$apply(() => {
          $scope.volume = data;
        });
      });

      $scope.$on('github:status', (event, data) => {
        $scope.$apply(() => {
          $scope.githubStatus = data;
        });
      });

      $scope.$on('angularPlayer:ready', (event, data) => {
        $log.debug('cleared, ok now add to playlist');
        if (angularPlayer.getRepeatStatus() === false) {
          angularPlayer.repeatToggle();
        }

        // if (track_id === -1) {
        //   return;
        // }

        // add songs to playlist
        const localCurrentPlaying = localStorage.getObject('current-playing');
        if (localCurrentPlaying === null) {
          return;
        }
        angularPlayer.addTrackArray(localCurrentPlaying);

        const localPlayerSettings = localStorage.getObject('player-settings');
        if (localPlayerSettings === null) {
          return;
        }
        const track_id = localPlayerSettings.nowplaying_track_id;

        angularPlayer.loadTrack(track_id);
      });

      $scope.gotoAnchor = (newHash) => {
        if ($location.hash() !== newHash) {
          // set the $location.hash to `newHash` and
          // $anchorScroll will automatically scroll to it
          $location.hash(newHash);
          $anchorScroll();
        } else {
          // call $anchorScroll() explicitly,
          // since $location.hash hasn't changed
          $anchorScroll();
        }
      };

      $scope.togglePlaylist = () => {
        const anchor = `song${angularPlayer.getCurrentTrack()}`;
        $scope.menuHidden = !$scope.menuHidden;
        if (!$scope.menuHidden) {
          $scope.gotoAnchor(anchor);
        }
      };

      $scope.toggleMuteStatus = () => {
        // mute function is indeed toggle mute status.
        angularPlayer.mute();
      };

      $scope.myProgress = 0;
      $scope.changingProgress = false;

      $rootScope.$on('track:progress', (event, data) => {
        if ($scope.changingProgress === false) {
          $scope.myProgress = data;
        }
      });

      $rootScope.$on('track:myprogress', (event, data) => {
        $scope.$apply(() => {
          // should use apply to force refresh ui
          $scope.myProgress = data;
        });
      });

      $scope.$on('music:mute', (event, data) => {
        $scope.mute = data;
      });

      $scope.$on('player:playlist', (event, data) => {
        localStorage.setObject('current-playing', data);
      });


      $scope.$on('currentTrack:duration', (event, data) => {
        if (!lastfm.isAuthorized()) {
          return;
        }
        if (data === 0) {
          return;
        }
        if ($scope.scrobbleTrackId === angularPlayer.getCurrentTrack()) {
          return;
        }
        // new song arrives
        $scope.scrobbleTrackId = angularPlayer.getCurrentTrack();
        const track = angularPlayer.getTrack($scope.scrobbleTrackId);
        const startTimestamp = Math.round((new Date()).valueOf() / 1000);
        $scope.scrobbleTimer.start(() => {
          lastfm.scrobble(startTimestamp, track.title, track.artist, track.album, () => {});
        });
        // according to scrobble rule
        // http://www.last.fm/api/scrobbling
        const secondsToScrobble = Math.min(data / 1000 / 2, 60 * 4);
        $scope.scrobbleTimer.update(secondsToScrobble);
      });

      $scope.$on('music:isPlaying', (event, data) => {
        if (data) {
          $rootScope.page_title = `▶ ${$rootScope.page_title.slice($rootScope.page_title.indexOf(' '))}`;
        } else {
          $rootScope.page_title = `❚❚ ${$rootScope.page_title.slice($rootScope.page_title.indexOf(' '))}`;
        }
        if (!lastfm.isAuthorized()) {
          return;
        }
        if ($scope.scrobbleTrackId === null) {
          return;
        }
        if (data) {
          $scope.scrobbleTimer.resume();
        } else {
          $scope.scrobbleTimer.pause();
        }
      });

      function parseLyric(lyric) {
        const lines = lyric.split('\n');
        let result = [];
        const timeResult = [];

        function rightPadding(str, length, padChar) {
          const newstr = str + new Array(length - str.length + 1).join(padChar);
          return newstr;
        }

        lines.forEach((line) => {
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
            timeResult.push({
              content: $('<a />').html(line.replace(timeRegResult[0], '')).text(),
              seconds: parseInt(timeRegResult[1], 10) * 60 * 1000 // min
                + parseInt(timeRegResult[2], 10) * 1000 // sec
                + (timeRegResult[3] !== null ? parseInt(rightPadding(timeRegResult[3], 3, '0'), 10) : 0), // microsec
            });
          }
        });

        // sort time line
        timeResult.sort((a, b) => {
          const keyA = a.seconds;
          const keyB = b.seconds;
          // Compare the 2 dates
          if (keyA < keyB) return -1;
          if (keyA > keyB) return 1;
          return 0;
        });

        // disable tag info, because music provider always write
        // tag info in lyric timeline.
        // result.push.apply(result, timeResult);
        result = timeResult;

        for (let i = 0; i < result.length; i += 1) {
          result[i].lineNumber = i;
        }

        return result;
      }


      $scope.$on('track:id', (event, data) => {
        if ($scope.lastTrackId === data) {
          return;
        }
        const current = localStorage.getObject('player-settings');
        current.nowplaying_track_id = data;
        localStorage.setObject('player-settings', current);
        // update lyric
        $scope.lyricArray = [];
        $scope.lyricLineNumber = -1;
        $('.lyric').animate({
          scrollTop: '0px',
        }, 500);
        let url = `/lyric?track_id=${data}`;
        const track = angularPlayer.getTrack(data);

        $rootScope.page_title = `▶ ${track.title} - ${track.artist}`;
        if (lastfm.isAuthorized()) {
          lastfm.sendNowPlaying(track.title, track.artist, () => {});
        }

        if (track.lyric_url !== null) {
          url = `${url}&lyric_url=${track.lyric_url}`;
        }
        loWeb.get(url).success((res) => {
          const { lyric } = res;
          if (lyric === null) {
            return;
          }
          $scope.lyricArray = parseLyric(lyric);
        });
        $scope.lastTrackId = data;
        if (typeof chrome == 'undefined') {
          const { ipcRenderer } = require('electron');
          ipcRenderer.send('currentLyric', track.title);
        }
      });

      $scope.$on('currentTrack:position', (event, data) => {
        // update lyric position
        const currentSeconds = data;
        let lastObject = null;
        $scope.lyricArray.forEach((lyric) => {
          if (currentSeconds >= lyric.seconds) {
            lastObject = lyric;
          }
        });
        if (lastObject && lastObject.lineNumber !== $scope.lyricLineNumber) {
          const lineHeight = 21;
          const lineElement = $('.lyric p')[lastObject.lineNumber];
          const windowHeight = 380;
          const AdditionOffset = -158;
          const offset = lineElement.offsetTop - windowHeight / 2 + AdditionOffset;
          $('.lyric').animate({
            scrollTop: `${offset}px`,
          }, 500);
          $scope.lyricLineNumber = lastObject.lineNumber;
          if (typeof chrome == 'undefined') {
            const { ipcRenderer } = require('electron');
            ipcRenderer.send('currentLyric', $scope.lyricArray[lastObject.lineNumber].content);
          }
        }
      });

      // define keybind
      hotkeys.add({
        combo: 'p',
        description: '播放/暂停',
        callback() {
          if (angularPlayer.isPlayingStatus()) {
            // if playing then pause
            angularPlayer.pause();
          } else {
            // else play if not playing
            angularPlayer.play();
          }
        },
      });

      hotkeys.add({
        combo: '[',
        description: '上一首',
        callback() {
          angularPlayer.prevTrack();
        },
      });

      hotkeys.add({
        combo: ']',
        description: '下一首',
        callback() {
          angularPlayer.nextTrack();
        },
      });

      hotkeys.add({
        combo: 'm',
        description: '静音/取消静音',
        callback() {
          // mute indeed toggle mute status
          angularPlayer.mute();
        },
      });

      hotkeys.add({
        combo: 'l',
        description: '打开/关闭播放列表',
        callback() {
          $scope.togglePlaylist();
        },
      });

      hotkeys.add({
        combo: 's',
        description: '切换播放模式（顺序/随机/单曲循环）',
        callback() {
          $scope.changePlaymode();
        },
      });

      hotkeys.add({
        combo: 'u',
        description: '音量增加',
        callback() {
          $timeout(() => {
            angularPlayer.adjustVolume(true);
          });
        },
      });

      hotkeys.add({
        combo: 'd',
        description: '音量减少',
        callback() {
          $timeout(() => {
            angularPlayer.adjustVolume(false);
          });
        },
      });

      // electron global shortcuts
      $scope.applyGlobalShortcut = (toggle) => {
        if (typeof chrome !== 'undefined') {
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
        localStorage.setObject('enable_global_shortcut', $scope.enableGlobalShortCut);

        const { ipcRenderer } = require('electron');
        ipcRenderer.send('control', message);
      };

      $scope.openLyricFloatingWindow = (toggle) => {
        if (typeof chrome !== 'undefined') {
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
        localStorage.setObject('enable_lyric_floating_window', $scope.enableLyricFloatingWindow);
        const { ipcRenderer } = require('electron');
        ipcRenderer.send('control', message);
      };

      if (typeof chrome === 'undefined') {
        require('electron').ipcRenderer.on('globalShortcut', (event, message) => {
          if (message === 'right') {
            angularPlayer.nextTrack();
          } else if (message === 'left') {
            angularPlayer.prevTrack();
          }
        });
      }
    },
  ]);

  app.controller('InstantSearchController', ['$scope', '$http', '$timeout', '$rootScope', 'angularPlayer', 'loWeb',
    ($scope, $http, $timeout, $rootScope, angularPlayer, loWeb) => {
      // notice: douban is skipped so array should plus 1
      $scope.originpagelog = Array(getAllProviders().length+1).fill(1);  // [网易,虾米,QQ,NULL,酷狗,酷我,bilibili, migu]
      $scope.tab = 0;
      $scope.keywords = '';
      $scope.loading = false;
      $scope.curpagelog = $scope.originpagelog.slice(0);
      $scope.totalpagelog = $scope.originpagelog.slice(0);
      $scope.curpage = 1;
      $scope.totalpage = 1;

      function updateCurrentPage(cp) {
        if (cp === -1) { // when search words changes,pagenums should be reset.
          $scope.curpagelog = $scope.originpagelog.slice(0);
          $scope.curpage = 1;
        } else if (cp >= 0) {
          $scope.curpagelog[$scope.tab] = cp;
          $scope.curpage = $scope.curpagelog[$scope.tab];
        } else { // only tab changed
          $scope.curpage = $scope.curpagelog[$scope.tab];
        }
      }

      function updateTotalPage(totalItem) {
        if (totalItem === -1) {
          $scope.totalpagelog = $scope.originpagelog.slice(0);
          $scope.totalpage = 1;
        } else if (totalItem >= 0) {
          $scope.totalpage = Math.ceil(totalItem / 20);
          $scope.totalpagelog[$scope.tab] = $scope.totalpage;
        } else {
        // just switch tab
          $scope.totalpage = $scope.totalpagelog[$scope.tab];
        }
      }

      function performSearch() {
        $rootScope.$broadcast('search:keyword_change', $scope.keywords);
        loWeb.get(`/search?source=${getSourceName($scope.tab)}&keywords=${$scope.keywords}&curpage=${$scope.curpage}`).success((data) => {
          // update the textarea
          $scope.result = data.result;
          updateTotalPage(data.total);
          $scope.loading = false;
          // scroll back to top when finish searching
          $('.site-wrapper-innerd').scrollTop(0);
        });
      }

      $scope.changeSourceTab = (newTab) => {
        $scope.loading = true;
        $scope.tab = newTab;
        $scope.result = [];
        updateCurrentPage();
        updateTotalPage();

        if ($scope.keywords === '') {
          $scope.loading = false;
        } else {
          performSearch();
        }
      };

      $scope.isActiveTab = tab => ($scope.tab === tab);

      $scope.$watch('keywords', (tmpStr) => {
        updateCurrentPage(-1);
        updateTotalPage(-1);
        if (!tmpStr || tmpStr.length === 0) {
          $scope.result = [];
          return 0;
        }
        // if searchStr is still the same..
        // go ahead and retrieve the data
        if (tmpStr === $scope.keywords) {
          performSearch();
        }
        return 0;
      });

      $scope.nextPage = () => {
        $scope.curpagelog[$scope.tab] += 1;
        $scope.curpage = $scope.curpagelog[$scope.tab];
        performSearch();
      };

      $scope.previousPage = () => {
        $scope.curpagelog[$scope.tab] -= 1;
        $scope.curpage = $scope.curpagelog[$scope.tab];
        performSearch();
      };
    },
  ]);

  app.directive('pagination', () => ({
    restrict: 'EA',
    replace: false,
    template: ` <button class="btn btn-sm btn-pagination" ng-click="previousPage()" ng-disabled="curpage==1"> 上一页</button>
    <label> {{curpage}}/{{totalpage}} 页 </label>
    <button class="btn btn-sm btn-pagination" ng-click="nextPage()" ng-disabled="curpage==totalpage"> 下一页</button>`,
  }));

  app.directive('errSrc', () => ({
    // http://stackoverflow.com/questions/16310298/if-a-ngsrc-path-resolves-to-a-404-is-there-a-way-to-fallback-to-a-default
    link: (scope, element, attrs) => {
      element.bind('error', () => {
        if (attrs.src !== attrs.errSrc) {
          attrs.$set('src', attrs.errSrc);
        }
      });
      attrs.$observe('ngSrc', (value) => {
        if (!value && attrs.errSrc) {
          attrs.$set('src', attrs.errSrc);
        }
      });
    },
  }));

  app.directive('resize', $window => ((scope, element) => {
    const w = angular.element($window);
    const changeHeight = () => {
      const headerHeight = 90;
      const footerHeight = 90;
      element.css('height', `${w.height() - headerHeight - footerHeight}px`);
    };
    w.bind('resize', () => {
      changeHeight(); // when window size gets changed
    });
    changeHeight(); // when page loads
  }));

  app.directive('addAndPlay', ['angularPlayer', angularPlayer => ({
    restrict: 'EA',
    scope: {
      song: '=addAndPlay',
    },
    link(scope, element, attrs) {
      element.bind('click', (event) => {
        angularPlayer.addTrack(scope.song);
        angularPlayer.playTrack(scope.song.id);
      });
    },
  })]);

  app.directive('addWithoutPlay', ['angularPlayer', 'Notification', '$translate',
    (angularPlayer, Notification, $translate) => ({
      restrict: 'EA',
      scope: {
        song: '=addWithoutPlay',
      },
      link(scope, element, attrs) {
        element.bind('click', (event) => {
          angularPlayer.addTrack(scope.song);
          Notification.success($translate.instant('_ADD_TO_QUEUE_SUCCESS'));
        });
      },
    }),
  ]);

  app.directive('openUrl', ['angularPlayer', '$window',
    (angularPlayer, $window) => ({
      restrict: 'EA',
      scope: {
        url: '=openUrl',
      },
      link(scope, element, attrs) {
        element.bind('click', (event) => {
          if ((typeof chrome) === 'undefined') {
            // normal window for link
            const { BrowserWindow } = require('electron').remote;
            let win = new BrowserWindow({
              width: 1000,
              height: 670,
            });
            win.on('closed', () => {
              win = null;
            });
            win.loadURL(scope.url);
            return;
          }
          $window.open(scope.url, '_blank');
        });
      },
    }),
  ]);

  app.directive('windowControl', ['angularPlayer', '$window',
    (angularPlayer, $window) => ({
      restrict: 'EA',
      scope: {
        action: '@windowControl',
      },
      link(scope, element, attrs) {
        element.bind('click', (event) => {
          if ((typeof chrome) === 'undefined') {
            const { ipcRenderer } = require('electron');
            ipcRenderer.send('control', scope.action);
          }
        });
      },
    }),
  ]);

  app.directive('infiniteScroll', ['$window', '$rootScope',
    ($window, $rootScope) => ({
      restrict: 'EA',
      scope: {
        infiniteScroll: '&',
        contentSelector: '=contentSelector',
      },
      link(scope, elements, attrs) {
        elements.bind('scroll', (event) => {
          if (scope.loading) {
            return;
          }
          const containerElement = elements[0];
          const contentElement = document.querySelector(scope.contentSelector);

          const baseTop = containerElement.getBoundingClientRect().top;
          const currentTop = contentElement.getBoundingClientRect().top;
          const baseHeight = containerElement.offsetHeight;
          const offset = baseTop - currentTop;

          const bottom = offset + baseHeight;
          const height = contentElement.offsetHeight;

          const remain = height - bottom;
          if (remain < 0) {
            // page not shown
            return;
          }
          const offsetToload = 10;
          if (remain <= offsetToload) {
            // scope.$apply(scope.infiniteScroll);
            $rootScope.$broadcast('infinite_scroll:hit_bottom', '');
          }
        });
      },
    }),
  ]);

  app.directive('draggable', ['angularPlayer', '$document', '$rootScope',
    (angularPlayer, $document, $rootScope) => ((scope, element, attrs) => {
      let x;
      let container;
      const { mode } = attrs;

      function onMyMousedown() {
        if (mode === 'play') {
          scope.changingProgress = true;
        }
      }

      function onMyMouseup() {
        if (mode === 'play') {
          scope.changingProgress = false;
        }
      }

      function onMyUpdateProgress(progress) {
        if (mode === 'play') {
          $rootScope.$broadcast('track:myprogress', progress * 100);
        }
        if (mode === 'volume') {
          angularPlayer.adjustVolumeSlider(progress * 100);
          if (angularPlayer.getMuteStatus() === true) {
            angularPlayer.mute();
          }
        }
      }

      function onMyCommitProgress(progress) {
        if (mode === 'play') {
          if (angularPlayer.getCurrentTrack() === null) {
            return;
          }
          const sound = soundManager.getSoundById(angularPlayer.getCurrentTrack());
          const duration = sound.durationEstimate;
          sound.setPosition(progress * duration);
        }
        if (mode === 'volume') {
          const current = localStorage.getObject('player-settings');
          current.volume = progress * 100;
          localStorage.setObject('player-settings', current);
        }
      }

      function commitProgress(progress) {
        onMyCommitProgress(progress);
      }

      function updateProgress() {
        if (container) {
          if (x < 0) {
            x = 0;
          } else if (x > container.right - container.left) {
            x = container.right - container.left;
          }
        }
        const progress = x / (container.right - container.left);
        onMyUpdateProgress(progress);
      }

      function mousemove(event) {
        x = event.clientX - container.left;
        updateProgress();
      }

      function mouseup() {
        const progress = x / (container.right - container.left);
        commitProgress(progress);
        $document.off('mousemove', mousemove);
        $document.off('mouseup', mouseup);
        onMyMouseup();
      }

      element.on('mousedown', (event) => {
        onMyMousedown();
        container = document.getElementById(attrs.id).getBoundingClientRect();
        // Prevent default dragging of selected content
        event.preventDefault();
        x = event.clientX - container.left;
        updateProgress();
        $document.on('mousemove', mousemove);
        $document.on('mouseup', mouseup);
      });
    }),
  ]);

  app.controller('MyPlayListController', ['$http', '$scope', '$timeout',
    'angularPlayer', 'loWeb',
    ($http, $scope, $timeout, angularPlayer, loWeb) => {
      $scope.myplaylists = [];

      $scope.loadMyPlaylist = () => {
        loWeb.get('/show_myplaylist').success((data) => {
          $scope.myplaylists = data.result;
        });
      };

      $scope.$watch('current_tag', (newValue, oldValue) => {
        if (newValue !== oldValue) {
          if (newValue === '1') {
            $scope.myplaylists = [];
            $scope.loadMyPlaylist();
          }
        }
      });
      $scope.$on('myplaylist:update', (event, data) => {
        $scope.loadMyPlaylist();
      });
    },
  ]);

  app.controller('PlayListController', ['$http', '$scope', '$timeout',
    'angularPlayer', 'loWeb',
    ($http, $scope, $timeout, angularPlayer, loWeb) => {
      $scope.result = [];
      $scope.tab = 0;
      $scope.loading = true;

      $scope.changeTab = (newTab) => {
        $scope.tab = newTab;
        $scope.result = [];
        loWeb.get(`/show_playlist?source=${getSourceName($scope.tab)}`).success((data) => {
          $scope.result = data.result;
        });
      };


      $scope.$on('infinite_scroll:hit_bottom', (event, data) => {
        if ($scope.loading === true) {
          return;
        }
        $scope.loading = true;
        const offset = $scope.result.length;
        loWeb.get(`/show_playlist?source=${getSourceName($scope.tab)}&offset=${offset}`).success((res) => {
          $scope.result = $scope.result.concat(res.result);
          $scope.loading = false;
        });
      });

      $scope.isActiveTab = tab => ($scope.tab === tab);


      $scope.loadPlaylist = () => {
        loWeb.get(`/show_playlist?source=${getSourceName($scope.tab)}`).success((data) => {
          $scope.result = data.result;
          $scope.loading = false;
        });
      };
    },
  ]);
};

main();
