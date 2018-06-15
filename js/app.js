(function() {
  'use strict';

  Storage.prototype.setObject = function(key, value) {
      this.setItem(key, JSON.stringify(value));
  }

  Storage.prototype.getObject = function(key) {
      var value = this.getItem(key);
      return value && JSON.parse(value);
  }

  var app = angular.module('listenone', ['angularSoundManager', 'ui-notification', 'loWebManager', 'cfp.hotkeys', 'lastfmClient', 'githubClient'])

  app.config( [
    '$compileProvider',
    function( $compileProvider )
    {
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|moz-extension|file):/);
    }
  ]);

  app.config(function(NotificationProvider) {
    NotificationProvider.setOptions({
        delay: 2000,
        startTop: 20,
        startRight: 10,
        verticalSpacing: 20,
        horizontalSpacing: 20,
        positionX: 'center',
        positionY: 'top'
    });
  });

  app.config(function(hotkeysProvider) {
    hotkeysProvider.templateTitle = '快捷键列表';
    hotkeysProvider.cheatSheetDescription = '显示/隐藏快捷键列表';
  });

  app.config(function(lastfmProvider) {
    lastfmProvider.setOptions({
      apiKey: '6790c00a181128dc7c4ce06cd99d17c8',
      apiSecret: 'd68f1dfc6ff43044c96a79ae7dfb5c27'
    });
  });


  app.run(['angularPlayer', 'Notification', 'loWeb', function(angularPlayer, Notification, loWeb) {
    angularPlayer.setBootstrapTrack(
      loWeb.bootstrapTrack(
        function(){},
        function(){
          Notification.info('版权原因无法播放，请搜索其他平台');
        })
    );
  }]);

  app.filter('playmode_title', function() {
    return function(input) {
      switch(input){
        case 0:
            return "顺序";
            break;
        case 1:
            return "随机";
            break;
        case 2:
            return "单曲循环";
            break;
      }
    };
  });

  function getSourceName(sourceId) {
    if (sourceId == 0) {
      return 'netease';
    }
    if (sourceId == 1) {
      return 'xiami';
    }
    if (sourceId == 2) {
      return 'qq';
    }
    if (sourceId == 4) {
      return 'kugou';
    }
    if (sourceId == 5) {
      return 'kuwo';
    }
  }

  // control main view of page, it can be called any place
  app.controller('NavigationController', ['$scope', '$http',
    '$httpParamSerializerJQLike', '$timeout',
    'angularPlayer', 'Notification', '$rootScope', 'loWeb',
    'hotkeys', 'lastfm', 'github', 'gist',
    function($scope, $http, $httpParamSerializerJQLike,
      $timeout, angularPlayer, Notification, $rootScope,
      loWeb, hotkeys, lastfm, github, gist) {

    $rootScope.page_title = "Listen 1";
    $scope.window_url_stack = [];
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

    $scope.$on('isdoubanlogin:update', function(event, data) {
      $scope.isDoubanLogin = data;
    });

    // tag
    $scope.showTag = function(tag_id){
      $scope.current_tag = tag_id;
      $scope.is_window_hidden = 1;
      $scope.window_url_stack = [];
      $scope.closeWindow();
    };

    // playlist window
    $scope.resetWindow = function() {
      $scope.cover_img_url = 'images/loading.gif';
      $scope.playlist_title = '';
      $scope.playlist_source_url = '';
      $scope.songs = [];
      $scope.window_type = 'list';
    };

    $scope.showWindow = function(url){
      if ($scope.window_url_stack.length > 0 &&  $scope.window_url_stack[$scope.window_url_stack.length-1] == url) {
        return;
      }
      $scope.is_window_hidden = 0;
      $scope.resetWindow();

      if ($scope.window_url_stack.length > 0 && $scope.window_url_stack[$scope.window_url_stack.length-1] == '/now_playing') {
        // if now playing is top, pop it
        $scope.window_url_stack.splice(-1,1);
      }

      if (url == '/now_playing') {
        $scope.window_type = 'track';
        $scope.window_url_stack.push(url);
        return;
      }
      $scope.window_url_stack.push(url);

      loWeb.get(url).success(function(data) {
          if (data.status == '0') {
            Notification.info(data.reason);
            $scope.popWindow();
            return;
          }
          $scope.songs = data.tracks;
          $scope.cover_img_url = data.info.cover_img_url;
          $scope.playlist_title = data.info.title;
          $scope.playlist_source_url = data.info.source_url;
          $scope.list_id = data.info.id;
          $scope.is_mine = (data.info.id.slice(0,2) == 'my');
          $scope.window_type = 'list';
      });
    };

    $scope.closeWindow = function(){
      $scope.is_window_hidden = 1;
      $scope.resetWindow();
      $scope.window_url_stack = [];
    };

    $scope.popWindow = function() {
      $scope.window_url_stack.pop();
      if($scope.window_url_stack.length === 0) {
        $scope.closeWindow();
      }
      else {
        $scope.resetWindow();
        var url = $scope.window_url_stack[$scope.window_url_stack.length-1];

        if (url == '/now_playing') {
          $scope.window_type = 'track';
          return;
        }
        loWeb.get(url).success(function(data) {
            $scope.songs = data.tracks;
            $scope.list_id = data.info.id;
            $scope.cover_img_url = data.info.cover_img_url;
            $scope.playlist_title = data.info.title;
            $scope.playlist_source_url = data.info.source_url;
            $scope.is_mine = (data.info.id.slice(0,2) == 'my');
        });
      }
    };

    $scope.showPlaylist = function(list_id) {
      var url = '/playlist?list_id=' + list_id;
      $scope.showWindow(url);
    };

    $scope.directplaylist = function(list_id){
      var url = '/playlist?list_id=' + list_id;

      loWeb.get(url).success(function(data) {
          $scope.songs = data.tracks;
          $scope.current_list_id = list_id;

          $timeout(function(){
            // use timeout to avoid stil in digest error.
            angularPlayer.clearPlaylist(function(data) {
              //add songs to playlist
              angularPlayer.addTrackArray($scope.songs);
              //play first song
              var index = 0;
              if (angularPlayer.getShuffle()) {
                var max = $scope.songs.length - 1;
                var min = 0;
                index = Math.floor(Math.random() * (max - min + 1)) + min;
              }
              angularPlayer.playTrack($scope.songs[index].id);

            });
          }, 0);
      });
    };

    $scope.showDialog = function(dialog_type, data) {
      $scope.is_dialog_hidden = 0;
      var dialogWidth = 480;
      var left = $(window).width()/2 - dialogWidth/2;
      $scope.myStyle = {'left':  left + 'px'};

      if (dialog_type == 0) {
        $scope.dialog_title = '添加到歌单';
        var url = '/show_myplaylist';
        $scope.dialog_song = data;
        loWeb.get(url).success(function(data) {
            $scope.myplaylist = data.result;
        });
      }

      if (dialog_type == 2) {
        $scope.dialog_title = '登录豆瓣';
        $scope.dialog_type = 2;
      }

      if (dialog_type == 3) {
        $scope.dialog_title = '修改歌单';
        $scope.dialog_type = 3;
        $scope.dialog_cover_img_url = data.cover_img_url;
        $scope.dialog_playlist_title = data.playlist_title;
      }
      if (dialog_type == 4) {
        $scope.dialog_title = '连接到Last.fm';
        $scope.dialog_type = 4;
      }
      if (dialog_type == 5) {
        $scope.dialog_title = '打开歌单';
        $scope.dialog_type = 5;
      }
	    if (dialog_type == 6) {
        $scope.dialog_title = '歌单导入合并';
		    var url = '/show_myplaylist';
        loWeb.get(url).success(function(data) {
            $scope.myplaylist = data.result;
        });
        $scope.dialog_type = 6;
      }
      if (dialog_type == 7) {
        $scope.dialog_title = '连接到Github.com';
        $scope.dialog_type = 7;
      }
      if (dialog_type == 8) {
        $scope.dialog_title = '导出到Github Gist';
        $scope.dialog_type = 8;
        gist.listExistBackup().then(function(res){
          $scope.myBackup = res;
        }, function(err){
          $scope.myBackup = [];
        });
      }
      if (dialog_type == 10) {
        $scope.dialog_title = '从Github Gist导入';
        $scope.dialog_type = 10;
        gist.listExistBackup().then(function(res){
          $scope.myBackup = res;
        }, function(err){
          $scope.myBackup = [];
        });
      }
    };

    $scope.chooseDialogOption = function(option_id) {
      var url = '/add_myplaylist';
      loWeb.post({
        url: url,
        method: 'POST',
        data: $httpParamSerializerJQLike({
          list_id: option_id,
          track: JSON.stringify($scope.dialog_song)
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }).success(function() {
        Notification.success('添加到歌单成功');
        $scope.closeDialog();
        // add to current playing list
        if (option_id == $scope.current_list_id) {
          angularPlayer.addTrack($scope.dialog_song);
        }
      });
    };

    $scope.newDialogOption = function(option) {
      $scope.dialog_type = option;
    };

    $scope.cancelNewDialog = function(option) {
      $scope.dialog_type = option;
    };

    $scope.createAndAddPlaylist = function() {
      var url = '/create_myplaylist';

      loWeb.post({
        url: url,
        method: 'POST',
        data: $httpParamSerializerJQLike({
          list_title: $scope.newlist_title,
          track: JSON.stringify($scope.dialog_song)
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }).success(function() {
        $rootScope.$broadcast('myplaylist:update');
        Notification.success('添加到歌单成功');
        $scope.closeDialog();
      });
    };

    $scope.editMyPlaylist = function() {
      var url = '/edit_myplaylist';

      loWeb.post({
        url: url,
        method: 'POST',
        data: $httpParamSerializerJQLike({
          list_id: $scope.list_id,
          title: $scope.dialog_playlist_title,
          cover_img_url: $scope.dialog_cover_img_url
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }).success(function() {
        $rootScope.$broadcast('myplaylist:update');
        $scope.playlist_title = $scope.dialog_playlist_title;
        $scope.cover_img_url = $scope.dialog_cover_img_url;
        Notification.success('修改歌单成功');
        $scope.closeDialog();
      });
    };

	$scope.mergePlaylist = function(target_list_id) {
	  Notification.info('正在合并导入歌单……');
      var url = '/merge_playlist';
      loWeb.post({
        url: url,
        method: 'POST',
        data: $httpParamSerializerJQLike({
          source: $scope.list_id,
          target: target_list_id,
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }).success(function() {
        Notification.success('合并歌单成功');
        $scope.closeDialog();
		$scope.popWindow();
		$scope.showPlaylist($scope.list_id);
      });
    };

    $scope.removeSongFromPlaylist = function(song, list_id) {
      var url = '/remove_track_from_myplaylist';

      loWeb.post({
        url: url,
        method: 'POST',
        data: $httpParamSerializerJQLike({
          list_id: list_id,
          track_id: song.id
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }).success(function() {
        // remove song from songs
        var index = $scope.songs.indexOf(song);
        if (index > -1) {
          $scope.songs.splice(index, 1);
        }
        Notification.success('删除成功');
      });
    }

    $scope.closeDialog = function() {
      $scope.is_dialog_hidden = 1;
      $scope.dialog_type = 0;
      // update lastfm status if not authorized
      if (lastfm.isAuthRequested()) {
        lastfm.updateStatus();
      }
    };

    $scope.setCurrentList = function(list_id) {
      $scope.current_list_id = list_id;
    };

    $scope.playMylist = function(list_id){
      $timeout(function(){
        angularPlayer.clearPlaylist(function(data) {
          //add songs to playlist
          angularPlayer.addTrackArray($scope.songs);
          var index = 0;
          if (angularPlayer.getShuffle()) {
            var max = $scope.songs.length - 1;
            var min = 0;
            index = Math.floor(Math.random() * (max - min + 1)) + min;
          }
          //play first song
          angularPlayer.playTrack($scope.songs[index].id);
        });
      }, 0);
      $scope.setCurrentList(list_id);
    };

    $scope.addMylist = function(list_id){
      $timeout(function(){
        //add songs to playlist
        angularPlayer.addTrackArray($scope.songs);
        Notification.success("添加到当前播放成功");
      }, 0);
    };

    $scope.copyrightNotice = function() {
      Notification.info("版权原因无法播放，请搜索其他平台");
    };

    $scope.clonePlaylist = function(list_id){
      var url = '/clone_playlist';
      loWeb.post({
        url: url,
        method: 'POST',
        data: $httpParamSerializerJQLike({
          list_id: list_id,
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }).success(function() {
        $rootScope.$broadcast('myplaylist:update');
        $scope.closeWindow();
        Notification.success('收藏到我的歌单成功');
      });
    };

    $scope.removeMyPlaylist = function(list_id){
      var url = '/remove_myplaylist';

      loWeb.post({
        url: url,
        method: 'POST',
        data: $httpParamSerializerJQLike({
          list_id: list_id,
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }).success(function() {
        $rootScope.$broadcast('myplaylist:update');
        $scope.closeDialog();
        $scope.closeWindow();
        Notification.success('删除歌单成功');
      });
    };


    $scope.downloadFile = function (fileName, fileType, content) {
        window.URL = window.URL || window.webkitURL;
        var blob = new Blob([content], {type: fileType});
        var link = document.createElement('a');
        link.download = fileName;
        link.href = window.URL.createObjectURL(blob);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        link.remove();
    }

    $scope.backupMySettings = function() {
      var items = {};
      for ( var i = 0, len = localStorage.length; i < len; ++i ) {
        var key =  localStorage.key(i);
        var value = localStorage.getObject(key);
        items[key] = value;
      }

      var content = JSON.stringify(items);
      $scope.downloadFile('listen1_backup.json', 'application/json', content);
    }

    $scope.importMySettings = function(event) {
      var fileObject = event.target.files[0];
      if (fileObject == null ){
        Notification.warning("请选择备份文件");
        return;
      }
      var reader = new FileReader();
      reader.onloadend = function(readerEvent) {
        if (readerEvent.target.readyState == FileReader.DONE) {
          var data_json = readerEvent.target.result;
          // parse json
          var data = null;
          try{
              data = JSON.parse(data_json);
          }catch(e){
          }
          if(data == null) {
            Notification.warning("备份文件格式错误，请重新选择");
            return;
          }
          for ( var key in data) {
            var value = data[key];
            localStorage.setObject(key, value);
          }
          Notification.success("成功导入我的歌单");
        }
      };
      reader.readAsText(fileObject);
    }

    $scope.gistBackupLoading = false;
    $scope.backupMySettings2Gist= function(gistId, isPublic){
      var items = {};
      for ( var i = 0; i < localStorage.length; i++ ) {
        var key =  localStorage.key(i);
        if(key!=="gistid" && key !== 'githubOauthAccessKey'){ // avoid token leak
          var value = localStorage.getObject(key);
          items[key] = value;
        }
      }
      var gistFiles = gist.json2gist(items);
      $scope.gistBackupLoading = true;
      gist.backupMySettings2Gist(gistFiles, gistId, isPublic).then(function(){
        Notification.clearAll();
        Notification.success("成功导出我的歌单到Gist");
        $scope.gistBackupLoading = false;
      },function(err){
        Notification.clearAll();
        Notification.warning("导出我的歌单失败，检查后重试");
        $scope.gistBackupLoading = false;
      });
      Notification({message: "正在导出我的歌单到Gist...", delay: null});
    }

    $scope.gistRestoreLoading = false;
    $scope.importMySettingsFromGist = function(gistId){
      $scope.gistRestoreLoading = true;
      gist.importMySettingsFromGist(gistId).then(function(raw){
        var data = gist.gist2json(raw);
        for ( var key in data) {
          var value = data[key];
          localStorage.setObject(key, value);
        }
        Notification.clearAll();
        Notification.success("导入我的歌单成功");
        $scope.gistRestoreLoading = false;
      },function(err){
        Notification.clearAll();
        if(err==404){
          Notification.warning("未找到备份歌单，请先备份");
        }else{
          Notification.warning("导入我的歌单失败，检查后重试");
        }
        $scope.gistRestoreLoading = false;
      })
      Notification({message: "正在从Gist导入我的歌单...", delay: null});
    }


    $scope.showShortcuts = function() {
      hotkeys.toggleCheatSheet();
    }

    hotkeys.add({
      combo: 'f',
      description: '快速搜索',
      callback: function() {
        $scope.showTag(3);
        $timeout(function(){$("#search-input").focus();}, 0);
      }
    });

    $scope.openUrl = function(url) {
      loWeb.post({
        url: '/parse_url',
        method: 'POST',
        data: $httpParamSerializerJQLike({
          url: url
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }).success(function(data) {
        var result = data.result;
        if (result !== undefined) {
          $scope.showPlaylist(result.id);
        }
        else {
          Notification.info('未能打开输入的歌单地址');
        }
      });
    }

  }]);

  app.directive('customOnChange', function() {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        var onChangeHandler = scope.$eval(attrs.customOnChange);
        element.bind('change', onChangeHandler);
      }
    };
  });

  app.directive('volumeWheel', function() {
    return function (scope, element, attrs) {
        element.bind('mousewheel', function(){
          scope.adjustVolume(window.event.wheelDelta>0)
        });
    };
  });

  app.controller('PlayController', ['$scope', '$timeout','$log',
    '$anchorScroll', '$location', 'angularPlayer', '$http',
    '$httpParamSerializerJQLike','$rootScope', 'Notification',
    'loWeb', 'hotkeys', 'lastfm',
     function($scope, $timeout, $log, $anchorScroll, $location,
      angularPlayer, $http, $httpParamSerializerJQLike,
      $rootScope, Notification, loWeb, hotkeys, lastfm){

      $scope.menuHidden = true;
      $scope.volume = angularPlayer.getVolume();
      $scope.mute = angularPlayer.getMuteStatus();
      $scope.settings = {"playmode": 0, "nowplaying_track_id": -1};
      $scope.lyricArray = [];
      $scope.lyricLineNumber = -1;
      $scope.lastTrackId = null;

      $scope.scrobbleTrackId = null;
      $scope.scrobbleTimer = new Timer();
      $scope.adjustVolume = angularPlayer.adjustVolume;

      function switchMode(mode){
        //playmode 0:loop 1:shuffle 2:repeat one
        switch(mode){
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
              break
        }
      }

      $scope.loadLocalSettings = function() {
        var defaultSettings = {"playmode": 0, "nowplaying_track_id": -1, "volume": 90};
        var localSettings = localStorage.getObject('player-settings');
        if (localSettings == null) {
          $scope.settings = defaultSettings;
          $scope.saveLocalSettings();
        }
        else {
          $scope.settings = localSettings;
        }
        // apply settings
        switchMode($scope.settings.playmode);


        $scope.volume = $scope.settings.volume;
        if($scope.volume == null) {
          $scope.volume = 90;
          $scope.saveLocalSettings();
        }
        else {
          $timeout(function(){angularPlayer.adjustVolumeSlider($scope.volume)},0);
        }
      }

      $scope.saveLocalSettings = function() {
        localStorage.setObject('player-settings', $scope.settings);
      }

      $scope.loadLocalCurrentPlaying = function() {
        var localSettings = localStorage.getObject('current-playing');
        if (localSettings == null) {
          return;
        }
        // apply local current playing;
        angularPlayer.addTrackArray(localSettings);
      }

      $scope.saveLocalCurrentPlaying = function() {
        localStorage.setObject('current-playing', angularPlayer.playlist)
      }

      $scope.changePlaymode = function() {
        var playmodeCount = 3;
        $scope.settings.playmode = ($scope.settings.playmode+1)%playmodeCount;
        switchMode($scope.settings.playmode);
        $scope.saveLocalSettings();
      };

      $scope.$on('music:volume', function(event, data) {
          $scope.$apply(function() {
              $scope.volume = data;
          });
      });

      $scope.$on('github:status', function(event, data) {
          $scope.$apply(function() {
              $scope.githubStatus = data;
          });
      });

      $scope.$on('angularPlayer:ready', function(event, data) {
        $log.debug('cleared, ok now add to playlist');
        if (angularPlayer.getRepeatStatus() == false) {
            angularPlayer.repeatToggle();
        }

        if (track_id == -1) {
          return;
        }

        //add songs to playlist
        var localCurrentPlaying = localStorage.getObject('current-playing');
        if (localCurrentPlaying == null) {
          return;
        }
        angularPlayer.addTrackArray(localCurrentPlaying);

        var localPlayerSettings = localStorage.getObject('player-settings');
        if (localPlayerSettings == null) {
          return;
        }
        var track_id = localPlayerSettings.nowplaying_track_id;

        angularPlayer.loadTrack(track_id);

      });

      $scope.gotoAnchor = function(newHash) {
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

      $scope.togglePlaylist = function() {
        var anchor = "song" + angularPlayer.getCurrentTrack();
        $scope.menuHidden = !$scope.menuHidden;
        if (!$scope.menuHidden) {
          $scope.gotoAnchor(anchor);
        }
      };

      $scope.toggleMuteStatus = function() {
        // mute function is indeed toggle mute status.
        angularPlayer.mute();
      }

      $scope.myProgress = 0;
      $scope.changingProgress = false;

      $rootScope.$on('track:progress', function(event, data) {
          if ($scope.changingProgress == false) {
            $scope.myProgress = data;
          }
      });

      $rootScope.$on('track:myprogress', function(event, data) {
        $scope.$apply(function() {
          // should use apply to force refresh ui
          $scope.myProgress = data;
        });
      });

      $scope.$on('music:mute', function (event, data) {
        $scope.mute = data;
      });

      $scope.$on('player:playlist', function(event, data) {
        localStorage.setObject('current-playing', data);
      });


      $scope.$on('currentTrack:duration', function(event, data) {
        if (!lastfm.isAuthorized()) {
          return;
        }
        if (data == 0) {
          return;
        }
        if ($scope.scrobbleTrackId == angularPlayer.getCurrentTrack()) {
          return;
        }
        // new song arrives
        $scope.scrobbleTrackId = angularPlayer.getCurrentTrack();
        var track = angularPlayer.getTrack($scope.scrobbleTrackId);
        var startTimestamp = Math.round((new Date()).valueOf() / 1000);
        $scope.scrobbleTimer.start(function(){
          lastfm.scrobble(startTimestamp, track.title, track.artist, track.album, function(){});
        });
        // according to scrobble rule
        // http://www.last.fm/api/scrobbling
        var secondsToScrobble = Math.min(data/1000/2, 60*4);
        $scope.scrobbleTimer.update(secondsToScrobble);
      });

      $scope.$on('music:isPlaying', function(event, data) {
        if (data) {
          $rootScope.page_title = '▶ ' + $rootScope.page_title.slice($rootScope.page_title.indexOf(' '));
        }
        else {
          $rootScope.page_title = '❚❚ ' + $rootScope.page_title.slice($rootScope.page_title.indexOf(' '));
        };
        if (!lastfm.isAuthorized()) {
          return;
        }
        if ($scope.scrobbleTrackId == null) {
          return;
        }
        if (data) {
          $scope.scrobbleTimer.resume();
        }
        else {
          $scope.scrobbleTimer.pause();
        };
      });

      function parseLyric(lyric) {
        var lines = lyric.split('\n');
        var result = [];
        var timeResult = [];
        var timeRegResult = null;

        function rightPadding(str, length, padChar) {
            var newstr = str;
            for (var i=0; i< length - str.length; i++) {
              newstr += padChar;
            }
            return newstr;
        }

        for (var i=0; i<lines.length; i++) {
          var line = lines[i];
          var tagReg = /\[\D*:([^\]]+)\]/g;
          var tagRegResult = tagReg.exec(line);
          if (tagRegResult) {
            var lyricObject = {};
            lyricObject.seconds = 0;
            lyricObject.content = tagRegResult[1];
            result.push(lyricObject);
            continue;
          }

          var timeReg = /\[(\d{2,})\:(\d{2})(?:\.(\d{1,3}))?\]/g;

          while(timeRegResult = timeReg.exec(line)) {
            var content = line.replace(/\[(\d{2,})\:(\d{2})(?:\.(\d{1,3}))?\]/g, '');
            var min = parseInt(timeRegResult[1]);
            var sec = parseInt(timeRegResult[2]);
            var microsec = 0;
            if (timeRegResult[3] != null) {
              microsec = parseInt(rightPadding(timeRegResult[3], 3, '0'));
            }
            var seconds = min * 60 * 1000 + sec*1000 + microsec;
            var lyricObject = {};
            lyricObject.content = content;
            lyricObject.seconds = seconds;
            timeResult.push(lyricObject);
          }
        }

        // sort time line
        timeResult.sort(function(a, b){
            var keyA = a.seconds,
                keyB = b.seconds;
            // Compare the 2 dates
            if(keyA < keyB) return -1;
            if(keyA > keyB) return 1;
            return 0;
        });

        // disable tag info, because music provider always write
        // tag info in lyric timeline.
        //result.push.apply(result, timeResult);
        result = timeResult;

        for (var i=0; i<result.length; i++) {
          result[i].lineNumber = i;
        }

        return result;
      }


      $scope.$on('track:id', function(event, data) {
        if ($scope.lastTrackId == data) {
          return;
        }
        var current = localStorage.getObject('player-settings');
        current.nowplaying_track_id = data;
        localStorage.setObject('player-settings', current);
        // update lyric
        $scope.lyricArray = [];
        $scope.lyricLineNumber = -1;
        $(".lyric").animate({ scrollTop: "0px" }, 500);
        var url = '/lyric?track_id=' + data;
        var track = angularPlayer.getTrack(data);

        $rootScope.page_title = '▶ ' + track.title + ' - ' + track.artist;
        if (lastfm.isAuthorized()) {
          lastfm.sendNowPlaying(track.title, track.artist, function(){});
        }

        if (track.lyric_url != null) {
          url = url + '&lyric_url=' + track.lyric_url;
        }
        loWeb.get(url).success(function(data) {
          var lyric = data.lyric;
          if (lyric == null) {
            return;
          }
          $scope.lyricArray = parseLyric(lyric);
        });
        $scope.lastTrackId = data;
      });

      $scope.$on('currentTrack:position', function(event, data) {
        // update lyric position
        var currentSeconds = data;
        var lastObject = null;
        for (var i=0; i< $scope.lyricArray.length; i++) {
          var lyricObject = $scope.lyricArray[i];
          if (currentSeconds < lyricObject.seconds) {
            break;
          }
          lastObject = lyricObject;
        }
        if (lastObject && lastObject.lineNumber != $scope.lyricLineNumber) {
          var lineHeight = 20;
          var lineElement = $(".lyric p")[lastObject.lineNumber];
          var windowHeight = 270;
          var AdditionOffset = 4;
          var offset = lineElement.offsetTop - windowHeight/2 + AdditionOffset;
          $(".lyric").animate({ scrollTop: offset+"px" }, 500);
          $scope.lyricLineNumber = lastObject.lineNumber;
        }
      });

      // define keybind
      hotkeys.add({
        combo: 'p',
        description: '播放/暂停',
        callback: function() {
          if(angularPlayer.isPlayingStatus()) {
              //if playing then pause
              angularPlayer.pause();
          } else {
              //else play if not playing
              angularPlayer.play();
          }
        }
      });

      hotkeys.add({
        combo: '[',
        description: '上一首',
        callback: function() {
          angularPlayer.prevTrack();
        }
      });

      hotkeys.add({
        combo: ']',
        description: '下一首',
        callback: function() {
          angularPlayer.nextTrack();
        }
      });

      hotkeys.add({
        combo: 'm',
        description: '静音/取消静音',
        callback: function() {
          // mute indeed toggle mute status
          angularPlayer.mute();
        }
      });

      hotkeys.add({
        combo: 'l',
        description: '打开/关闭播放列表',
        callback: function() {
          $scope.togglePlaylist();
        }
      });

      hotkeys.add({
        combo: 's',
        description: '切换播放模式（顺序/随机/单曲循环）',
        callback: function() {
          $scope.changePlaymode();
        }
      });

      hotkeys.add({
        combo: 'u',
        description: '音量增加',
        callback: function() {
          $timeout(function(){angularPlayer.adjustVolume(true);});
        }
      });

      hotkeys.add({
        combo: 'd',
        description: '音量减少',
        callback: function() {
          $timeout(function(){angularPlayer.adjustVolume(false);});
        }
      });
  }]);

  app.controller('InstantSearchController', ['$scope', '$http', '$timeout', 'angularPlayer', 'loWeb',
    function($scope, $http, $timeout, angularPlayer, loWeb) {
      $scope.originpagelog = [1, 1, 1, 1, 1, 1];  // [网易,虾米,QQ,NULL,酷狗,酷我]
      $scope.tab = 0;
      $scope.keywords = '';
      $scope.loading = false;
      $scope.curpagelog = $scope.originpagelog.slice(0);
      $scope.totalpagelog = $scope.originpagelog.slice(0);
      $scope.curpage = 1;
      $scope.totalpage = 1;

      $scope.changeTab = function(newTab){
        $scope.loading = true;
        $scope.tab = newTab;
        $scope.result = [];
        updateCurrentPage();
        updateTotalPage();

        if ($scope.keywords===''){
          $scope.loading = false;
        }else{
          performSearch();
        }
      };

      $scope.isActiveTab = function(tab){
        return $scope.tab === tab;
      };

      $scope.$watch('keywords', function (tmpStr) {
        updateCurrentPage(-1);
        updateTotalPage(-1);
        if (!tmpStr || tmpStr.length === 0){
          $scope.result = [];
          return 0;
        }
        // if searchStr is still the same..
        // go ahead and retrieve the data
        if (tmpStr === $scope.keywords)
        {
          performSearch();
        }
      });

      function performSearch(){
        loWeb.get('/search?source=' + getSourceName($scope.tab) + '&keywords=' + $scope.keywords+'&curpage='+ $scope.curpage).success(function(data) {
          // update the textarea
          $scope.result = data.result;
          updateTotalPage(data.total);
          $scope.loading = false;
          // scroll back to top when finish searching
          $('.site-wrapper-innerd').scrollTop(0);
        });
      }

      function updateCurrentPage(cp){
          if(cp === -1){  // when search words changes,pagenums should be reset.
              $scope.curpagelog = $scope.originpagelog.slice(0);
              $scope.curpage = 1;
          }
          else if(cp >= 0)
              $scope.curpage = $scope.curpagelog[$scope.tab] = cp;
          else  // only tab changed
              $scope.curpage = $scope.curpagelog[$scope.tab];
      }

      function updateTotalPage(totalItem){
          if(totalItem === -1) {
              $scope.totalpagelog = $scope.originpagelog.slice(0);
              $scope.totalpage = 1;
          }
          else if(totalItem >=0)
            $scope.totalpage=$scope.totalpagelog[$scope.tab] = Math.ceil(totalItem/20);
          else
            //just switch tab
              $scope.totalpage=$scope.totalpagelog[$scope.tab];
      }

      $scope.nextPage = function(){
        $scope.curpage = $scope.curpagelog[$scope.tab] += 1;
        performSearch();
      }

      $scope.previousPage = function(){
          $scope.curpage = $scope.curpagelog[$scope.tab] -= 1;
          performSearch();
      }
  }]);

  app.directive('pagination',function(){
    return {
      restrict: "EA",
      replace:false,
      template: ' <button class="btn btn-sm btn-pagination" ng-click="previousPage()" ng-disabled="curpage==1"> 上一页</button>\
     <label> {{curpage}}/{{totalpage}} 页 </label>\
     <button class="btn btn-sm btn-pagination" ng-click="nextPage()" ng-disabled="curpage==totalpage"> 下一页</button>',
  }
});

  app.directive('errSrc', function() {
    // http://stackoverflow.com/questions/16310298/if-a-ngsrc-path-resolves-to-a-404-is-there-a-way-to-fallback-to-a-default
    return {
      link: function(scope, element, attrs) {
        element.bind('error', function() {
          if (attrs.src != attrs.errSrc) {
            attrs.$set('src', attrs.errSrc);
          }
        });
        attrs.$observe('ngSrc', function(value) {
          if (!value && attrs.errSrc) {
            attrs.$set('src', attrs.errSrc);
          }
        });
      }
    }
  });

  app.directive('resize', function ($window) {
    return function (scope, element) {
      var w = angular.element($window);
          var changeHeight = function(){
            var headerHeight = 90;
            var footerHeight = 90;
            element.css('height', (w.height() - headerHeight - footerHeight) + 'px' );
          };
        w.bind('resize', function () {
            changeHeight();   // when window size gets changed
      });
          changeHeight(); // when page loads
    };
  });

  app.directive('addAndPlay', ['angularPlayer', function (angularPlayer) {
        return {
            restrict: "EA",
            scope: {
                song: "=addAndPlay"
            },
            link: function (scope, element, attrs) {
                element.bind('click', function (event) {
                    angularPlayer.addTrack(scope.song);
                    angularPlayer.playTrack(scope.song.id);
                });
            }
        };
    }]);

  app.directive('addWithoutPlay', ['angularPlayer', 'Notification',
    function (angularPlayer, Notification) {
        return {
            restrict: "EA",
            scope: {
                song: "=addWithoutPlay"
            },
            link: function (scope, element, attrs) {
                element.bind('click', function (event) {
                    angularPlayer.addTrack(scope.song);
                    Notification.success("已添加到当前播放歌单");
                });
            }
        };
    }]);

  app.directive('openUrl', ['angularPlayer', '$window',
    function (angularPlayer, $window) {
      return {
          restrict: "EA",
          scope: {
              url: "=openUrl"
          },
          link: function (scope, element, attrs) {
              element.bind('click', function (event) {
                $window.open(scope.url, '_blank');
              });
          }
      };
  }]);

  app.directive('infiniteScroll', ['$window',
    function ($window) {
      return {
          restrict: "EA",
          scope: {
              infiniteScroll: '&',
              contentSelector: '=contentSelector'
          },
          link: function (scope, elements, attrs) {
              elements.bind('scroll', function (event) {
                if (scope.loading) {
                  return;
                }
                var containerElement = elements[0];
                var contentElement = document.querySelector(scope.contentSelector);

                var baseTop = containerElement.getBoundingClientRect().top;
                var currentTop = contentElement.getBoundingClientRect().top;
                var baseHeight = containerElement.offsetHeight;
                var offset = baseTop - currentTop;

                var bottom = offset + baseHeight;
                var height = contentElement.offsetHeight;

                var remain = height - bottom;
                var offsetToload = 10;
                if (remain <= offsetToload) {
                  scope.$apply(scope.infiniteScroll);
                }
              });
          }
      };
  }]);

  app.directive('draggable', ['angularPlayer', '$document', '$rootScope',
      function(angularPlayer, $document, $rootScope) {
    return function(scope, element, attrs) {
      var x;
      var container;
      var mode = attrs.mode;

      function onMyMousedown() {
        if(mode == 'play') {
          scope.changingProgress = true;
        }
      }

      function onMyMouseup() {
        if(mode == 'play') {
          scope.changingProgress = false;
        }
      }

      function onMyUpdateProgress(progress) {
        if(mode == 'play') {
          $rootScope.$broadcast('track:myprogress', progress*100);
        }
        if(mode == 'volume') {
          angularPlayer.adjustVolumeSlider(progress*100);
          if (angularPlayer.getMuteStatus() == true) {
            angularPlayer.mute();
          }
        }
      }

      function onMyCommitProgress(progress) {
        if(mode == 'play') {
          if (angularPlayer.getCurrentTrack() === null) {
            return;
          }
          var sound = soundManager.getSoundById(angularPlayer.getCurrentTrack());
          var duration = sound.durationEstimate;
          sound.setPosition(progress * duration);
        }
        if (mode == 'volume') {
          var current = localStorage.getObject('player-settings');
          current.volume = progress*100;
          localStorage.setObject('player-settings', current);
        }
      }

      element.on('mousedown', function(event) {
        onMyMousedown();
        container = document.getElementById(attrs.id).getBoundingClientRect();
        // Prevent default dragging of selected content
        event.preventDefault();
        x = event.clientX - container.left;
        updateProgress();
        $document.on('mousemove', mousemove);
        $document.on('mouseup', mouseup);

      });

      function mousemove(event) {
        x = event.clientX - container.left;
        updateProgress();
      }

      function mouseup() {
        var progress = x / (container.right - container.left);
        commitProgress(progress);
        $document.off('mousemove', mousemove);
        $document.off('mouseup', mouseup);
        onMyMouseup();
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
        var progress = x / (container.right - container.left);
        onMyUpdateProgress(progress);
      }
    };
  }]);

  app.controller('MyPlayListController', ['$http','$scope', '$timeout',
        'angularPlayer', 'loWeb',
        function($http, $scope, $timeout, angularPlayer, loWeb){
    $scope.myplaylists = [];

    $scope.loadMyPlaylist = function(){
      loWeb.get('/show_myplaylist').success(function(data) {
        $scope.myplaylists = data.result;
      });
    };

    $scope.$watch('current_tag', function(newValue, oldValue) {
        if (newValue !== oldValue) {
          if (newValue == '1') {
            $scope.myplaylists = [];
            $scope.loadMyPlaylist();
          }
        }
    });
    $scope.$on('myplaylist:update', function(event, data) {
      $scope.loadMyPlaylist();
    });

  }]);

  app.controller('PlayListController', ['$http','$scope', '$timeout',
                                        'angularPlayer','loWeb',
                                        function($http, $scope, $timeout, angularPlayer, loWeb){
    $scope.result = [];
    $scope.tab = 0;
    $scope.loading = true

    $scope.changeTab = function(newTab){
      $scope.tab = newTab;
      $scope.result = [];
      loWeb.get('/show_playlist?source=' + getSourceName($scope.tab)).success(function(data) {
        $scope.result = data.result;
      });
    };

    $scope.scrolling = function(){
        if ($scope.loading == true) {
            return
        }
        $scope.loading = true;
        var offset = $scope.result.length;
        loWeb.get('/show_playlist?source=' + getSourceName($scope.tab) + '&offset=' + offset).success(function(data) {
            $scope.result = $scope.result.concat(data.result);
            $scope.loading = false;
        });
    }

    $scope.isActiveTab = function(tab){
      return $scope.tab === tab;
    };


    $scope.loadPlaylist = function(){
      loWeb.get('/show_playlist?source=' + getSourceName($scope.tab)).success(function(data) {
        $scope.result = data.result;
        $scope.loading = false;
      });
    };
  }]);

  // app.controller('ImportController', ['$http',
  //   '$httpParamSerializerJQLike', '$scope', '$interval',
  //   '$timeout', '$rootScope', 'Notification', 'angularPlayer',
  //   function($http, $httpParamSerializerJQLike, $scope,
  //     $interval, $timeout, $rootScope, Notification, angularPlayer){
  //   $scope.validcode_url = "";
  //   $scope.token = "";

  //   $scope.getLoginInfo = function(){
  //     $http.get('/dbvalidcode').success(function(data) {
  //       if (data.isLogin == 0) {
  //         $scope.validcode_url = data.captcha.path;
  //         $scope.token = data.captcha.token;
  //       }
  //       else {
  //         // already login
  //         $scope.isDoubanLogin = true;
  //         $rootScope.$broadcast('isdoubanlogin:update', true);
  //       }
  //     });
  //   };

  //   $scope.loginDouban = function(){
  //     $scope.session.token = $scope.token;
  //     $http({
  //       url: '/dblogin',
  //       method: 'POST',
  //       data: $httpParamSerializerJQLike($scope.session),
  //       headers: {
  //         'Content-Type': 'application/x-www-form-urlencoded'
  //       }
  //     }).success(function(data) {
  //       if (data.result.success == '1') {
  //         $scope.isDoubanLogin = true;
  //         $rootScope.$broadcast('isdoubanlogin:update', true);
  //         Notification.success("登录豆瓣成功");
  //       }
  //       else {
  //         $scope.validcode_url = data.result.path;
  //         $scope.token = data.result.token;
  //       }
  //     });
  //     $scope.session.solution = "";
  //   };

  //   $scope.logoutDouban = function() {
  //     $http({
  //       url: '/dblogout',
  //       method: 'GET'
  //     }).success(function(data) {
  //       $scope.isDoubanLogin = false;
  //       $rootScope.$broadcast('isdoubanlogin:update', false);
  //       Notification.success("退出登录豆瓣成功");
  //       $scope.getLoginInfo();
  //     });
  //   };

  //   $scope.importDoubanFav = function(){
  //     $http({
  //       url: '/dbfav',
  //       method: 'POST',
  //       data: $httpParamSerializerJQLike({command:'start'}),
  //       headers: {
  //         'Content-Type': 'application/x-www-form-urlencoded'
  //       }
  //     }).success(function(data) {
  //       $scope.status = '正在进行中：' + data.result.progress + '%';
  //       $scope.start();
  //     });
  //   };

  //   var promise;

  //   $scope.start = function() {
  //     // stops any running interval to avoid two intervals running at the same time
  //     $scope.stop();

  //     // store the interval promise
  //     promise = $interval(poll, 1000);
  //   };

  //   $scope.stop = function() {
  //     $interval.cancel(promise);
  //   };
  //   $scope.$on('$destroy', function() {
  //     $scope.stop();
  //   });

  //   function poll(){
  //     $http({
  //       url: '/dbfav',
  //       method: 'POST',
  //       data: $httpParamSerializerJQLike({command:'status'}),
  //       headers: {
  //         'Content-Type': 'application/x-www-form-urlencoded'
  //       }
  //     }).success(function(data) {
  //       $scope.status = '正在进行中：' + data.result.progress + '%';
  //       if (data.result.progress == 100) {
  //         $scope.stop();
  //         $scope.status = '';
  //         Notification.success("红心兆赫已导入我的歌单");
  //       }
  //     });
  //   }
  // }]);

})();
