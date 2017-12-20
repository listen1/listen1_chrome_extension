(function() {
  'use strict';
  Storage.prototype.setObject = function(key, value) {
    this.setItem(key, JSON.stringify(value));
  }

  Storage.prototype.getObject = function(key) {
    var value = this.getItem(key);
    return value && JSON.parse(value);
  }

  angular.module('gistClient', [])
    .provider('gist', {
      $get: function($http, $q) {
        var apiUrl = 'https://api.github.com/gists/';

        function _getGistInfo() {
          return localStorage.getObject("gistinfo");
        }

        function backup(filecontent) {
          var deferred = $q.defer();
          $http({
            method:'PATCH',
            url:apiUrl + _getGistInfo().id,
            headers:{'Authorization':'token ' + localStorage.getObject("gistinfo").token},
            data:{
            "description": "updated by Listen1(http://listen1.github.io/listen1/) at " + new Date().toLocaleString(),
            "files": {
              "listen1_backup.json": {
              "content": filecontent
                }
              }
            }
          }).then(function(res) {
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
            url:apiUrl + _getGistInfo().id,
          }).then(function(res) {
            try{
              var  backupcontent =  res.data.files["listen1_backup.json"].content;
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
})();