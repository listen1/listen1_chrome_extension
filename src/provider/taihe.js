import axios from 'axios';
import concat from 'async-es/concat';
import forge from 'node-forge';
import { getParameterByName } from './lowebutil';

const axiosTH = axios.create({
  baseURL: 'https://music.taihe.com/v1'
});
axiosTH.interceptors.request.use(
  (config) => {
    const params = { ...config.params };
    params.timestamp = Math.round(Date.now() / 1000);
    params.appid = '16073360';
    const q = new URLSearchParams(params);
    q.sort();
    const signStr = decodeURIComponent(`${q.toString()}0b50b02fd0d73a9c4c8c3a781c30845f`);
    params.sign = forge.md.md5.create().update(forge.util.encodeUtf8(signStr)).digest().toHex();

    return { ...config, params };
  },
  null,
  { synchronous: true }
);

export default class taihe {
  static th_convert_song(song) {
    const track = {
      id: `thtrack_${song.id}`,
      title: song.title,
      album: song.albumTitle,
      album_id: `thalbum_${song.albumAssetCode}`,
      source: 'taihe',
      source_url: `https://music.taihe.com/song/${song.id}`,
      img_url: song.pic,
      lyric_url: song.lyric || ''
    };
    if (song.artist && song.artist.length) {
      track.artist = song.artist[0].name;
      track.artist_id = `thartist_${song.artist[0].artistCode}`;
    }
    return track;
  }

  static th_render_tracks(url, page, callback) {
    const list_id = getParameterByName('list_id', url).split('_').pop();
    axiosTH
      .get('/tracklist/info', {
        params: {
          id: list_id,
          pageNo: page,
          pageSize: 100
        }
      })
      .then((response) => {
        const data = response.data.data.trackList;
        const tracks = data.map(this.th_convert_song);
        return callback(null, tracks);
      });
  }

  static async search(url) {
    const keyword = getParameterByName('keywords', url);
    const curpage = getParameterByName('curpage', url);
    const searchType = getParameterByName('type', url);
    if (searchType === '1') {
      return {
        result: [],
        total: 0,
        type: searchType
      };
    }
    try {
      const res = await axiosTH.get('/search', {
        params: {
          word: keyword,
          pageNo: curpage || 1,
          type: 1
        }
      });
      const { data } = res;
      const tracks = data.data.typeTrack.map(this.th_convert_song);
      return {
        result: tracks,
        total: data.data.total,
        type: searchType
      };
    } catch (err) {
      return {
        result: [],
        total: 0,
        type: searchType
      };
    }
  }

  static async th_get_playlist(url) {
    const list_id = getParameterByName('list_id', url).split('_').pop();
    const response = await axiosTH.get('/tracklist/info', {
      params: {
        id: list_id
      }
    });

    const { data } = response.data;

    const info = {
      cover_img_url: data.pic,
      title: data.title,
      id: `thplaylist_${list_id}`,
      source_url: `https://music.taihe.com/songlist/${list_id}`
    };

    const total = data.trackCount;
    const page = Math.ceil(total / 100);
    const page_array = Array.from({ length: page }, (v, k) => k + 1);
    const tracks = await concat(page_array, (item, callback) => this.th_render_tracks(url, item, callback));
    return { tracks, info };
  }

  static async th_artist(url) {
    const artist_id = getParameterByName('list_id', url).split('_').pop();
    const response = await axiosTH.get('/artist/info', {
      params: {
        artistCode: artist_id
      }
    });
    const info = {
      cover_img_url: response.data.data.pic,
      title: response.data.data.name,
      id: `thartist_${artist_id}`,
      source_url: `https://music.taihe.com/artist/${artist_id}`
    };
    const res = await axiosTH.get('/artist/song', {
      params: {
        artistCode: artist_id,
        pageNo: 1,
        pageSize: 50
      }
    });
    const tracks = res.data.data.result.map(this.th_convert_song);
    return {
      tracks,
      info
    };
  }

  static bootstrap_track(track, success, failure) {
    const sound = {};
    const song_id = track.id.slice('thtrack_'.length);
    axiosTH
      .get('/song/tracklink', {
        params: {
          TSID: song_id
        }
      })
      .then((response) => {
        const { data } = response;
        if (data.data && data.data.path) {
          sound.url = data.data.path;
          sound.platform = 'taihe';
          sound.bitrate = `${data.data.rate}kbps`;

          success(sound);
        } else {
          failure(sound);
        }
      });
  }

  static async lyric(url) {
    const lyric_url = getParameterByName('lyric_url', url);
    if (lyric_url) {
      const { data } = await axios.get(lyric_url);
      return { lyric: data };
    } else {
      const track_id = getParameterByName('track_id', url).split('_').pop();
      const { data } = await axiosTH.get('/song/tracklink', {
        params: {
          TSID: track_id
        }
      });
      const res = await axios.get(data.data.lyric);
      return { lyric: res.data };
    }
  }

  static async th_album(url) {
    const album_id = getParameterByName('list_id', url).split('_').pop();
    const response = await axiosTH.get('/album/info', {
      params: {
        albumAssetCode: album_id
      }
    });

    const { data } = response.data;
    const info = {
      cover_img_url: data.pic,
      title: data.title,
      id: `thalbum_${album_id}`,
      source_url: `https://music.taihe.com/album/${album_id}`
    };

    const tracks = data.trackList.map((song) => ({
      id: `thtrack_${song.assetId}`,
      title: song.title,
      artist: song.artist ? song.artist[0].name : '',
      artist_id: song.artist ? `thartist_${song.artist[0].artistCode}` : 'thartist_',
      album: info.title,
      album_id: `thalbum_${album_id}`,
      source: 'taihe',
      source_url: `https://music.taihe.com/song/${song.assetId}`,
      img_url: info.cover_img_url,
      lyric_url: ''
    }));
    return {
      tracks,
      info
    };
  }

  static async show_playlist(url) {
    const offset = Number(getParameterByName('offset', url));
    const subCate = getParameterByName('filter_id', url);
    const { data } = await axiosTH.get('/tracklist/list', {
      params: {
        pageNo: offset / 25 + 1,
        pageSize: 25,
        subCateId: subCate
      }
    });
    /** @type {{cover_img_url:string;id:string;source_url:string;title:string}[]}*/
    const result = data.data.result.map((item) => ({
      cover_img_url: item.pic,
      title: item.title,
      id: `thplaylist_${item.id}`,
      source_url: `https://music.taihe.com/songlist/${item.id}`
    }));
    return result;
  }

  static parse_url(url) {
    let result;
    let id = '';
    let match = /\/\/music.taihe.com\/([a-z]+)\//.exec(url);
    if (match) {
      switch (match[1]) {
        case 'songlist':
          match = /\/\/music.taihe.com\/songlist\/([0-9]+)/.exec(url);
          id = match ? `thplaylist_${match[1]}` : '';
          break;
        case 'artist':
          match = /\/\/music.taihe.com\/artist\/(A[0-9]+)/.exec(url);
          id = match ? `thartist_${match[1]}` : '';
          break;
        case 'album':
          match = /\/\/music.taihe.com\/album\/(P[0-9]+)/.exec(url);
          id = match ? `thalbum_${match[1]}` : '';
          break;
        default:
          break;
      }
      result = {
        type: 'playlist',
        id
      };
    }
    return {
      success: (fn) => {
        fn(result);
      }
    };
  }

  static get_playlist(url) {
    const list_id = getParameterByName('list_id', url).split('_')[0];
    switch (list_id) {
      case 'thplaylist':
        return this.th_get_playlist(url);
      case 'thalbum':
        return this.th_album(url);
      case 'thartist':
        return this.th_artist(url);
      default:
        return null;
    }
  }

  static async get_playlist_filters() {
    const res = await axiosTH.get('/tracklist/category');
    return {
      recommend: [{ id: '', name: '推荐歌单' }],
      all: res.data.data.map((sub) => ({
        category: sub.categoryName,
        filters: sub.subCate.map((i) => ({
          id: i.id,
          name: i.categoryName
        }))
      }))
    };
  }

  static get_user() {
    return { status: 'fail', data: {} };
  }

  static get_login_url() {
    return `https://music.taihe.com`;
  }

  static logout() {}
}
