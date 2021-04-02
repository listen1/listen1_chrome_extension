/* global Github isElectron require */
/* eslint-disable global-require */
const GithubClient = {};

GithubClient.github = {
  openAuthUrl: () => {
    const url = Github.getOAuthUrl();
    if (isElectron()) {
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
  updateStatus: (cb) => {
    // console.log('github update status');
    Github.updateStatus(cb);
  },
  logout: () => {
    Github.logout();
  },
};

GithubClient.gist = {
  $get: () => {
    const apiUrl = 'https://api.github.com/gists';

    // eslint-disable-next-line
    function _getGistId() {
      // eslint-disable-line no-underscore-dangle
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
        const tableBody = playlist.tracks.reduce(
          (r, track) =>
            `${r} | ${track.title} | ${track.artist} | ${track.album} | \n`,
          ''
        );
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
      axios
        .get(url, {
          headers: {
            Authorization: `token ${localStorage.getObject(
              'githubOauthAccessKey'
            )}`,
          },
        })
        .then((res) => callback(res.data));
      return null;
    }

    function listExistBackup() {
      const url = apiUrl;
      return axios
        .get(url, {
          headers: {
            Authorization: `token ${localStorage.getObject(
              'githubOauthAccessKey'
            )}`,
          },
        })
        .then((res) => {
          const result = res.data;
          return result.filter((backupObject) =>
            backupObject.description.startsWith('updated by Listen1')
          );
        });
    }

    function backup(files, gistId, isPublic) {
      let method = '';
      let url = '';
      if (gistId != null) {
        method = 'patch';
        url = `${apiUrl}/${gistId}`;
      } else {
        method = 'post';
        url = apiUrl;
      }
      return axios.request({
        method,
        url,
        headers: {
          Authorization: `token ${localStorage.getObject(
            'githubOauthAccessKey'
          )}`,
        },
        data: {
          description: `updated by Listen1(http://listen1.github.io/listen1/) at ${new Date().toLocaleString()}`,
          public: isPublic,
          files,
        },
      });
    }

    function restore(gistId) {
      return axios.get(`${apiUrl}/${gistId}`).then((res) => res.data.files);
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
};
