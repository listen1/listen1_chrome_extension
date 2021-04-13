/* eslint-disable no-unused-vars */
/* global angular MediaService */

angular.module('listenone').controller('MyPlayListController', [
  '$scope',
  '$timeout',
  ($scope, $timeout) => {
    $scope.myplaylists = [];
    $scope.favoriteplaylists = [];

    $scope.loadMyPlaylist = () => {
      MediaService.showMyPlaylist().success((data) => {
        $scope.$evalAsync(() => {
          $scope.myplaylists = data.result;
        });
      });
    };

    $scope.loadFavoritePlaylist = () => {
      MediaService.showFavPlaylist().success((data) => {
        $scope.$evalAsync(() => {
          $scope.favoriteplaylists = data.result;
        });
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

    $scope.$on('favoriteplaylist:update', (event, data) => {
      $scope.loadFavoritePlaylist();
    });
  },
]);
