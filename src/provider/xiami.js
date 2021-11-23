import MusicResource from './music_resource';

export default class xiami extends MusicResource {
  static show_playlist() {
    return [];
  }

  // eslint-disable-next-line no-unused-vars
  static bootstrap_track(track, success, failure) {
    const sound = {};
    failure(sound);
  }

  static async xm_get_playlist(url) {
    const list_id = getParameterByName('list_id', url).split('_').pop();
    return {
      tracks: [],
      info: {
        cover_img_url: '',
        title: '',
        id: `xmplaylist_${list_id}`,
        source_url: `https://www.xiami.com/collect/${list_id}`
      }
    };
  }

  static async search(url) {
    const searchType = getParameterByName('type', url);
    return {
      result: [],
      total: 0,
      type: searchType
    };
  }

  static async xm_album(url) {
    const album_id = getParameterByName('list_id', url).split('_').pop();
    return {
      tracks: [],
      info: {
        cover_img_url: '',
        title: album_id,
        id: `xmalbum_${album_id}`,
        source_url: `https://www.xiami.com/album/${album_id}`
      }
    };
  }

  static async xm_artist(url) {
    const artist_id = getParameterByName('list_id', url).split('_').pop();

    return {
      tracks: [],
      info: {
        cover_img_url: '',
        title: artist_id,
        id: `xmartist_${artist_id}`,
        source_url: `https://www.xiami.com/artist/${artist_id}`
      }
    };
  }

  static async lyric() {
    return {
      lyric: '',
      tlyric: ''
    };
  }

  static parse_url() {
    let result;
    return {
      success: (fn) => {
        fn(result);
      }
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
      success: (fn) => fn({ recommend: [], all: [] })
    };
  }

  static async get_user() {
    return { status: 'fail', data: {} };
  }

  static get_login_url() {
    return `https://www.xiami.com`;
  }

  static logout() {}
}
