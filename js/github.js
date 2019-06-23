/* global angular chrome localStorage Github window */
/* eslint-disable global-require */
const ngGithub = angular.module('githubClient', []);
ngGithub.factory('github', ['$rootScope',
  $rootScope => ({
    openAuthUrl: () => {
      const url = Github.getOAuthUrl();
      if ((typeof chrome) === 'undefined') {
        // normal window for link
        const { BrowserWindow } = require('electron').remote; // eslint-disable-line import/no-unresolved
        let win = new BrowserWindow({
          width: 1000,
          height: 670,
        });
        win.on('closed', () => {
          win = null;
        });
        win.loadURL(url);
        return;
      }
      window.open(url, '_blank');
    },
    getStatusText: () => Github.getStatusText(),
    getStatus: () => Github.getStatus(),
    updateStatus: () => {
      // console.log('github update status');
      Github.updateStatus((newStatus) => {
        $rootScope.$broadcast('github:status', newStatus);
      });
    },
    logout: () => {
      Github.logout();
    },
  }),
]);

ngGithub.provider('gist', {
  $get: ($http, $q) => {
    const apiUrl = 'https://api.github.com/gists';

    // eslint-disable-next-line no-unused-vars
    function _getGistId() { // eslint-disable-line no-underscore-dangle
      return localStorage.getObject('gistid');
    }

    function json2gist(jsonObject) {
      const result = {};

      result['listen1_backup.json'] = {
        content: JSON.stringify(jsonObject),
      };
      // const markdown = '# My Listen1 Playlists\n';
      const playlistIds = jsonObject.playerlists;
      const songsCount = playlistIds.reduce((count, playlistId) => {
        const playlist = jsonObject[playlistId];
        const cover = `<img src="${playlist.info.cover_img_url}" width="140" height="140"><br/>`;
        const { title } = playlist.info;
        let tableHeader = '\n| 音乐标题 | 歌手 | 专辑 |\n';
        tableHeader += '| --- | --- | --- |\n';
        const tableBody = playlist.tracks.reduce((r, track) => `${r} | ${track.title} | ${track.artist} | ${track.album} | \n`, '');
        const content = `<details>\n  <summary>${cover}   ${title}</summary><p>\n${tableHeader}${tableBody}</p></details>`;
        const filename = `listen1_${playlistId}.md`;
        result[filename] = {
          content,
        };
        return count + playlist.tracks.length;
      }, 0);
      const summary = `本歌单由[Listen1](http://listen1.github.io/listen1/)创建, 歌曲数：${songsCount}，歌单数：${playlistIds.length}，点击查看更多`;
      result['listen1_aha_playlist.md'] = {
        content: summary,
      };

      return result;
    }

    function gist2json(gistFiles, callback) {
      if (!gistFiles['listen1_backup.json'].truncated) {
        const jsonString = gistFiles['listen1_backup.json'].content;
        return callback(JSON.parse(jsonString));
      }

      const url = gistFiles['listen1_backup.json'].raw_url;
      // const { size } = gistFiles['listen1_backup.json'];
      $http({
        method: 'GET',
        url,
        headers: {
          Authorization: `token ${localStorage.getObject('githubOauthAccessKey')}`,
        },
      }).then(res => callback(res.data));
      return null;
    }

    function listExistBackup() {
      const deferred = $q.defer();
      const url = apiUrl;
      $http({
        method: 'GET',
        url,
        headers: {
          Authorization: `token ${localStorage.getObject('githubOauthAccessKey')}`,
        },
      }).then((res) => {
        let result = res.data;
        result = result.filter(backupObject => backupObject.description.startsWith('updated by Listen1'));
        deferred.resolve(result);
      }, (err) => {
        deferred.reject(err);
      });
      return deferred.promise;
    }

    function backup(files, gistId, isPublic) {
      const deferred = $q.defer();
      let method = '';
      let url = '';
      if (gistId != null) {
        method = 'PATCH';
        url = `${apiUrl}/${gistId}`;
      } else {
        method = 'POST';
        url = apiUrl;
      }
      $http({
        method,
        url,
        headers: {
          Authorization: `token ${localStorage.getObject('githubOauthAccessKey')}`,
        },
        data: {
          description: `updated by Listen1(http://listen1.github.io/listen1/) at ${new Date().toLocaleString()}`,
          public: isPublic,
          files,
        },
      }).then((res) => { // eslint-disable-line no-unused-vars
        deferred.resolve();
      }, (err) => {
        deferred.reject(err);
      });
      return deferred.promise;
    }

    function restore(gistId) {
      const deferred = $q.defer();
      $http({
        method: 'GET',
        url: `${apiUrl}/${gistId}`,
      }).then((res) => {
        try {
          const { files } = res.data;
          deferred.resolve(files);
        } catch (e) {
          deferred.reject(404);
        }
      }, (err) => {
        deferred.reject(err);
      });
      return deferred.promise;
    }
    const gistApi = {
      gist2json,
      json2gist,
      listExistBackup,
      backupMySettings2Gist: backup,
      importMySettingsFromGist: restore,
    };
    return gistApi;
  },
});
