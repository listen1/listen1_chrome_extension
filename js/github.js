/* global isElectron require */
/* eslint-disable global-require */
function github() {
  const OAUTH_URL = 'https://github.com/login/oauth';
  const API_URL = 'https://api.github.com';

  const client_id = 'e099a4803bb1e2e773a3';
  const client_secret = '81fbfc45c65af8c0fbf2b4dae6f23f22e656cfb8';

  const GithubAPI = axios.create({
    baseURL: API_URL,
    headers: { accept: 'application/json' },
  });
  GithubAPI.interceptors.request.use((config) => {
    const accessToken = localStorage.getObject('githubOauthAccessKey');
    // eslint-disable-next-line no-param-reassign
    config.headers.Authorization = `token ${accessToken}`;
    return config;
  });

  const Github = {
    status: 0,
    username: '',
  };

  window.GithubClient = {
    github: {
      handleCallback: (code, cb) => {
        const url = `${OAUTH_URL}/access_token`;
        const params = {
          client_id,
          client_secret,
          code,
        };
        axios
          .post(url, '', {
            params,
            headers: { accept: 'application/json' },
          })
          .then((res) => {
            const ak = res.data.access_token;
            if (ak)
              localStorage.setItem('githubOauthAccessKey', JSON.stringify(ak));
            if (cb !== undefined) {
              cb(ak);
            }
          });
      },
      openAuthUrl: () => {
        Github.status = 1;
        const url = `${OAUTH_URL}/authorize?client_id=${client_id}&scope=gist`;
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
      getStatus: () => Github.status,
      getStatusText: () => {
        switch (Github.status) {
          case 0:
            return '未连接';
          case 1:
            return '连接中';
          case 2:
            return `${Github.username}已登录`;
          default:
            return '???';
        }
      },
      updateStatus: async (callback) => {
        const access_token = localStorage.getObject('githubOauthAccessKey');
        if (access_token == null) {
          Github.status = 0;
        } else {
          const { data } = await GithubAPI.get('/user');
          if (data.login === undefined) {
            Github.status = 1;
          } else {
            Github.status = 2;
            Github.username = data.login;
          }
        }
        if (callback != null) {
          callback(Github.status);
        }
      },
      logout: () => {
        localStorage.removeItem('githubOauthAccessKey');
        Github.status = 0;
      },
    },

    gist: {
      json2gist(jsonObject) {
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
        const summary = `本歌单由[Listen1](https://listen1.github.io/listen1/)创建, 歌曲数：${songsCount}，歌单数：${playlistIds.length}，点击查看更多`;
        result['listen1_aha_playlist.md'] = {
          content: summary,
        };

        return result;
      },

      gist2json(gistFiles, callback) {
        if (!gistFiles['listen1_backup.json'].truncated) {
          const jsonString = gistFiles['listen1_backup.json'].content;
          return callback(JSON.parse(jsonString));
        }

        const url = gistFiles['listen1_backup.json'].raw_url;
        // const { size } = gistFiles['listen1_backup.json'];
        GithubAPI.get(url).then((res) => callback(res.data));
        return null;
      },

      listExistBackup() {
        return GithubAPI.get('/gists').then((res) => {
          const result = res.data;
          return result.filter((backupObject) =>
            backupObject.description.startsWith('updated by Listen1')
          );
        });
      },

      backupMySettings2Gist(files, gistId, isPublic) {
        let method = '';
        let url = '';
        if (gistId != null) {
          method = 'patch';
          url = `/gists/${gistId}`;
        } else {
          method = 'post';
          url = '/gists';
        }
        return GithubAPI.request({
          method,
          url,
          data: {
            description: `updated by Listen1(https://listen1.github.io/listen1/) at ${new Date().toLocaleString()}`,
            public: isPublic,
            files,
          },
        });
      },

      importMySettingsFromGist(gistId) {
        return GithubAPI.get(`/gists/${gistId}`).then((res) => res.data.files);
      },
    },
  };
}

github();
