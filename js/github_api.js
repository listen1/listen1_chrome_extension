/* global Storage $ localStorage window */
function github() {
  const OAUTH_URL = 'https://github.com/login/oauth';
  const API_URL = 'https://api.github.com';

  const client_id = 'e099a4803bb1e2e773a3';
  const client_secret = '81fbfc45c65af8c0fbf2b4dae6f23f22e656cfb8';

  localStorage.__proto__.setObject = function setObject(key, value) {
    this.setItem(key, JSON.stringify(value));
  };

  localStorage.__proto__.getObject = function getObject(key) {
    const value = this.getItem(key);
    return value && JSON.parse(value);
  };

  const Github = {
    status: 0,
    username: '',
    getOAuthUrl: () => {
      Github.status = 1;
      return `${OAUTH_URL}/authorize?client_id=${client_id}&scope=gist`;
    },

    updateStatus: (callback) => {
      const access_token = localStorage.getObject('githubOauthAccessKey');
      if (access_token == null) {
        Github.status = 0;
        return;
      }
      const self = Github;
      Github.api('/user', (data) => {
        if (data.login === undefined) {
          self.status = 1;
        } else {
          self.status = 2;
          self.username = data.login;
        }
        if (callback != null) {
          callback(self.status);
        }
      });
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

    setStatus: (newStatus) => {
      Github.status = newStatus;
    },

    handleCallback: (code, cb) => {
      const url = `${OAUTH_URL}/access_token`;
      const data = {
        client_id,
        client_secret,
        code,
      };
      $.ajax({
        url,
        headers: {
          Accept: 'application/json',
        },
        dataType: 'json',
        data,
        success: (response) => {
          const ak = response.access_token;
          localStorage.setObject('githubOauthAccessKey', ak);
          if (cb !== undefined) {
            cb(ak);
          }
        },
      });
    },

    api: (apiPath, cb) => {
      const access_token = localStorage.getObject('githubOauthAccessKey') || '';
      const url = `${API_URL}${apiPath}?access_token=${access_token}`;
      $.get(url, (response) => {
        cb(response);
      });
    },

    logout: () => {
      localStorage.removeItem('githubOauthAccessKey');
      Github.status = 0;
    },

    isLoggedIn: () => localStorage.getObject('githubOauthAccessKey') !== null,

    deparam: params => (new URLSearchParams(params).keys).reduce((r, keys) => {
      r[keys] = params[keys]; // eslint-disable-line no-param-reassign
      return r;
    }, {}),
  };

  window.Github = Github;
}

github();
