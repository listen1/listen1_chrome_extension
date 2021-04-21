/* eslint-disable radix */
/* eslint-disable no-use-before-define */
/* global getParameterByName */
/* eslint-disable no-param-reassign */
// eslint-disable-next-line no-unused-vars
class xiami {
  static show_playlist() {
    return {
      success: (fn) =>
        fn({
          result: [],
        }),
    };
  }

  // eslint-disable-next-line no-unused-vars
  static bootstrap_track(track, success, failure) {
    const sound = {};
    failure(sound);
  }

  static xm_get_playlist(url) {
    const list_id = getParameterByName('list_id', url).split('_').pop();
    return {
      success: (fn) =>
        fn({
          tracks: [],
          info: {
            cover_img_url: '',
            title: '',
            id: `xmplaylist_${list_id}`,
            source_url: `https://www.xiami.com/collect/${list_id}`,
          },
        }),
    };
  }

  static xm_search(url) {
    const searchType = getParameterByName('type', url);

    return {
      success: (fn) =>
        fn({
          result: [],
          total: 0,
          type: searchType,
        }),
    };
  }

  static xm_album(url) {
    return {
      success: (fn) => {
        const album_id = getParameterByName('list_id', url).split('_').pop();

        return fn({
          tracks: [],
          info: {
            cover_img_url: '',
            title: album_id,
            id: `xmalbum_${album_id}`,
            source_url: `https://www.xiami.com/album/${album_id}`,
          },
        });
      },
    };
  }

  static xm_artist(url) {
    return {
      success: (fn) => {
        const artist_id = getParameterByName('list_id', url).split('_').pop();

        return fn({
          tracks: [],
          info: {
            cover_img_url: '',
            title: artist_id,
            id: `xmartist_${artist_id}`,
            source_url: `https://www.xiami.com/artist/${artist_id}`,
          },
        });
      },
    };
  }

  static lyric() {
    return {
      success: (fn) =>
        fn({
          lyric: '',
          tlyric: '',
        }),
    };
  }

  static parse_url() {
    let result;
    return {
      success: (fn) => {
        fn(result);
      },
    };
  }

  static get_playlist(url) {
    const list_id = getParameterByName('list_id', url).split('_')[0];
    switch (list_id) {
      case 'xmplaylist':
        return this.xm_get_playlist(url);
      case 'xmalbum':
        return this.xm_album(url);
      case 'xmartist':
        return this.xm_artist(url);
      default:
        return null;
    }
  }

  static get_playlist_filters() {
    return {
      success: (fn) => fn({ recommend: [], all: [] }),
    };
  }

  static get_user() {
    return {
      success: (fn) => {
        fn({ status: 'fail', data: {} });
      },
    };
  }

  static get_login_url() {
    return `https://www.xiami.com`;
  }

  static logout() {}

  // return {
  //   show_playlist: xm_show_playlist,
  //   get_playlist_filters,
  //   get_playlist,
  //   parse_url: xm_parse_url,
  //   bootstrap_track: xm_bootstrap_track,
  //   search: xm_search,
  //   lyric: xm_lyric,
  //   get_user: xm_get_user,
  //   get_login_url: xm_get_login_url,
  //   logout: xm_logout,
  // };
}
