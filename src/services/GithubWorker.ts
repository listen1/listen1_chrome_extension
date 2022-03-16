import ky from 'ky';
import { isElectron } from '../utils';
import iDB from './DBService';

const OAUTH_URL = 'https://github.com/login/oauth';
const API_URL = 'https://api.github.com';

const client_id = 'e099a4803bb1e2e773a3';
const client_secret = '81fbfc45c65af8c0fbf2b4dae6f23f22e656cfb8';

const GithubAPI = async () =>
  ky.extend({
    prefixUrl: API_URL,
    headers: {
      Authorization: `token ${
        (
          await iDB.Settings.get({
            key: 'GITHUB_ACCESS_TOKEN'
          })
        )?.value
      }`
    }
  });

const Github = {
  status: 0,
  username: ''
};
const GithubClient = {
  github: {
    handleCallback: async (code: string) => {
      const url = `${OAUTH_URL}/access_token`;
      const params = {
        client_id,
        client_secret,
        code
      };
      const searchParams = new URLSearchParams(params);
      const res = (await ky
        .post(url, {
          body: searchParams,
          headers: { accept: 'application/json' }
        })
        .json()) as any;
      const ak = res?.access_token;
      if (ak)
        iDB.Settings.put({
          key: 'GITHUB_ACCESS_TOKEN',
          value: ak
        });
      return ak;
    },
    _openAuthUrl: () => {
      Github.status = 1;
      const url = `${OAUTH_URL}/authorize?client_id=${client_id}&scope=gist`;
      if (isElectron()) {
        // normal window for link
        // @ts-ignore: eletron only
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { BrowserWindow } = require('electron').remote; // TODO: Use
        let win = new BrowserWindow({
          width: 1000,
          height: 670
        });
        win.on('closed', () => {
          win = null;
        });
        win.loadURL(url);
        return;
      }
      window.open(url, '_blank');
    },
    get openAuthUrl() {
      return this._openAuthUrl;
    },
    set openAuthUrl(value) {
      this._openAuthUrl = value;
    },
    getStatus: () => Github.status,
    getStatusText: () => {
      switch (Github.status) {
        case 0:
          return '未连接';
        case 1:
          return '连接中';
        case 2:
          return `${Github.username} 已登录`;
        default:
          return '???';
      }
    },
    updateStatus: async () => {
      const dbRes = await iDB.Settings.get({
        key: 'GITHUB_ACCESS_TOKEN'
      });
      const accessToken = dbRes?.value;
      if (!accessToken) {
        Github.status = 0;
      } else {
        const { data } = (await GithubAPI()).get('/user').json() as any;
        if (data.login === undefined) {
          Github.status = 1;
        } else {
          Github.status = 2;
          Github.username = data.login;
        }
      }
      return Github.status;
    },
    logout: () => {
      iDB.Settings.put({
        key: 'GITHUB_ACCESS_TOKEN',
        value: null
      });
      Github.status = 0;
    }
  },

  gist: {
    json2gist(jsonObject: any) {
      const result: Record<string, unknown> = {};

      result['listen1_backup.json'] = {
        content: JSON.stringify(jsonObject)
      };
      // const markdown = '# My Listen1 Playlists\n';
      const songsCount = jsonObject.Playlists.reduce((count: number, playlist: any) => {
        const cover = `<img src="${playlist.cover_img_url}" width="140" height="140"><br/>`;
        const { title } = playlist;
        let tableHeader = '\n| 音乐标题 | 歌手 | 专辑 |\n';
        tableHeader += '| --- | --- | --- |\n';
        const tracks = jsonObject.Tracks.filter((track: any) => track.playlist === playlist.id);
        const tableBody = tracks.reduce((r: string, track: any) => `${r} | ${track.title} | ${track.artist} | ${track.album} | \n`, '');
        const content = `<details>\n  <summary>${cover}   ${title}</summary><p>\n${tableHeader}${tableBody}</p></details>`;
        const filename = `listen1_${playlist.id}.md`;
        result[filename] = {
          content
        };
        return count + tracks.length;
      }, 0);
      const summary = `本歌单由[Listen1](https://listen1.github.io/listen1/)创建, 歌曲数：${songsCount}，歌单数：${jsonObject.Playlists.length}，点击查看更多`;
      result['listen1_aha_playlist.md'] = {
        content: summary
      };

      return result;
    },

    async gist2json(gistFiles: any) {
      if (!gistFiles['listen1_backup.json'].truncated) {
        const jsonString = gistFiles['listen1_backup.json'].content;
        return JSON.parse(jsonString);
      }

      const url = gistFiles['listen1_backup.json'].raw_url;
      // const { size } = gistFiles['listen1_backup.json'];
      const res = (await GithubAPI()).get(url).json() as any;
      return res.data;
    },

    async listExistBackup() {
      const res = (await GithubAPI()).get('/gists').json() as any;
      const result = res.data;
      return result.filter((backupObject: Record<string, any>) => backupObject.description.startsWith('updated by Listen1'));
    },

    async backupMySettings2Gist(files: any, gistId: string, isPublic: boolean) {
      let method: 'post' | 'patch' = 'post';
      let url = '/gists';
      if (gistId) {
        method = 'patch';
        url = `/gists/${gistId}`;
      }
      const api = await GithubAPI();
      return api(url, {
        method,
        json: {
          data: {
            description: `updated by Listen1(https://listen1.github.io/listen1/) at ${new Date().toLocaleString()}`,
            public: isPublic,
            files
          }
        }
      });
    },

    async importMySettingsFromGist(gistId: string) {
      const res = (await (await GithubAPI()).get(`/gists/${gistId}`).json()) as any;
      return res.data.files;
    }
  }
};

export default GithubClient;
