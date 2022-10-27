import axios from 'axios';
import forge from 'node-forge';
import { cookieGetPromise, cookieRemove, cookieSet, cookieSetPromise, getParameterByName } from '../utils';
import { MusicProvider, MusicResource } from './types';

const provider: MusicProvider = class netease extends MusicResource {
  static Name = 'netease';
  static id = 'ne';
  static searchable = true;
  static support_login = true;
  static hidden = false;
  static displayId = '_NETEASE_MUSIC';
  static _create_secret_key(size: number) {
    const result = [];
    const choice = '012345679abcdef'.split('');
    for (let i = 0; i < size; i += 1) {
      const index = Math.floor(Math.random() * choice.length);
      result.push(choice[index]);
    }
    return result.join('');
  }

  static _aes_encrypt(text: string, sec_key: any, algo: any) {
    const cipher = forge.cipher.createCipher(algo, sec_key);
    cipher.start({ iv: '0102030405060708' });
    cipher.update(forge.util.createBuffer(text));
    cipher.finish();

    return cipher.output;
  }

  static _rsa_encrypt(text: string, pubKey: string, modulus: string) {
    text = text.split('').reverse().join(''); // eslint-disable-line no-param-reassign
    const n = new forge.jsbn.BigInteger(modulus, 16);
    const e = new forge.jsbn.BigInteger(pubKey, 16);
    const b = new forge.jsbn.BigInteger(forge.util.bytesToHex(text), 16);
    const enc = b.modPow(e, n).toString(16).padStart(256, '0');
    return enc;
  }

  static weapi(text: any) {
    const modulus =
      '00e0b509f6259df8642dbc35662901477df22677ec152b5ff68ace615bb7b72' +
      '5152b3ab17a876aea8a5aa76d2e417629ec4ee341f56135fccf695280104e0312ecbd' +
      'a92557c93870114af6c9d05c4f7f0c3685b7a46bee255932575cce10b424d813cfe48' +
      '75d3e82047b97ddef52741d546b8e289dc6935b3ece0462db0a22b8e7';
    const nonce = '0CoJUm6Qyw8W8jud';
    const pubKey = '010001';
    text = JSON.stringify(text); // eslint-disable-line no-param-reassign
    const sec_key = this._create_secret_key(16);
    const enc_text = btoa(this._aes_encrypt(btoa(this._aes_encrypt(text, nonce, 'AES-CBC').data), sec_key, 'AES-CBC').data);
    const enc_sec_key = this._rsa_encrypt(sec_key, pubKey, modulus);
    const data = {
      params: enc_text,
      encSecKey: enc_sec_key
    };
    return data;
  }

  // refer to https://github.com/Binaryify/NeteaseCloudMusicApi/blob/master/util/crypto.js
  static eapi(url: string, object: any) {
    const eapiKey = 'e82ckenh8dichen8';

    const text = typeof object === 'object' ? JSON.stringify(object) : object;
    const message = `nobody${url}use${text}md5forencrypt`;
    const digest = forge.md.md5.create().update(forge.util.encodeUtf8(message)).digest().toHex();
    const data = `${url}-36cd479b6b5-${text}-36cd479b6b5-${digest}`;

    return {
      params: this._aes_encrypt(data, eapiKey, 'AES-ECB').toHex().toUpperCase()
    };
  }

  static async ne_show_toplist(offset: number) {
    if (offset !== undefined && offset > 0) {
      return [];
    }
    const url = 'https://music.163.com/weapi/toplist/detail';
    const data = this.weapi({});

    const response = await axios.post(url, new URLSearchParams(data));
    const result: { cover_img_url: string; id: string; source_url: string; title: string }[] = response.data.list.map((item: any) => ({
      cover_img_url: item.coverImgUrl,
      id: `neplaylist_${item.id}`,
      source_url: `https://music.163.com/#/playlist?id=${item.id}`,
      title: item.name
    }));
    return result;
  }

  static async showPlaylist(url: string) {
    const order = 'hot';
    const offset = Number(getParameterByName('offset', url));
    const filterId = getParameterByName('filter_id', url);

    if (filterId === 'toplist') {
      return this.ne_show_toplist(offset);
    }

    const params = { order };
    if (filterId !== '') {
      params.category_id = filterId;
    }
    if (offset != null) {
      params.offset = offset;
    }

    const { data } = await axios.get("http://localhost:3030/playlist/netease", { params });
    return data;
  }

  static ne_ensure_cookie(callback: CallableFunction) {
    const domain = 'https://music.163.com';
    const nuidName = '_ntes_nuid';
    const nnidName = '_ntes_nnid';
    cookieGetPromise({
      url: domain,
      name: nuidName
    }).then((cookie) => {
      if (cookie == null) {
        const nuidValue = this._create_secret_key(32);
        const nnidValue = `${nuidValue},${new Date().getTime()}`;
        // netease default cookie expire time: 100 years
        const expire = (new Date().getTime() + 1e3 * 60 * 60 * 24 * 365 * 100) / 1000;

        cookieSet(
          {
            url: domain,
            name: nuidName,
            value: nuidValue,
            expirationDate: expire
          } as any,
          () => {
            cookieSet(
              {
                url: domain,
                name: nnidName,
                value: nnidValue,
                expirationDate: expire
              } as any,
              () => {
                callback(null);
              }
            );
          }
        );
      } else {
        callback(null);
      }
    });
  }

  static ng_render_playlist_result_item(index: any, item: any, callback: CallableFunction) {
    const target_url = 'https://music.163.com/weapi/v3/song/detail';
    const queryIds = [item.id];
    const d = {
      c: `[${queryIds.map((id) => `{"id":${id}}`).join(',')}]`,
      ids: `[${queryIds.join(',')}]`
    };
    const data = this.weapi(d);
    axios.post(target_url, new URLSearchParams(data).toString()).then((response) => {
      const track_json = response.data.songs[0];
      const track = {
        id: `netrack_${track_json.id}`,
        title: track_json.name,
        artist: track_json.ar[0].name,
        artist_id: `neartist_${track_json.ar[0].id}`,
        album: track_json.al.name,
        album_id: `nealbum_${track_json.al.id}`,
        source: 'netease',
        source_url: `https://music.163.com/#/song?id=${track_json.id}`,
        img_url: track_json.al.picUrl
        // url: `netrack_${track_json.id}`,
      };
      return callback(null, track);
    });
  }

  static async ng_parse_playlist_tracks(playlist_tracks: any[]) {
    const target_url = 'https://music.163.com/weapi/v3/song/detail';
    const track_ids = playlist_tracks.map((i) => i.id);
    const d = {
      c: `[${track_ids.map((id) => `{"id":${id}}`).join(',')}]`,
      ids: `[${track_ids.join(',')}]`
    };
    const data = this.weapi(d);
    const response = await axios.post(target_url, new URLSearchParams(data));
    const tracks = response.data.songs.map((track_json: any) => ({
      id: `netrack_${track_json.id}`,
      title: track_json.name,
      artist: track_json.ar[0].name,
      artist_id: `neartist_${track_json.ar[0].id}`,
      album: track_json.al.name,
      album_id: `nealbum_${track_json.al.id}`,
      source: 'netease',
      source_url: `https://music.163.com/#/song?id=${track_json.id}`,
      img_url: track_json.al.picUrl
      // url: `netrack_${track_json.id}`,
    }));
    return tracks;
  }

  static split_array(myarray: any[], size: number) {
    const count = Math.ceil(myarray.length / size);
    const result = [];
    for (let i = 0; i < count; i += 1) {
      result.push(myarray.slice(i * size, (i + 1) * size));
    }
    return result;
  }

  static ne_get_playlist(url: string) {
    // special thanks for @Binaryify
    // https://github.com/Binaryify/NeteaseCloudMusicApi
    return new Promise((res) => {
      const list_id = getParameterByName('list_id', url)?.split('_').pop();
      const target_url = 'https://music.163.com/weapi/v3/playlist/detail';
      const d = {
        id: list_id,
        offset: 0,
        total: true,
        limit: 1000,
        n: 1000,
        csrf_token: ''
      };
      const data = this.weapi(d);
      this.ne_ensure_cookie(async () => {
        const response = await axios.post(target_url, new URLSearchParams(data));
        const { data: res_data } = response;
        const info = {
          id: `neplaylist_${list_id}`,
          cover_img_url: res_data.playlist.coverImgUrl,
          title: res_data.playlist.name,
          description: res_data.playlist.description,
          source_url: `https://music.163.com/#/playlist?id=${list_id}`
        };
        const max_allow_size = 1000;
        const trackIdsArray = this.split_array(res_data.playlist.trackIds, max_allow_size);

        const tracks = (await Promise.all(trackIdsArray.map((id) => netease.ng_parse_playlist_tracks(id)))).flat();
        res({ tracks, info });

        // request every tracks to fetch song info
        // async_process_list(res_data.playlist.trackIds, ng_render_playlist_result_item,
        //   (err, tracks) => fn({
        //     tracks,
        //     info,
        //   }));
      });
    });
  }
  static async init(track: any) {
    const sound = {} as any;
    const target_url = `https://interface3.music.163.com/eapi/song/enhance/player/url`;
    let song_id = track.id;
    const eapiUrl = '/api/song/enhance/player/url';

    song_id = song_id.slice('netrack_'.length);

    const d = {
      ids: `[${song_id}]`,
      br: 999000
    };
    const data = this.eapi(eapiUrl, d);
    const expire = (new Date().getTime() + 1e3 * 60 * 60 * 24 * 365 * 100) / 1000;
    await cookieSetPromise({
      url: 'https://interface3.music.163.com',
      name: 'os',
      value: 'pc',
      expirationDate: expire,
      sameSite: 'no_restriction'
    });
    const { data: res_data } = await axios.post(target_url, new URLSearchParams(data));
    const { url, br } = res_data.data[0];
    if (url != null) {
      sound.url = url;
      sound.bitrate = `${(br / 1000).toFixed(0)}kbps`;
      sound.platform = 'netease';
      return sound;
    } else {
      throw 'netease:init(): url is null';
    }
  }
  static bootstrapTrack(track: any, success: CallableFunction, failure: CallableFunction) {
    const sound = {} as any;
    const target_url = `https://interface3.music.163.com/eapi/song/enhance/player/url`;
    let song_id = track.id;
    const eapiUrl = '/api/song/enhance/player/url';

    song_id = song_id.slice('netrack_'.length);

    const d = {
      ids: `[${song_id}]`,
      br: 999000
    };
    const data = this.eapi(eapiUrl, d);
    const expire = (new Date().getTime() + 1e3 * 60 * 60 * 24 * 365 * 100) / 1000;

    cookieSet(
      {
        url: 'https://interface3.music.163.com',
        name: 'os',
        value: 'pc',
        expirationDate: expire
      } as any,
      () => {
        axios
          .post(target_url, new URLSearchParams(data))
          .then((response) => {
            const { data: res_data } = response;
            const { url, br } = res_data.data[0];
            if (url != null) {
              sound.url = url;
              const bitrate = `${(br / 1000).toFixed(0)}kbps`;
              sound.bitrate = bitrate;
              sound.platform = 'netease';
              success(sound);
            } else {
              failure(sound);
            }
          })
          .catch(() => failure(sound));
      }
    );
  }

  static is_playable(song: any) {
    return song.fee !== 4 && song.fee !== 1;
  }

  static async search(url: any) {
    // use chrome extension to modify referer.
    const target_url = 'https://music.163.com/api/search/pc';
    const keyword = getParameterByName('keywords', url);
    const curpage = Number(getParameterByName('curpage', url));
    const searchType = getParameterByName('type', url);
    let ne_search_type = '1';
    if (searchType === '1') {
      ne_search_type = '1000';
    }
    const req_data = {
      s: keyword,
      offset: 20 * (curpage - 1),
      limit: 20,
      type: ne_search_type
    } as any;
    try {
      const response = await axios.post(target_url, new URLSearchParams(req_data));
      let result = [];
      let total = 0;
      const { data } = response;
      if (searchType === '0') {
        result = data.result.songs.map((song_info: any) => ({
          id: `netrack_${song_info.id}`,
          title: song_info.name,
          artist: song_info.artists[0].name,
          artist_id: `neartist_${song_info.artists[0].id}`,
          album: song_info.album.name,
          album_id: `nealbum_${song_info.album.id}`,
          source: 'netease',
          source_url: `https://music.163.com/#/song?id=${song_info.id}`,
          img_url: song_info.album.picUrl,
          // url: `netrack_${song_info.id}`,
          url: !this.is_playable(song_info) ? '' : undefined
        }));
        total = data.result.songCount;
      } else if (searchType === '1') {
        result = data.result.playlists.map((info: any) => ({
          id: `neplaylist_${info.id}`,
          title: info.name,
          source: 'netease',
          source_url: `https://music.163.com/#/playlist?id=${info.id}`,
          img_url: info.coverImgUrl,
          url: `neplaylist_${info.id}`,
          author: info.creator.nickname,
          count: info.trackCount
        }));
        total = data.result.playlistCount;
      }
      return {
        result,
        total,
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

  static async ne_album(url: string) {
    const album_id = getParameterByName('list_id', url)?.split('_').pop();
    // use chrome extension to modify referer.
    const target_url = `https://music.163.com/api/album/${album_id}`;

    const { data } = await axios.get(target_url);
    const info = {
      cover_img_url: data.album.picUrl,
      title: data.album.name,
      id: `nealbum_${data.album.id}`,
      source_url: `https://music.163.com/#/album?id=${data.album.id}`
    };

    const tracks = data.album.songs.map((song_info: any) => ({
      id: `netrack_${song_info.id}`,
      title: song_info.name,
      artist: song_info.artists[0].name,
      artist_id: `neartist_${song_info.artists[0].id}`,
      album: song_info.album.name,
      album_id: `nealbum_${song_info.album.id}`,
      source: 'netease',
      source_url: `https://music.163.com/#/song?id=${song_info.id}`,
      img_url: song_info.album.picUrl,
      url: !this.is_playable(song_info) ? '' : undefined
    }));
    return {
      tracks,
      info
    };
  }

  static async ne_artist(url: string) {
    const artist_id = getParameterByName('list_id', url)?.split('_').pop();
    // use chrome extension to modify referer.
    const target_url = `https://music.163.com/api/artist/${artist_id}`;

    const { data } = await axios.get(target_url);

    const info = {
      cover_img_url: data.artist.picUrl,
      title: data.artist.name,
      id: `neartist_${data.artist.id}`,
      source_url: `https://music.163.com/#/artist?id=${data.artist.id}`
    };

    const tracks = data.hotSongs.map((song_info: any) => ({
      id: `netrack_${song_info.id}`,
      title: song_info.name,
      artist: song_info.artists[0].name,
      artist_id: `neartist_${song_info.artists[0].id}`,
      album: song_info.album.name,
      album_id: `nealbum_${song_info.album.id}`,
      source: 'netease',
      source_url: `https://music.163.com/#/song?id=${song_info.id}`,
      img_url: song_info.album.picUrl,
      // url: `netrack_${song_info.id}`,
      url: !this.is_playable(song_info) ? '' : undefined
    }));
    return {
      tracks,
      info
    };
  }

  static async lyric(url: string) {
    const track_id = getParameterByName('track_id', url)?.split('_').pop();
    // use chrome extension to modify referer.
    const target_url = 'https://music.163.com/weapi/song/lyric?csrf_token=';
    const csrf = '';
    const d = {
      id: track_id,
      lv: -1,
      tv: -1,
      csrf_token: csrf
    };
    const data = this.weapi(d);
    const { data: res_data } = await axios.post(target_url, new URLSearchParams(data));
    let lrc = '';
    let tlrc = '';
    if (res_data.lrc != null) {
      lrc = res_data.lrc.lyric;
    }
    if (res_data.tlyric != null && res_data.tlyric.lyric != null) {
      // eslint-disable-next-line no-control-regex
      tlrc = res_data.tlyric.lyric.replace(/(|\\)/g, '');
      tlrc = tlrc.replace(/[\u2005]+/g, ' ');
    }
    return {
      lyric: lrc,
      tlyric: tlrc
    };
  }

  static async parseUrl(url: string) {
    let result;
    let id = '';
    // eslint-disable-next-line no-param-reassign
    url = url.replace('music.163.com/#/discover/toplist?', 'music.163.com/#/playlist?'); // eslint-disable-line no-param-reassign
    url = url.replace('music.163.com/#/my/m/music/', 'music.163.com/'); // eslint-disable-line no-param-reassign
    url = url.replace('music.163.com/#/m/', 'music.163.com/'); // eslint-disable-line no-param-reassign
    url = url.replace('music.163.com/#/', 'music.163.com/'); // eslint-disable-line no-param-reassign
    if (url.search('//music.163.com/playlist') !== -1) {
      const match = /\/\/music.163.com\/playlist\/([0-9]+)/.exec(url);
      id = match ? match[1] : getParameterByName('id', url) || '';
      result = {
        type: 'playlist',
        id: `neplaylist_${id}`
      };
    } else if (url.search('//music.163.com/artist') !== -1) {
      result = {
        type: 'playlist',
        id: `neartist_${getParameterByName('id', url)}`
      };
    } else if (url.search('//music.163.com/album') !== -1) {
      const match = /\/\/music.163.com\/album\/([0-9]+)/.exec(url);
      id = match ? match[1] : getParameterByName('id', url) || '';
      result = {
        type: 'playlist',
        id: `nealbum_${id}`
      };
    }
    return result;
  }

  static getPlaylist(url: string) {
    const list_id = getParameterByName('list_id', url)?.split('_')[0];
    switch (list_id) {
      case 'neplaylist':
        return this.ne_get_playlist(url);
      case 'nealbum':
        return this.ne_album(url);
      case 'neartist':
        return this.ne_artist(url);
      default:
        return null;
    }
  }

  static async getPlaylistFilters() {
    const recommend = [
      { id: '', name: '全部' },
      { id: 'toplist', name: '排行榜' },
      { id: '流行', name: '流行' },
      { id: '民谣', name: '民谣' },
      { id: '电子', name: '电子' },
      { id: '舞曲', name: '舞曲' },
      { id: '说唱', name: '说唱' },
      { id: '轻音乐', name: '轻音乐' },
      { id: '爵士', name: '爵士' },
      { id: '乡村', name: '乡村' }
    ];

    const all = [
      {
        category: '语种',
        filters: [
          { id: '华语', name: '华语' },
          { id: '欧美', name: '欧美' },
          { id: '日语', name: '日语' },
          { id: '韩语', name: '韩语' },
          { id: '粤语', name: '粤语' }
        ]
      },
      {
        category: '风格',
        filters: [
          { id: '流行', name: '流行' },
          { id: '民谣', name: '民谣' },
          { id: '电子', name: '电子' },
          { id: '舞曲', name: '舞曲' },
          { id: '说唱', name: '说唱' },
          { id: '轻音乐', name: '轻音乐' },
          { id: '爵士', name: '爵士' },
          { id: '乡村', name: '乡村' },
          { id: 'R%26B%2FSoul', name: 'R&B/Soul' },
          { id: '古典', name: '古典' },
          { id: '民族', name: '民族' },
          { id: '英伦', name: '英伦' },
          { id: '金属', name: '金属' },
          { id: '朋克', name: '朋克' },
          { id: '蓝调', name: '蓝调' },
          { id: '雷鬼', name: '雷鬼' },
          { id: '世界音乐', name: '世界音乐' },
          { id: '拉丁', name: '拉丁' },
          { id: 'New Age', name: 'New Age' },
          { id: '古风', name: '古风' },
          { id: '后摇', name: '后摇' },
          { id: 'Bossa Nova', name: 'Bossa Nova' }
        ]
      },
      {
        category: '场景',
        filters: [
          { id: '清晨', name: '清晨' },
          { id: '夜晚', name: '夜晚' },
          { id: '学习', name: '学习' },
          { id: '工作', name: '工作' },
          { id: '午休', name: '午休' },
          { id: '下午茶', name: '下午茶' },
          { id: '地铁', name: '地铁' },
          { id: '驾车', name: '驾车' },
          { id: '运动', name: '运动' },
          { id: '旅行', name: '旅行' },
          { id: '散步', name: '散步' },
          { id: '酒吧', name: '酒吧' }
        ]
      },
      {
        category: '情感',
        filters: [
          { id: '怀旧', name: '怀旧' },
          { id: '清新', name: '清新' },
          { id: '浪漫', name: '浪漫' },
          { id: '伤感', name: '伤感' },
          { id: '治愈', name: '治愈' },
          { id: '放松', name: '放松' },
          { id: '孤独', name: '孤独' },
          { id: '感动', name: '感动' },
          { id: '兴奋', name: '兴奋' },
          { id: '快乐', name: '快乐' },
          { id: '安静', name: '安静' },
          { id: '思念', name: '思念' }
        ]
      },
      {
        category: '主题',
        filters: [
          { id: '综艺', name: '综艺' },
          { id: '影视原声', name: '影视原声' },
          { id: 'ACG', name: 'ACG' },
          { id: '儿童', name: '儿童' },
          { id: '校园', name: '校园' },
          { id: '游戏', name: '游戏' },
          { id: '70后', name: '70后' },
          { id: '80后', name: '80后' },
          { id: '90后', name: '90后' },
          { id: '网络歌曲', name: '网络歌曲' },
          { id: 'KTV', name: 'KTV' },
          { id: '经典', name: '经典' },
          { id: '翻唱', name: '翻唱' },
          { id: '吉他', name: '吉他' },
          { id: '钢琴', name: '钢琴' },
          { id: '器乐', name: '器乐' },
          { id: '榜单', name: '榜单' },
          { id: '00后', name: '00后' }
        ]
      }
    ];
    return {
      recommend,
      all
    };
  }

  static async login(url: string) {
    // use chrome extension to modify referer.
    let target_url = 'https://music.163.com/weapi/login';
    const loginType = getParameterByName('type', url);

    const password = getParameterByName('password', url) || '';

    let req_data = {};
    if (loginType === 'email') {
      const email = getParameterByName('email', url);

      req_data = {
        username: email,
        password: forge.md.md5.create().update(forge.util.encodeUtf8(password)).digest().toHex(),
        rememberLogin: 'true'
      };
    } else if (loginType === 'phone') {
      target_url = `https://music.163.com/weapi/login/cellphone`;
      const countrycode = getParameterByName('countrycode', url);
      const phone = getParameterByName('phone', url);
      req_data = {
        phone,
        countrycode,
        password: forge.md.md5.create().update(forge.util.encodeUtf8(password)).digest().toHex(),
        rememberLogin: 'true'
      };
    }

    const encrypt_req_data = this.weapi(req_data);
    const expire = (new Date().getTime() + 1e3 * 60 * 60 * 24 * 365 * 100) / 1000;

    cookieSet(
      {
        url: 'https://music.163.com',
        name: 'os',
        value: 'pc',
        expirationDate: expire
      } as any,
      () => {
        // empty block
      }
    );
    try {
      const { data } = await axios.post(target_url, new URLSearchParams(encrypt_req_data));
      const result = {
        is_login: true,
        user_id: data.account.id,
        user_name: data.account.userName,
        nickname: data.profile.nickname,
        avatar: data.profile.avatarUrl,
        platform: 'netease',
        data
      };
      return {
        status: 'success',
        data: result
      };
    } catch (e) {
      return {
        status: 'fail',
        data: {}
      };
    }
  }

  static async get_user_playlist(url: string, playlistType: string) {
    const user_id = getParameterByName('user_id', url);
    const target_url = 'https://music.163.com/api/user/playlist';

    const req_data = {
      uid: user_id,
      limit: 1000,
      offset: 0,
      includeVideo: true
    } as any;
    const response = await axios.post(target_url, new URLSearchParams(req_data));
    const playlists = <any>[];
    response.data.playlist.forEach((item: any) => {
      if (playlistType === 'created' && item.subscribed !== false) {
        return;
      }
      if (playlistType === 'favorite' && item.subscribed !== true) {
        return;
      }
      const playlist = {
        cover_img_url: item.coverImgUrl,
        id: `neplaylist_${item.id}`,
        source_url: `https://music.163.com/#/playlist?id=${item.id}`,
        title: item.name
      };
      playlists.push(playlist);
    });
    return {
      status: 'success',
      data: {
        playlists
      }
    };
  }

  static getUserCreatedPlaylist(url: string) {
    return this.get_user_playlist(url, 'created');
  }

  static getUserFavoritePlaylist(url: string) {
    return this.get_user_playlist(url, 'favorite');
  }

  static async getRecommendPlaylist() {
    const target_url = 'https://music.163.com/weapi/personalized/playlist';

    const req_data = {
      limit: 30,
      total: true,
      n: 1000
    };

    const encrypt_req_data = this.weapi(req_data);
    const response = await axios.post(target_url, new URLSearchParams(encrypt_req_data));
    const playlists = <any>[];
    response.data.result.forEach((item: any) => {
      const playlist = {
        cover_img_url: item.picUrl,
        id: `neplaylist_${item.id}`,
        source_url: `https://music.163.com/#/playlist?id=${item.id}`,
        title: item.name
      };
      playlists.push(playlist);
    });
    return {
      status: 'success',
      data: {
        playlists
      }
    };
  }

  static async getUser() {
    const url = `https://music.163.com/api/nuser/account/get`;

    const encrypt_req_data = this.weapi({});
    const res = await axios.post(url, new URLSearchParams(encrypt_req_data));
    let result = { is_login: false } as any;
    let status = 'fail';
    if (res.data.account !== null) {
      status = 'success';
      const { data } = res;
      result = {
        is_login: true,
        user_id: data.account.id,
        user_name: data.account.userName,
        nickname: data.profile.nickname,
        avatar: data.profile.avatarUrl,
        platform: 'netease',
        data
      };
    }
    return {
      status,
      data: result
    };
  }

  static getLoginUrl() {
    return `https://music.163.com/#/login`;
  }

  static logout() {
    cookieRemove(
      {
        url: 'https://music.163.com',
        name: 'MUSIC_U'
      },
      () => {
        // empty block
      }
    );
  }

  static async getCommentList(trackId: string, offset: number, limit: number) {
    const url = 'https://music.163.com/weapi/comment/resource/comments/get';
    const neteaseId = 'R_SO_4_' + trackId.split('_')[1];

    const data = this.weapi({
      cursor: Date.now().toString(),
      offset: 0,
      orderType: 1,
      pageNo: offset / limit + 1,
      pageSize: limit,
      rid: neteaseId,
      threadId: neteaseId
    });

    const response = await axios.post(url, new URLSearchParams(data));
    let comments = [];
    if (response.data.data.hotComments) {
      comments = response.data.data.hotComments.map((item: any) => {
        const data = {
          id: item.commentId,
          content: item.content,
          time: item.time,
          nickname: item.user.nickname,
          avatar: item.user.avatarUrl,
          user_id: item.user.userId,
          like: item.likedCount,
          reply: []
        } as any;

        const replyData = item.beReplied && item.beReplied[0];
        if (!replyData) {
          return data;
        }
        const reply = {
          id: item.beRepliedCommentId,
          content: replyData.content,
          nickname: replyData.user.nickname,
          avatar: replyData.user.avatarUrl,
          user_id: replyData.user.userId
        };
        data['reply'] = [reply];
        return data;
      });
    }
    return { comments, total: comments.length, offset, limit };
  }
};

export default provider;
