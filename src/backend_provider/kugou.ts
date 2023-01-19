import axios from 'axios';
import { async_process, getParameterByName } from '../utils';
import { MusicProvider, MusicResource } from './types';

// https://www.cnblogs.com/willingtolove/p/11059325.html
function html2Escape(sHtml: string) {
  return sHtml.replace(/[<>&"]/g, (c: string) => {
    return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] || '';
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function escape2Html(str: string) {
  return str.replace(/&(lt|gt|nbsp|amp|quot);/gi, (all, t: string) => {
    return { lt: '<', gt: '>', nbsp: ' ', amp: '&', quot: '"' }[t] || '';
  });
}

const provider: MusicProvider = class kugou extends MusicResource {
  static Name = 'kugou';
  static id = 'kg';
  static searchable = true;
  static support_login = false;
  static hidden = false;
  static displayId = '_KUGOU_MUSIC';
  static kg_convert_song(song: any) {
    const track = {
      id: `kgtrack_${song.FileHash}`,
      title: song.SongName,
      artist: '',
      artist_id: '',
      album: song.AlbumName,
      album_id: `kgalbum_${song.AlbumID}`,
      source: 'kugou',
      source_url: `https://www.kugou.com/song/#hash=${song.FileHash}&album_id=${song.AlbumID}`,
      img_url: '',
      // url: `kgtrack_${song.FileHash}`,
      lyric_url: song.FileHash
    };
    let singer_id = song.SingerId;
    let singer_name = song.SingerName;
    if (song.SingerId instanceof Array) {
      [singer_id] = singer_id;
      [singer_name] = singer_name.split('、');
    }
    track.artist = singer_name;
    track.artist_id = `kgartist_${singer_id}`;
    return track;
  }

  static kg_render_search_result_item(index: any, item: any, params: any, callback: CallableFunction) {
    const track = kugou.kg_convert_song(item);
    // Add singer img
    const url = `${'https://www.kugou.com/yy/index.php?r=play/getdata&hash='}${track.lyric_url}`;
    axios.get(url).then((response) => {
      const { data } = response;
      track.img_url = data.data.img;
      callback(null, track);
    });
  }

  static async search(url: string) {
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
    const target_url = `${'https://songsearch.kugou.com/song_search_v2?keyword='}${keyword}&page=${curpage}`;
    try {
      const response = await axios.get(target_url);
      const { data } = response;
      const tracks = await async_process(data.data.lists, kugou.kg_render_search_result_item, []);
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

  static kg_render_playlist_result_item(index: any, item: any, params: any, callback: CallableFunction) {
    const { hash } = item;

    let target_url = `${'http://m.kugou.com/app/i/getSongInfo.php?cmd=playInfo&hash='}${hash}`;
    const track = {
      id: `kgtrack_${hash}`,
      title: '',
      artist: '',
      artist_id: '',
      album: '',
      album_id: `kgalbum_${item.album_id}`,
      source: 'kugou',
      source_url: `https://www.kugou.com/song/#hash=${hash}&album_id=${item.album_id}`,
      img_url: '',
      lyric_url: hash
    };
    // Fix song info
    axios.get(target_url).then((response) => {
      const { data } = response;
      track.title = data.songName;
      track.artist = data.singerId === 0 ? '未知' : data.singerName;
      track.artist_id = `kgartist_${data.singerId}`;
      if (data.album_img !== undefined) {
        track.img_url = data.album_img.replace('{size}', '400');
      } else {
        // track['img_url'] = data.imgUrl.replace('{size}', '400');
      }
      // Fix album
      target_url = `http://mobilecdnbj.kugou.com/api/v3/album/info?albumid=${item.album_id}`;
      axios.get(target_url).then((res) => {
        const { data: res_data } = res;
        if (res_data.status && res_data.data !== undefined && res_data.data !== null) {
          track.album = res_data.data.albumname;
        } else {
          track.album = '';
        }
        return callback(null, track);
      });
    });
  }

  static async kg_get_playlist(url: string) {
    const list_id = getParameterByName('list_id', url)?.split('_').pop();
    const target_url = `http://m.kugou.com/plist/list/${list_id}?json=true`;
    const { data } = await axios.get(target_url);

    const info = {
      cover_img_url: data.info.list.imgurl ? data.info.list.imgurl.replace('{size}', '400') : '',
      description: data.info.list.intro,
      title: data.info.list.specialname,
      id: `kgplaylist_${data.info.list.specialid}`,
      source_url: `https://www.kugou.com/yy/special/single/${data.info.list.specialid}.html`
    };
    const tracks = await async_process(data.list.list.info, this.kg_render_playlist_result_item, []);
    return { tracks, info };
  }

  static kg_render_artist_result_item(index: any, item: any, params: any, callback: CallableFunction) {
    const info = params[0];
    const track = {
      id: `kgtrack_${item.hash}`,
      title: '',
      artist: '',
      artist_id: info.id,
      album: '',
      album_id: `kgalbum_${item.album_id}`,
      source: 'kugou',
      source_url: `https://www.kugou.com/song/#hash=${item.hash}&album_id=${item.album_id}`,
      img_url: '',
      // url: `kgtrack_${item.hash}`,
      lyric_url: item.hash
    };
    const one = item.filename.split('-');
    track.title = one[1].trim();
    track.artist = one[0].trim();
    // Fix album name and img
    const target_url = `${'https://www.kugou.com/yy/index.php?r=play/getdata&hash='}${item.hash}`;
    axios.get(`http://mobilecdnbj.kugou.com/api/v3/album/info?albumid=${item.album_id}`).then((response) => {
      const { data } = response;
      if (data.status && data.data !== undefined) {
        track.album = data.data.albumname;
      } else {
        track.album = '';
      }
      axios.get(target_url).then((res) => {
        track.img_url = res.data.data.img;
        callback(null, track);
      });
    });
  }

  static async kg_artist(url: string) {
    const artist_id = getParameterByName('list_id', url)?.split('_').pop();
    let target_url = `http://mobilecdnbj.kugou.com/api/v3/singer/info?singerid=${artist_id}`;
    const { data } = await axios.get(target_url);
    const info = {
      cover_img_url: data.data.imgurl.replace('{size}', '400'),
      description: data.data.profile,
      title: data.data.singername,
      id: `kgartist_${artist_id}`,
      source_url: 'https://www.kugou.com/singer/{id}.html'.replace('{id}', artist_id || '')
    };
    target_url = `http://mobilecdnbj.kugou.com/api/v3/singer/song?singerid=${artist_id}&page=1&pagesize=30`;
    const res = await axios.get(target_url);
    const tracks = await async_process(res.data.data.info, this.kg_render_artist_result_item, [info]);
    return { tracks, info };
  }

  static getTimestampString() {
    return new Date().getTime().toString();
  }

  static getRandomIntString() {
    return (Math.random() * 100).toString().replace(/\D/g, '');
  }

  static getRandomHexString() {
    let result = '';
    const letters = '0123456789abcdef';
    for (let i = 0; i < 16; i += 1) {
      result += letters[Math.floor(Math.random() * 16)];
    }
    return result;
  }
  static async init(track: any) {
    const track_id = track.id.slice('kgtrack_'.length);
    const album_id = track.album_id.slice('kgalbum_'.length);
    let target_url = `https://wwwapi.kugou.com/yy/index.php?r=play/getdata&callback=jQuery&hash=${track_id}&platid=4`;
    if (album_id !== '') {
      target_url += `&album_id=${album_id}`;
    }
    const timstamp = +new Date();
    target_url += `&_=${timstamp}`;
    const { data } = await axios.get(target_url);
    const jsonString = data.slice('jQuery('.length, data.length - 1 - 1);
    const info = JSON.parse(jsonString);
    const { play_url } = info.data;
    if (play_url === '') {
      throw 'kugou:init(): empty play url';
    }
    return {
      url: play_url,
      bitrate: `${info.data.bitrate}kbps`,
      platform: 'kugou'
    };
  }
  static bootstrapTrack(track: any, success: CallableFunction, failure: CallableFunction) {
    let sound = {};
    const track_id = track.id.slice('kgtrack_'.length);
    const album_id = track.album_id.slice('kgalbum_'.length);
    let target_url = `https://wwwapi.kugou.com/yy/index.php?r=play/getdata&callback=jQuery&hash=${track_id}&platid=4`;
    if (album_id !== '') {
      target_url += `&album_id=${album_id}`;
    }
    const timstamp = +new Date();
    target_url += `&_=${timstamp}`;
    axios
      .get(target_url)
      .then((response) => {
        const { data } = response;
        const jsonString = data.slice('jQuery('.length, data.length - 1 - 1);
        const info = JSON.parse(jsonString);
        const { play_url } = info.data;

        if (play_url === '') {
          return failure(sound);
        }
        sound = {
          url: play_url,
          bitrate: `${info.data.bitrate}kbps`,
          platform: 'kugou'
        };

        return success(sound);
      })
      .catch(() => failure(sound));
  }

  static async lyric(url: string) {
    const track_id = getParameterByName('track_id', url)?.split('_').pop();
    const album_id = getParameterByName('album_id', url)?.split('_').pop();
    let lyric_url = `https://wwwapi.kugou.com/yy/index.php?r=play/getdata&callback=jQuery&hash=${track_id}&platid=4&album_id=${album_id}`;
    const timstamp = +new Date();
    lyric_url += `&_=${timstamp}`;
    const { data } = await axios.get(lyric_url);
    const jsonString = data.slice('jQuery('.length, data.length - 1 - 1);
    const info = JSON.parse(jsonString);
    return {
      lyric: info.data.lyrics
    };
  }

  static kg_render_album_result_item(index: any, item: any, params: any, callback: CallableFunction) {
    const info = params[0];
    const album_id = params[1];
    const track = {
      id: `kgtrack_${item.hash}`,
      title: '',
      artist: '',
      artist_id: '',
      album: info.title,
      album_id: `kgalbum_${album_id}`,
      source: 'kugou',
      source_url: `https://www.kugou.com/song/#hash=${item.hash}&album_id=${album_id}`,
      img_url: '',
      // url: `xmtrack_${item.hash}`,
      lyric_url: item.hash
    };
    // Fix other data
    const target_url = `${'http://m.kugou.com/app/i/getSongInfo.php?cmd=playInfo&hash='}${item.hash}`;
    axios.get(target_url).then((response) => {
      const { data } = response;
      track.title = data.songName;
      track.artist = data.singerId === 0 ? '未知' : data.singerName;
      track.artist_id = `kgartist_${data.singerId}`;
      track.img_url = data.imgUrl?.replace('{size}', '400');
      callback(null, track);
    });
  }

  static async kg_album(url: string) {
    const album_id = getParameterByName('list_id', url)?.split('_').pop();
    let target_url = `${'http://mobilecdnbj.kugou.com/api/v3/album/info?albumid='}${album_id}`;

    // info
    const response = await axios.get(target_url);
    const { data } = response;
    const info = {
      cover_img_url: data.data.imgurl.replace('{size}', '400'),
      description: data.data.intro,
      title: data.data.albumname,
      id: `kgalbum_${data.data.albumid}`,
      source_url: 'https://www.kugou.com/album/{id}.html'.replace('{id}', data.data.albumid)
    };

    target_url = `${'http://mobilecdnbj.kugou.com/api/v3/album/song?albumid='}${album_id}&page=1&pagesize=-1`;
    const res = await axios.get(target_url);
    const tracks = await async_process(res.data.data.info, this.kg_render_album_result_item, [info, album_id]);
    return { tracks, info };
  }

  static async showPlaylist(url: string) {
    let offset = Number(getParameterByName('offset', url));
    if (offset === undefined) {
      offset = 0;
    }
    // const page = offset / 30 + 1;
    const params = { page: offset };
    const { data } = await axios.get("http://localhost:3030/kugou/playlists", { params });
    return data;
  }

  static async parseUrl(url: string) {
    let result;
    const match = /\/\/www.kugou.com\/yy\/special\/single\/([0-9]+).html/.exec(url);
    if (match != null) {
      const playlist_id = match[1];
      result = {
        type: 'playlist',
        id: `kgplaylist_${playlist_id}`
      };
    }
    return result;
  }

  static getPlaylist(url: string) {
    // eslint-disable-line no-unused-vars
    const list_id = getParameterByName('list_id', url)?.split('_')[0];
    switch (list_id) {
      case 'kgplaylist':
        return this.kg_get_playlist(url);
      case 'kgalbum':
        return this.kg_album(url);
      case 'kgartist':
        return this.kg_artist(url);
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
    return `https://www.kugou.com`;
  }

  static logout() {
    // empty block
  }

  static async getCommentList(trackId: string, offset: number, limit: number) {
    limit = 20;
    const page = offset / limit + 1;
    const kugouId = trackId.split('_')[1];

    // https://github.com/lyswhut/lx-music-desktop/blob/master/src/renderer/utils/music/kg/comment.js
    // code is magic string and do not modify
    const target_url = `http://comment.service.kugou.com/index.php?r=commentsv2/getCommentWithLike&code=fc4be23b4e972707f36b8a828a93ba8a&extdata=${kugouId}&p=${page}&pagesize=${limit}`;

    const response = await axios.get(target_url);

    let comments = [];
    if (response.data.weightList) {
      comments = response.data.weightList.map((item: any) => {
        const data = {
          id: item.id,
          content: html2Escape(item.content || ''),
          time: item.addtime,
          nickname: item.user_name,
          avatar: item.user_pic,
          user_id: item.user_id,
          like: item.like.likenum,
          reply: []
        };

        return item.pcontent
          ? {
              id: item.id,
              content: html2Escape(item.pcontent),
              nickname: item.puser,
              avatar: null,
              user_id: item.puser_id,
              reply: [data]
            }
          : data;
      });
    }
    return { comments, total: comments.length, offset, limit };
  }
};

export default provider;
