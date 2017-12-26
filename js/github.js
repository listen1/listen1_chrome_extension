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
            // delete gist id info;
            localStorage.removeItem("gistid");
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
      }
      
      return result;
    }

    function gist2json(gistFiles) {
      var jsonString = gistFiles['listen1_backup.json'].content;
      return JSON.parse(jsonString);
    }

    function backup(files) {
      var deferred = $q.defer();
      var gistId = _getGistId();
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
        "public": false,
        "files": files
        }
      }).then(function(res) {
        var newGistId = res.data.id;
        localStorage.setObject("gistid", newGistId);
        deferred.resolve();
      }, function(err) {
        deferred.reject(err)
      });
      return deferred.promise;
    }

    function restore() {
      var deferred = $q.defer();
      $http({
        method:'GET',
        url:apiUrl + '/' + _getGistId(),
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
      "backupMySettings2Gist": backup,
      "importMySettingsFromGist": restore,
    };
    return gistApi;
  }
})