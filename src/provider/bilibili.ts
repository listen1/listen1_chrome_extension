import axios from 'axios';
import { cookieGetPromise, cookieSetPromise, getParameterByName, htmlDecode } from '../utils';
import { MusicProvider, MusicResource } from './types';

const provider: MusicProvider = class bilibili extends MusicResource {
  static Name = 'bilibili';
  static id = 'bi';
  static searchable = false;
  static support_login = false;
  static hidden = false;
  static displayId = '_BILIBILI_MUSIC';
  static bi_convert_song(song_info: any) {
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

  static bi_convert_song2(song_info: any) {
    let imgUrl = song_info.pic;
    if (imgUrl.startsWith('//')) {
      imgUrl = `https:${imgUrl}`;
    }
    const track = {
      id: `bitrack_v_${song_info.bvid}`,
      title: htmlDecode(song_info.title),
      artist: htmlDecode(song_info.author),
      artist_id: `biartist_v_${song_info.mid}`,
      source: 'bilibili',
      source_url: `https://www.bilibili.com/${song_info.bvid}`,
      img_url: imgUrl
    };
    return track;
  }

  static async showPlaylist(url: string) {
    const offset = Number(getParameterByName('offset', url) || '0');
    const page = offset / 20 + 1;
    const target_url = `https://www.bilibili.com/audio/music-service-c/web/menu/hit?ps=20&pn=${page}`;

    const response = await axios.get(target_url);
    const { data } = response.data.data;
    /** @type {{cover_img_url:string;id:string;source_url:string;title:string}[]}*/
    const result = data.map((item: any) => ({
      cover_img_url: item.cover,
      title: item.title,
      id: `biplaylist_${item.menuId}`,
      source_url: `https://www.bilibili.com/audio/am${item.menuId}`
    }));
    return result;
  }

  static async bi_get_playlist(url: string) {
    const list_id = getParameterByName('list_id', url)?.split('_').pop();
    const target_url = `https://www.bilibili.com/audio/music-service-c/web/menu/info?sid=${list_id}`;
    const target = `https://www.bilibili.com/audio/music-service-c/web/song/of-menu?pn=1&ps=100&sid=${list_id}`;
    const getInfo = async () => {
      const { data } = (await axios.get(target_url)).data;
      return {
        cover_img_url: data.cover,
        description: data.intro,
        title: data.title,
        id: `biplaylist_${list_id}`,
        source_url: `https://www.bilibili.com/audio/am${list_id}`
      };
    };
    const getTracks = async () => {
      const { data } = await axios.get(target);
      const tracks = data.data.data.map((item: any) => this.bi_convert_song(item));
      return tracks;
    };
    const [info, tracks] = await Promise.all([getInfo(), getTracks()]);
    return {
      info,
      tracks
    };
  }

  static async bi_album(url: string) {
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

  static async bi_artist(url: string) {
    const artist_id = getParameterByName('list_id', url)?.split('_').pop();
    const target_url = `https://api.bilibili.com/x/space/acc/info?mid=${artist_id}&jsonp=jsonp`;
    const target = `https://api.bilibili.com/audio/music-service-c/web/song/upper?pn=1&ps=0&order=2&uid=${artist_id}`;
    const getInfo = async () => {
      const { data } = await axios.get(target_url);
      return {
        cover_img_url: data.data.face,
        description: data.data.sign,
        title: data.data.name,
        id: `biartist_${artist_id}`,
        source_url: `https://space.bilibili.com/${artist_id}/#/audio`
      };
    };
    const getTracks = async () => {
      const { data } = await axios.get(target);
      return data.data.data.map((item: any) => this.bi_convert_song(item));
    };
    const [tracks, info] = await Promise.all([getTracks(), getInfo()]);
    return {
      tracks,
      info
    };
  }

  static async parseUrl(url: string) {
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
  static async init(track: any) {
    const song_id = track.id.slice('bitrack_'.length);
    const target_url = `https://www.bilibili.com/audio/music-service-c/web/url?sid=${song_id}`;
    const { data } = await axios.get(target_url);
    if (data.code === 0) {
      return { url: data.data.cdns[0], platform: 'bilibili' };
    } else {
      throw `bilibili:init(): invalid data ${JSON.stringify(data)}`;
    }
  }
  static bootstrapTrack(track: any, success: CallableFunction, failure: CallableFunction) {
    const sound = {} as any;
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

  static async search(url: string) {
    const keyword = getParameterByName('keywords', url) as string;
    const curpage = getParameterByName('curpage', url);
    const target_url = `https://api.bilibili.com/x/web-interface/search/type?__refresh__=true&_extra=&context=&page=${curpage}&page_size=42&platform=pc&highlight=1&single_column=0&keyword=${encodeURIComponent(
      keyword
    )}&category_id=&search_type=video&dynamic_offset=0&preload=true&com2co=true`;
    const domain = `https://api.bilibili.com`;
    const cookieName = 'buvid3';
    const expire = (new Date().getTime() + 1e3 * 60 * 60 * 24 * 365 * 100) / 1000;

    const cookie = await cookieGetPromise({
      url: domain,
      name: cookieName
    });
    if (cookie == null) {
      await cookieSetPromise({
        url: domain,
        name: cookieName,
        value: '0',
        expirationDate: expire,
        sameSite: 'no_restriction'
      });
    }
    const { data } = await axios.get(target_url);
    const result = data.data.result.map(this.bi_convert_song2);
    const total = data.data.numResult;
    return { result, total };
  }

  static async lyric(url: string) {
    // const track_id = getParameterByName('track_id', url).split('_').pop();
    const lyric_url = getParameterByName('lyric_url', url) || '';
    const { data } = await axios.get(lyric_url);
    return { lyric: data };
  }

  static getPlaylist(url: string) {
    const list_id = getParameterByName('list_id', url)?.split('_')[0];
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

  static async getCommentList(trackId: string, offset: number, limit: number) {
    const comments = <any>[];
    return { comments, total: comments.length, offset, limit };
  }
};

export default provider;
