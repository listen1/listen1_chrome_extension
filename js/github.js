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

    function backup(filecontent) {
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
        "files": {
          "listen1_backup.json": {
          "content": filecontent
            }
          }
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
          var backupcontent = res.data.files["listen1_backup.json"].content;
          deferred.resolve(backupcontent);
        }catch(e){
          deferred.reject(404);
        }
      }, function(err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }
    var gistApi = {
      "backupMySettings2Gist": backup,
      "importMySettingsFromGist": restore,
    };
    return gistApi;
  }
})