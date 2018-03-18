var ngGithub = angular.module('githubClient', []);

ngGithub.factory('github', ['$rootScope', 
function($rootScope) {
    return {
        openAuthUrl: function(){
            console.log('openAuthUrl');
            window.open(Github.getOAuthUrl(), '_blank');
        },
        getStatusText: function(){
            return Github.getStatusText();
        },
        getStatus: function(){
            return Github.getStatus();
        },
        updateStatus: function(){
            console.log('github update status');
            Github.updateStatus(function(newStatus){
                $rootScope.$broadcast('github:status', newStatus);
            });
        },
        logout: function(){
            Github.logout();
        }
    };
}]);

ngGithub.provider('gist', {
  $get: function($http, $q) {
    var apiUrl = 'https://api.github.com/gists';

    function _getGistId() {
      return localStorage.getObject("gistid");
    }

    function json2gist(jsonObject) {
      var result = {};
      
      result['listen1_backup.json'] = {content: JSON.stringify(jsonObject)};
      //var markdown = '# My Listen1 Playlists\n';
      var playlistIds = jsonObject['playerlists'];
      var songsCount = 0;
      for(var i=0; i<playlistIds.length; i++) {
        var playlistId = playlistIds[i];
        var playlist = jsonObject[playlistId];
        var cover = ' <img src="' + playlist.info.cover_img_url + '" width="140" height="140"><br/>';
        var title = playlist.info.title;
        var tableHeader = '\n| 音乐标题 | 歌手 | 专辑 |\n';
        tableHeader += '| --- | --- | --- |\n';
        var tableBody = '';
        for(var j=0; j<playlist.tracks.length; j++) {
          var track = playlist.tracks[j];
          tableBody += '| ' + track.title + ' | ' + track.artist + ' | ' + track.album + ' | \n';
        }
        var content = '<details>\n  <summary>' + cover + '   ' + title + '</summary><p>\n' + tableHeader + tableBody +'</p></details>';
        var filename = 'listen1_'+playlistId + '.md';
        result[filename] = {content: content};
        songsCount += playlist.tracks.length;
      }
      var summary = "本歌单由[Listen1](http://listen1.github.io/listen1/)创建, 歌曲数：" + songsCount + "，歌单数：" + playlistIds.length + "，点击查看更多";
      result['listen1_aha_playlist.md'] = {content: summary};
      
      return result;
    }

    function gist2json(gistFiles) {
      var jsonString = gistFiles['listen1_backup.json'].content;
      return JSON.parse(jsonString);
    }

    function listExistBackup(){
      var deferred = $q.defer();
      var url = apiUrl;
      $http({
        method: 'GET',
        url: url,
        headers:{'Authorization':'token ' + localStorage.getObject("githubOauthAccessKey")},
      }).then(function(res) {
        var result = res.data;
        result = result.filter(function(backup){return backup.description.startsWith('updated by Listen1')});
        deferred.resolve(result);
      }, function(err) {
        deferred.reject(err)
      });
      return deferred.promise;
    }

    function backup(files, gistId, isPublic) {
      var deferred = $q.defer();
      var method = '';
      var url = '';
      if (gistId != null) {
        method = 'PATCH';
        url = apiUrl + '/' + gistId;
      }
      else {
        method = 'POST';
        url = apiUrl;
      }
      $http({
        method: method,
        url: url,
        headers:{'Authorization':'token ' + localStorage.getObject("githubOauthAccessKey")},
        data:{
          "description": "updated by Listen1(http://listen1.github.io/listen1/) at " + new Date().toLocaleString(),
          "public": isPublic,
          "files": files
        }
      }).then(function(res) {
        deferred.resolve();
      }, function(err) {
        deferred.reject(err)
      });
      return deferred.promise;
    }

    function restore(gistId) {
      var deferred = $q.defer();
      $http({
        method:'GET',
        url:apiUrl + '/' + gistId,
      }).then(function(res) {
        try{
          var files = res.data.files
          deferred.resolve(files);
        }catch(e){
          deferred.reject(404);
        }
      }, function(err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }
    var gistApi = {
      "gist2json": gist2json,
      "json2gist": json2gist,
      "listExistBackup": listExistBackup,
      "backupMySettings2Gist": backup,
      "importMySettingsFromGist": restore,
    };
    return gistApi;
  }
})