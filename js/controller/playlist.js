/* eslint-disable no-unused-vars */
/* global angular MediaService sourceList */

angular.module('listenone').controller('PlayListController', [
  '$scope',
  '$timeout',
  ($scope) => {
    $scope.result = [];
    $scope.tab = sourceList[0].name;
    $scope.sourceList = sourceList;
    $scope.playlistFilters = {};
    $scope.allPlaylistFilters = {};
    $scope.currentFilterId = '';
    $scope.loading = true;
    $scope.showMore = false;

    $scope.$on('infinite_scroll:hit_bottom', (event, data) => {
      if ($scope.loading === true) {
        return;
      }
      $scope.loading = true;
      const offset = $scope.result.length;
      MediaService.showPlaylistArray(
        $scope.tab,
        offset,
        $scope.currentFilterId
      ).success((res) => {
        $scope.result = $scope.result.concat(res.result);
        $scope.loading = false;
      });
    });

    $scope.loadPlaylist = () => {
      const offset = 0;
      $scope.showMore = false;
      MediaService.showPlaylistArray(
        $scope.tab,
        offset,
        $scope.currentFilterId
      ).success((res) => {
        $scope.result = res.result;
        $scope.loading = false;
      });

      if (
        $scope.playlistFilters[$scope.tab] === undefined &&
        $scope.allPlaylistFilters[$scope.tab] === undefined
      ) {
        MediaService.getPlaylistFilters($scope.tab).success((res) => {
          $scope.playlistFilters[$scope.tab] = res.recommend;
          $scope.allPlaylistFilters[$scope.tab] = res.all;
        });
      }
    };

    $scope.changeTab = (newTab) => {
      $scope.tab = newTab;
      $scope.result = [];
      $scope.currentFilterId = '';
      $scope.loadPlaylist();
    };

    $scope.changeFilter = (filterId) => {
      $scope.result = [];
      $scope.currentFilterId = filterId;
      $scope.loadPlaylist();
    };

    $scope.toggleMorePlaylists = () => {
      $scope.showMore = !$scope.showMore;
    };
  },
]);
