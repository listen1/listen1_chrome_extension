(function() {

 'use strict';

  Storage.prototype.setObject = function(key, value) {
      this.setItem(key, JSON.stringify(value));
  }

  Storage.prototype.getObject = function(key) {
      var value = this.getItem(key);
      return value && JSON.parse(value);
  }

  angular.module('lastfmClient', []).provider('lastfm', function() {
    this.options = {
      apiKey: 'unknown',
      apiSecret: 'unknown'
    };

    this.setOptions = function(options) {
      if (!angular.isObject(options)) throw new Error("Options should be an object!");
      this.options = angular.extend({}, this.options, options);
    };

    this.apiUrl = 'https://ws.audioscrobbler.com/2.0/';

    this.$get = ['$http', '$window', function($http, $window) {
      var options = this.options;
      var apiUrl = this.apiUrl;
      var status = 0;

      /**
       * Computes string for signing request
       *
       * See http://www.last.fm/api/authspec#8
       */
      function generateSign(params) {
        var keys = [];
        var o = '';

        for (var x in params) {
          if (params.hasOwnProperty(x)) {
            keys.push(x);
          }
        }

        // params has to be ordered alphabetically
        keys.sort();

        for (var i = 0; i < keys.length; i++) {
          if (keys[i] == 'format' || keys[i] == 'callback') {
            continue;
          }

          o = o + keys[i] + params[keys[i]];
        }

        // append secret
        return MD5(o + options.apiSecret);
      }

      /**
       * Creates query string from object properties
       */
      function createQueryString(params) {
        var parts = [];

        for (var x in params) {
          if (params.hasOwnProperty(x)) {
            parts.push( x + '=' + encodeURIComponent(params[x]));
          }
        }

        return parts.join('&');
      }

      function getAuth(callback){
        var url = apiUrl + '?method=auth.gettoken&api_key=' + options.apiKey  + '&format=json';
        $http.get(url).success(function(data) {
          var token = data.token;
          localStorage.setObject('lastfmtoken', token);
          var grant_url = 'http://www.last.fm/api/auth/?api_key=' + options.apiKey + '&token=' + token;
          $window.open(grant_url, '_blank');
          status = 1;
          if (callback != null) {
            callback();
          }
        });
      };

      function cancelAuth(){
        localStorage.removeItem('lastfmsession');
        localStorage.removeItem('lastfmtoken');
        updateStatus();
      };

      function _isAuthRequested() {
        var token = localStorage.getObject('lastfmtoken');
        return (token != null);
      }

      function updateStatus() {
        // auth status
        // 0: never request for auth
        // 1: request but fail to success
        // 2: success auth
        if (!_isAuthRequested()) {
          status = 0;
          return;
        }
        getUserInfo(function(data){
          if (data == null) {
            status = 1;
          }
          else {
            status = 2;
          }
        });
      }

      function getSession(callback) {
        // load session info from localStorage
        var mySession = localStorage.getObject('lastfmsession');
        if (mySession != null) {
          return callback(mySession);
        }
        // trade session with token
        var token = localStorage.getObject('lastfmtoken');
        if (token == null){
          return callback(null);
        }
        // token exists
        var params = {
          method: 'auth.getsession',
          api_key: options.apiKey,
          token: token
        };
        var apiSig = generateSign(params);
        var url = apiUrl + '?' + createQueryString(params) + '&api_sig=' + apiSig + '&format=json';
        $http.get(url).success(function(data){
          mySession = data.session;
          localStorage.setObject('lastfmsession', mySession);
          callback(mySession);
        }).error(function (errResponse, status) {
          if(status == 403){
            callback(null);
          }
        });
      };

      function sendNowPlaying(track, artist, callback) {
        getSession(function(session){
          var params = {
            method: 'track.updatenowplaying',
            track: track,
            artist: artist,
            api_key: options.apiKey,
            sk: session.key
          };

          params.api_sig = generateSign(params);

          var url = apiUrl + '?' + createQueryString(params) + '&format=json';
          $http.post(url).success(function(data){
            if (callback != null) {
              callback(data);
            }
          });
        });
      };

      function scrobble(timestamp, track, artist, album, callback) {
        getSession(function(session){
          var params = {
            method: 'track.scrobble',
            'timestamp[0]': timestamp,
            'track[0]': track,
            'artist[0]': artist,
            api_key: options.apiKey,
            sk: session.key
          };

          if ((album !='') && (album != null)) {
            params['album[0]'] = album;
          }

          params.api_sig = generateSign(params);

          var url = apiUrl + '?' + createQueryString(params) + '&format=json';
          $http.post(url).success(function(data){
            if (callback != null) {
              callback(data);
            }
          });
        });
      };

      function getUserInfo(callback) {
        getSession(function(session){
          if (session == null) {
            callback(null);
            return;
          }
          var params = {
            method: 'user.getinfo',
            api_key: options.apiKey,
            sk: session.key
          };

          params.api_sig = generateSign(params);

          var url = apiUrl + '?' + createQueryString(params) + '&format=json';
          $http.post(url).success(function(data){
            if (callback != null) {
              callback(data);
            }
          });
        });
      };

      function isAuthorized() {
        return (status == 2);
      }

      function isAuthRequested() {
        return !(status == 0);
      }

      function getStatusText() {
        if(status == 0) {
          return '未连接';
        }
        if(status == 1) {
          return '连接中';
        }
        if(status == 2) {
          return '已连接';
        }
      }

      var publicApi = {
        getAuth               : getAuth,
        cancelAuth            : cancelAuth,
        getSession            : getSession,
        sendNowPlaying        : sendNowPlaying,
        scrobble              : scrobble,
        getUserInfo           : getUserInfo,
        getStatusText         : getStatusText,
        updateStatus          : updateStatus,
        isAuthorized          : isAuthorized,
        isAuthRequested       : isAuthRequested
      };

      return publicApi;
    }];
  });
}) ();

