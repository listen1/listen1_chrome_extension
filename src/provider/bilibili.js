import axios from 'axios';
import { getParameterByName } from '../utils';
import MusicResource from './music_resource';

export default class bilibili extends MusicResource {
  static bi_convert_song(song_info) {
    const track = {
      id: `bitrack_${song_info.id}`,
      title: song_info.title,
      artist: song_info.uname,
      artist_id: `biartist_${song_info.uid}`,
      source: 'bilibili',
      source_url: `https://www.bilibili.com/audio/au${song_info.id}`,
      img_url: song_info.cover,
      // url: song_info.id,
      lyric_url: song_info.lyric
    };
    return track;
  }

  static async showPlaylist(url) {
    let offset = getParameterByName('offset', url);
    if (offset === undefined) {
      offset = 0;
    }
    const page = offset / 20 + 1;
    const target_url = `https://www.bilibili.com/audio/music-service-c/web/menu/hit?ps=20&pn=${page}`;

    const response = await axios.get(target_url);
    const { data } = response.data.data;
    /** @type {{cover_img_url:string;id:string;source_url:string;title:string}[]}*/
    const result = data.map((item) => ({
      cover_img_url: item.cover,
      title: item.title,
      id: `biplaylist_${item.menuId}`,
      source_url: `https://www.bilibili.com/audio/am${item.menuId}`
    }));
    return result;
  }

  static async bi_get_playlist(url) {
    const list_id = getParameterByName('list_id', url).split('_').pop();
    const target_url = `https://www.bilibili.com/audio/music-service-c/web/menu/info?sid=${list_id}`;
    const target = `https://www.bilibili.com/audio/music-service-c/web/song/of-menu?pn=1&ps=100&sid=${list_id}`;
    const getInfo = async () => {
      const { data } = (await axios.get(target_url)).data;
      return {
        cover_img_url: data.cover,
        title: data.title,
        id: `biplaylist_${list_id}`,
        source_url: `https://www.bilibili.com/audio/am${list_id}`
      };
    };
    const getTracks = async () => {
      const { data } = await axios.get(target);
      const tracks = data.data.data.map((item) => this.bi_convert_song(item));
      return tracks;
    };
    const [info, tracks] = await Promise.all([getInfo(), getTracks()]);
    return {
      info,
      tracks
    };
  }

  static async bi_album() {
    return {
      tracks: [],
      info: {}
    };
    // bilibili havn't album
    // const album_id = getParameterByName('list_id', url).split('_').pop();
    // const target_url = '';
    // axios.get(target_url).then((response) => {
    //   const data = response.data;
    //   const info = {};
    //   const tracks = [];
    //   return fn({
    //     tracks,
    //     info,
    //   });
    // });
  }

  static async bi_artist(url) {
    const artist_id = getParameterByName('list_id', url).split('_').pop();
    const target_url = `https://api.bilibili.com/x/space/acc/info?mid=${artist_id}&jsonp=jsonp`;
    const target = `https://api.bilibili.com/audio/music-service-c/web/song/upper?pn=1&ps=0&order=2&uid=${artist_id}`;
    const getInfo = async () => {
      const { data } = await axios.get(target_url);
      return {
        cover_img_url: data.data.face,
        title: data.data.name,
        id: `biartist_${artist_id}`,
        source_url: `https://space.bilibili.com/${artist_id}/#/audio`
      };
    };
    const getTracks = async () => {
      const { data } = await axios.get(target);
      return data.data.data.map((item) => this.bi_convert_song(item));
    };
    const [tracks, info] = await Promise.all([getTracks(), getInfo()]);
    return {
      tracks,
      info
    };
  }

  static async parseUrl(url) {
    let result;
    const match = /\/\/www.bilibili.com\/audio\/am([0-9]+)/.exec(url);
    if (match != null) {
      const playlist_id = match[1];
      result = {
        type: 'playlist',
        id: `biplaylist_${playlist_id}`
      };
    }
    return result;
  }

  static bootstrapTrack(track, success, failure) {
    const sound = {};
    const song_id = track.id.slice('bitrack_'.length);
    const target_url = `https://www.bilibili.com/audio/music-service-c/web/url?sid=${song_id}`;
    axios
      .get(target_url)
      .then((response) => {
        const { data } = response;
        if (data.code === 0) {
          [sound.url] = data.data.cdns;
          sound.platform = 'bilibili';

          success(sound);
        } else {
          failure(sound);
        }
      })
      .catch(() => failure(sound));
  }

  static async search(url) {
    const keyword = getParameterByName('keywords', url);
    const au = /\d+$/.exec(keyword);
    if (au != null) {
      const target_url = `https://www.bilibili.com/audio/music-service-c/web/song/info?sid=${au}`;
      const response = await axios.get(target_url);
      const { data } = response.data;
      const tracks = [this.bi_convert_song(data)];
      return {
        result: tracks,
        total: 1
      };
    } else {
      return {
        result: [],
        total: 0
      };
    }
    // eslint-disable-next-line no-unreachable
    // const target_url = `https://api.bilibili.com/x/web-interface/search/type?search_type=audio&keyword=${keyword}&page=${curpage}`;
    // axios.get(target_url).then((response) => {
    //   const { data } = response.data;
    //   const tracks = data.result.map((item) => this.bi_convert_song(item));
    //   return fn({
    //     result: tracks,
    //     total: data.numResults
    //   });
    // });
    // return null;
  }

  static async lyric(url) {
    // const track_id = getParameterByName('track_id', url).split('_').pop();
    const lyric_url = getParameterByName('lyric_url', url);
    const { data } = await axios.get(lyric_url);
    return { lyric: data };
  }

  static getPlaylist(url) {
    const list_id = getParameterByName('list_id', url).split('_')[0];
    switch (list_id) {
      case 'biplaylist':
        return this.bi_get_playlist(url);
      case 'bialbum':
        return this.bi_album(url);
      case 'biartist':
        return this.bi_artist(url);
      default:
        return null;
    }
  }

  static async getPlaylistFilters() {
    return {
      recommend: [],
      all: []
    };
  }

  static async getUser() {
    return { status: 'fail', data: {} };
  }

  static getLoginUrl() {
    return `https://www.bilibili.com`;
  }

  static logout() {
    // empty block
  }
  
  static async getCommentList(trackId, offset, limit) {
    const comments = [];
    return { comments, total: comments.length, offset, limit };
  }
}
