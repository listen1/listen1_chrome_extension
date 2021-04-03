/* eslint-disable import/no-unresolved */
/* eslint-disable global-require */
/* global angular MediaService isElectron require */
angular.module('listenone').controller('AuthController', [
  '$scope',
  ($scope) => {
    $scope.loginProgress = false;
    $scope.loginType = 'email';
    $scope.loginSourceList = MediaService.getLoginProviders().map(
      (i) => i.name
    );
    $scope.refreshAuthStatus = () => {
      $scope.loginSourceList.map((source) =>
        MediaService.getUser(source).success((data) => {
          if (data.status === 'success') {
            $scope.setMusicAuth(source, data.data);
          } else {
            $scope.setMusicAuth(source, {});
          }
        })
      );
    };

    $scope.logout = (source) => {
      $scope.setMusicAuth(source, {});
      MediaService.logout(source);
    };

    $scope.is_login = (source) =>
      $scope.musicAuth[source] && $scope.musicAuth[source].is_login;

    $scope.musicAuth = {};

    $scope.setMusicAuth = (source, data) => {
      $scope.musicAuth[source] = data;
    };

    $scope.getLoginUrl = (source) => MediaService.getLoginUrl(source);

    $scope.openLogin = (source) => {
      const url = $scope.getLoginUrl(source);
      if (isElectron()) {
        const { ipcRenderer } = require('electron');
        return ipcRenderer.send('openUrl', url);
      }
      return window.open(url, '_blank');
    };
  },
]);
