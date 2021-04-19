/* global angular MediaService */
const platformSourceList = [
  {
    name: 'my_created_playlist',
    displayId: '_MY_CREATED_PLAYLIST',
  },
  {
    name: 'my_favorite_playlist',
    displayId: '_MY_FAVORITE_PLAYLIST',
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
      let getPlaylistFn = MediaService.getUserCreatedPlaylist;
      if ($scope.tab === 'recommend_playlist') {
        getPlaylistFn = MediaService.getRecommendPlaylist;
      } else if ($scope.tab === 'my_favorite_playlist') {
        getPlaylistFn = MediaService.getUserFavoritePlaylist;
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
      $scope.tab = platformSourceList[0].name;
      $scope.myPlatformUser = user;
      $scope.loadPlatformPlaylists();
    };

    $scope.$on('myplatform:update', (event, user) => {
      $scope.initPlatformController(user);
    });

    $scope.changeTab = (name) => {
      $scope.tab = name;
      $scope.loadPlatformPlaylists();
    };
  },
]);
