/* global angular MediaService */
const platformSourceList = [
  {
    name: 'my_playlist',
    displayId: '_MY_PLAYLIST',
  },
  {
    name: 'recommend_playlist',
    displayId: '_RECOMMEND_PLAYLIST',
  },
];
angular.module('listenone').controller('PlatformController', [
  '$scope',
  ($scope) => {
    $scope.myPlatformPlaylists = [];
    $scope.myPlatformUser = {};
    $scope.platformSourceList = platformSourceList;
    $scope.tab = platformSourceList[0].name;

    $scope.loadPlatformPlaylists = () => {
      if ($scope.myPlatformUser.platform === undefined) {
        return;
      }
      let getPlaylistFn = MediaService.getUserPlaylist;
      if ($scope.tab === 'recommend_playlist') {
        getPlaylistFn = MediaService.getRecommendPlaylist;
      }
      const user = $scope.myPlatformUser;
      getPlaylistFn(user.platform, {
        user_id: user.user_id,
      }).success((response) => {
        const { data } = response;
        $scope.myPlatformPlaylists = data.playlists;
      });
    };

    $scope.initPlatformController = (user) => {
      $scope.myPlatformUser = user;
      $scope.loadPlatformPlaylists();
    };

    $scope.changePlatformTab = (name) => {
      $scope.tab = name;
      $scope.loadPlatformPlaylists();
    };
  },
]);
