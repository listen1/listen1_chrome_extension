/* global forge */
// eslint-disable-next-line no-unused-vars
{
  const options = {
    apiKey: '6790c00a181128dc7c4ce06cd99d17c8',
    apiSecret: 'd68f1dfc6ff43044c96a79ae7dfb5c27',
  };

  const apiUrl = 'https://ws.audioscrobbler.com/2.0/';

  let status = 0;

  // const publicApi = {
  //   getAuth,
  //   cancelAuth,
  //   getSession,
  //   sendNowPlaying,
  //   scrobble,
  //   getUserInfo,
  //   getStatusText,
  //   updateStatus,
  //   isAuthorized,
  //   isAuthRequested,
  // };

  /**
   * Computes string for signing request
   *
   * See https://www.last.fm/api/authspec#8
   */
  const generateSign = (params) => {
    const keys = Object.keys(params).filter(
      (key) => key !== 'format' || key !== 'callback'
    );

    // params has to be ordered alphabetically
    keys.sort();

    const o = keys.reduce((r, key) => r + key + params[key], '');

    // append secret
    return forge.md5
      .create()
      .update(forge.util.encodeUtf8(o + options.apiSecret))
      .digest()
      .toHex();
  };

  // eslint-disable-next-line no-underscore-dangle
  const _isAuthRequested = () => {
    const token = localStorage.getObject('lastfmtoken');
    return token != null;
  };

  // eslint-disable-next-line no-unused-vars
  class lastfm {

    static getSession(callback) {
      // load session info from localStorage
      let mySession = localStorage.getObject('lastfmsession');
      if (mySession != null) {
        return callback(mySession);
      }
      // trade session with token
      const token = localStorage.getObject('lastfmtoken');
      if (token == null) {
        return callback(null);
      }
      // token exists
      const params = {
        method: 'auth.getsession',
        api_key: options.apiKey,
        token,
      };
      params.api_sig = generateSign(params);
      params.format = 'json';

      axios
        .get(apiUrl, {
          params
        })
        .then((response) => {
          const { data } = response;
          mySession = data.session;
          localStorage.setObject('lastfmsession', mySession);
          callback(mySession);
        })
        .catch((error) => {
          if (error.response.status === 403) {
            callback(null);
          }
        });
      return null;
    }

    static getUserInfo(callback) {
      this.getSession((session) => {
        if (session == null) {
          callback(null);
          return;
        }
        const params = {
          method: 'user.getinfo',
          api_key: options.apiKey,
          sk: session.key,
        };

        params.api_sig = generateSign(params);
        params.format = 'json';

        axios.post(apiUrl, '', {
          params,
        }).then((response) => {
          const { data } = response;
          if (callback != null) {
            callback(data);
          }
        });
      });
    }

    static updateStatus() {
      // auth status
      // 0: never request for auth
      // 1: request but fail to success
      // 2: success auth
      if (!_isAuthRequested()) {
        status = 0;
        return;
      }
      this.getUserInfo((data) => {
        if (data === null) {
          status = 1;
        } else {
          status = 2;
        }
      });
    }

    static getAuth(callback) {
      axios.get(apiUrl, {
        params: {
          method: 'auth.gettoken',
          api_key: options.apiKey,
          format: 'json',
        },
      }).then((response) => {
        const { data } = response;
        const { token } = data;
        localStorage.setObject('lastfmtoken', token);
        const grant_url = `https://www.last.fm/api/auth/?api_key=${options.apiKey}&token=${token}`;
        window.open(grant_url, '_blank');
        status = 1;
        if (callback != null) {
          callback();
        }
      });
    }

    static cancelAuth() {
      localStorage.removeItem('lastfmsession');
      localStorage.removeItem('lastfmtoken');
      this.updateStatus();
    }

    static sendNowPlaying(track, artist, callback) {
      this.getSession((session) => {
        const params = {
          method: 'track.updatenowplaying',
          track,
          artist,
          api_key: options.apiKey,
          sk: session.key,
        };

        params.api_sig = generateSign(params);
        params.format = 'json';

        axios.post(apiUrl, '', {
          params
        }).then((response) => {
          const { data } = response;
          if (callback != null) {
            callback(data);
          }
        });
      });
    }

    static scrobble(timestamp, track, artist, album, callback) {
      this.getSession((session) => {
        const params = {
          method: 'track.scrobble',
          'timestamp[0]': timestamp,
          'track[0]': track,
          'artist[0]': artist,
          api_key: options.apiKey,
          sk: session.key,
        };

        if (album !== '' && album != null) {
          params['album[0]'] = album;
        }

        params.api_sig = generateSign(params);
        params.format = 'json';

        axios.post(apiUrl, '', {
          params,
        }).then((response) => {
          const { data } = response;
          if (callback != null) {
            callback(data);
          }
        });
      });
    }

    static isAuthorized() {
      return status === 2;
    }

    static isAuthRequested() {
      return !(status === 0);
    }

    static getStatusText() {
      switch (status) {
        case 0:
          return '未连接';
        case 1:
          return '连接中';
        case 2:
          return '已连接';
        default:
          return '';
      }
    }
  }

  window.lastfm = lastfm;
}

