import axios from 'axios';
import { cookieRemove, cookieGetPromise } from '../utils';
import { getParameterByName } from '../utils';
import { MusicResource, MusicProvider } from './types';

const provider: MusicProvider = class qq extends MusicResource {
  static _name = 'qq';
  static id = 'qq';
  static searchable = true;
  static support_login = true;
  static hidden = false;
  static displayId = '_QQ_MUSIC';
  static htmlDecode(value: string) {
    const parser = new DOMParser();
    return parser.parseFromString(value, 'text/html').body.textContent;
  }

  static async qq_show_toplist(offset: number) {
    if (offset !== undefined && offset > 0) {
      return [];
    }
    const url =
      'https://c.y.qq.com/v8/fcg-bin/fcg_myqq_toplist.fcg?g_tk=5381&inCharset=utf-8&outCharset=utf-8&notice=0&format=json&uin=0&needNewCode=1&platform=h5';

    const { data } = await axios.get(url);
    /** @type {{cover_img_url:string;id:string;source_url:string;title:string}[]}*/
    const result = data.data.topList.map((item: any) => ({
      cover_img_url: item.picUrl,
      id: `qqtoplist_${item.id}`,
      source_url: `https://y.qq.com/n/yqq/toplist/${item.id}.html`,
      title: item.topTitle
    }));
    return result;
  }

  static async showPlaylist(url: string) {
    const offset = Number(getParameterByName('offset', url)) || 0;
    let filterId = getParameterByName('filter_id', url) || '';
    if (filterId === 'toplist') {
      return this.qq_show_toplist(offset);
    }
    if (filterId === '') {
      filterId = '10000000';
    }
    const target_url =
      'https://c.y.qq.com/splcloud/fcgi-bin/fcg_get_diss_by_tag.fcg' +
      `?picmid=1&rnd=${Math.random()}&g_tk=732560869` +
      '&loginUin=0&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8' +
      '&notice=0&platform=yqq.json&needNewCode=0' +
      `&categoryId=${filterId}&sortId=5&sin=${offset}&ein=${29 + offset}`;
    const { data } = await axios.get(target_url);
    /** @type {{cover_img_url:string;id:string;source_url:string;title:string}[]}*/
    const playlists = data.data.list.map((item: any) => ({
      cover_img_url: item.imgurl,
      title: this.htmlDecode(item.dissname),
      id: `qqplaylist_${item.dissid}`,
      source_url: `https://y.qq.com/n/ryqq/playlist/${item.dissid}`
    }));

    return playlists;
  }

  static qq_get_image_url(qqimgid: string, img_type: string) {
    if (qqimgid == null) {
      return '';
    }
    let category = '';
    if (img_type === 'artist') {
      category = 'T001R300x300M000';
    }
    if (img_type === 'album') {
      category = 'T002R300x300M000';
    }
    const s = category + qqimgid;
    const url = `https://y.gtimg.cn/music/photo_new/${s}.jpg`;
    return url;
  }

  static qq_is_playable(song: any) {
    const switch_flag = song.switch.toString(2).split('');
    switch_flag.pop();
    switch_flag.reverse();
    // flag switch table meaning:
    // ["play_lq", "play_hq", "play_sq", "down_lq", "down_hq", "down_sq", "soso",
    //  "fav", "share", "bgm", "ring", "sing", "radio", "try", "give"]
    const play_flag = switch_flag[0];
    const try_flag = switch_flag[13];
    return play_flag === '1' || (play_flag === '1' && try_flag === '1');
  }

  static qq_convert_song(song: any) {
    const d = {
      id: `qqtrack_${song.songmid}`,
      id2: `qqtrack_${song.songid}`,
      title: this.htmlDecode(song.songname),
      artist: this.htmlDecode(song.singer[0].name),
      artist_id: `qqartist_${song.singer[0].mid}`,
      album: this.htmlDecode(song.albumname),
      album_id: `qqalbum_${song.albummid}`,
      img_url: this.qq_get_image_url(song.albummid, 'album'),
      source: 'qq',
      source_url: `https://y.qq.com/#type=song&mid=${song.songmid}&tpl=yqq_song_detail`,
      // url: `qqtrack_${song.songmid}`,
      url: !qq.qq_is_playable(song) ? '' : undefined
    };
    return d;
  }

  static get_toplist_url(id: string, period: string, limit: number) {
    return `https://u.y.qq.com/cgi-bin/musicu.fcg?format=json&inCharset=utf8&outCharset=utf-8&platform=yqq.json&needNewCode=0&data=${encodeURIComponent(
      JSON.stringify({
        comm: {
          cv: 1602,
          ct: 20
        },
        toplist: {
          module: 'musicToplist.ToplistInfoServer',
          method: 'GetDetail',
          param: {
            topid: id,
            num: limit,
            period
          }
        }
      })
    )}`;
  }

  static async get_periods(topid: string) {
    const periodUrl = 'https://c.y.qq.com/node/pc/wk_v15/top.html';
    const regExps = {
      periodList: /<i class="play_cover__btn c_tx_link js_icon_play" data-listkey=".+?" data-listname=".+?" data-tid=".+?" data-date=".+?" .+?<\/i>/g,
      period: /data-listname="(.+?)" data-tid=".*?\/(.+?)" data-date="(.+?)" .+?<\/i>/
    };
    const periods = {} as any;
    const response = await axios.get(periodUrl);
    const html = response.data;
    const pl = html.match(regExps.periodList);
    if (!pl) return Promise.reject();
    pl.forEach((p: string) => {
      const pr = p.match(regExps.period);
      if (!pr) return;
      periods[pr[2]] = {
        name: pr[1],
        id: pr[2],
        period: pr[3]
      };
    });
    const info = periods[topid];
    return info && info.period;
  }

  static async qq_toplist(url: string) {
    // special thanks to lx-music-desktop solution
    // https://github.com/lyswhut/lx-music-desktop/blob/24521bf50d80512a44048596639052e3194b2bf1/src/renderer/utils/music/tx/leaderboard.js

    const list_id = getParameterByName('list_id', url)?.split('_').pop() || '';
    const listPeriod = await this.get_periods(list_id);
    const limit = 100;
    // TODO: visit all pages of toplist
    const target_url = this.get_toplist_url(list_id, listPeriod, limit);
    const { data } = await axios.get(target_url);

    const tracks = data.toplist.data.songInfoList.map((song: any) => {
      const d = {
        id: `qqtrack_${song.mid}`,
        id2: `qqtrack_${song.id}`,
        title: this.htmlDecode(song.name),
        artist: this.htmlDecode(song.singer[0].name),
        artist_id: `qqartist_${song.singer[0].mid}`,
        album: this.htmlDecode(song.album.name),
        album_id: `qqalbum_${song.album.mid}`,
        img_url: this.qq_get_image_url(song.album.mid, 'album'),
        source: 'qq',
        source_url: `https://y.qq.com/#type=song&mid=${song.mid}&tpl=yqq_song_detail`
      };
      return d;
    });
    const info = {
      cover_img_url: data.toplist.data.data.frontPicUrl,
      title: data.toplist.data.data.title,
      id: `qqtoplist_${list_id}`,
      source_url: `https://y.qq.com/n/yqq/toplist/${list_id}.html`
    };
    return {
      tracks,
      info
    };
  }

  static async qq_get_playlist(url: string) {
    // eslint-disable-line no-unused-vars
    const list_id = getParameterByName('list_id', url)?.split('_').pop();
    const target_url =
      'https://i.y.qq.com/qzone-music/fcg-bin/fcg_ucc_getcdinfo_' +
      'byids_cp.fcg?type=1&json=1&utf8=1&onlysong=0' +
      `&nosign=1&disstid=${list_id}&g_tk=5381&loginUin=0&hostUin=0` +
      '&format=json&inCharset=GB2312&outCharset=utf-8&notice=0' +
      '&platform=yqq&needNewCode=0';
    const { data } = await axios.get(target_url);
    const info = {
      cover_img_url: data.cdlist[0].logo,
      title: data.cdlist[0].dissname,
      id: `qqplaylist_${list_id}`,
      source_url: `https://y.qq.com/n/ryqq/playlist/${list_id}`
    };
    const tracks = data.cdlist[0].songlist.map((item: any) => this.qq_convert_song(item));
    return {
      tracks,
      info
    };
  }

  static async qq_album(url: string) {
    const album_id = getParameterByName('list_id', url)?.split('_').pop() || '';

    const target_url =
      'https://i.y.qq.com/v8/fcg-bin/fcg_v8_album_info_cp.fcg' +
      `?platform=h5page&albummid=${album_id}&g_tk=938407465` +
      '&uin=0&format=json&inCharset=utf-8&outCharset=utf-8' +
      '&notice=0&platform=h5&needNewCode=1&_=1459961045571';
    const { data } = await axios.get(target_url);

    const info = {
      cover_img_url: this.qq_get_image_url(album_id, 'album'),
      title: data.data.name,
      id: `qqalbum_${album_id}`,
      source_url: `https://y.qq.com/#type=album&mid=${album_id}`
    };

    const tracks = data.data.list.map((item: any) => this.qq_convert_song(item));
    return {
      tracks,
      info
    };
  }

  static async qq_artist(url: string) {
    const artist_id = getParameterByName('list_id', url)?.split('_').pop() || '';

    const target_url =
      'https://i.y.qq.com/v8/fcg-bin/fcg_v8_singer_track_cp.fcg' +
      `?platform=h5page&order=listen&begin=0&num=50&singermid=${artist_id}` +
      '&g_tk=938407465&uin=0&format=json&' +
      'inCharset=utf-8&outCharset=utf-8&notice=0&platform=' +
      'h5&needNewCode=1&from=h5&_=1459960621777';
    const { data } = await axios.get(target_url);

    const info = {
      cover_img_url: this.qq_get_image_url(artist_id, 'artist'),
      title: data.data.singer_name,
      id: `qqartist_${artist_id}`,
      source_url: `https://y.qq.com/#type=singer&mid=${artist_id}`
    };

    const tracks = data.data.list.map((item: any) => this.qq_convert_song(item.musicData));
    return {
      tracks,
      info
    };
  }

  static async search(url: string) {
    // eslint-disable-line no-unused-vars
    const keyword = getParameterByName('keywords', url);
    const curpage = Number(getParameterByName('curpage', url));
    const searchType = getParameterByName('type', url);
    let target_url = '';
    switch (searchType) {
      case '0':
        target_url =
          'https://c.y.qq.com/soso/fcgi-bin/client_search_cp?' +
          'g_tk=938407465&uin=0&format=json&inCharset=utf-8' +
          '&outCharset=utf-8&notice=0&platform=h5&needNewCode=1' +
          `&w=${keyword}&zhidaqu=1&catZhida=1` +
          `&t=0&flag=1&ie=utf-8&sem=1&aggr=0&perpage=20&n=20&p=${curpage}&remoteplace=txt.mqq.all&_=1459991037831`;
        break;
      case '1':
        target_url =
          'https://c.y.qq.com/soso/fcgi-bin/client_music_search_songlist?' +
          'remoteplace=txt.yqq.playlist&&outCharset=utf-8&format=json' +
          `&page_no=${curpage - 1}&num_per_page=20&query=${keyword}`;
        break;
      default:
        break;
    }
    const response = await axios.get(target_url);
    const { data } = response;
    let result = [];
    let total = 0;
    if (searchType === '0') {
      result = data.data.song.list.map((item: any) => this.qq_convert_song(item));
      total = data.data.song.totalnum;
    } else if (searchType === '1') {
      result = data.data.list.map((info: any) => ({
        id: `qqplaylist_${info.dissid}`,
        title: this.htmlDecode(info.dissname),
        source: 'qq',
        source_url: `https://y.qq.com/n/ryqq/playlist/${info.dissid}`,
        img_url: info.imgurl,
        url: `qqplaylist_${info.dissid}`,
        author: this.UnicodeToAscii(info.creator.name),
        count: info.song_count
      }));
      total = data.data.sum;
    }
    return {
      result,
      total,
      type: searchType
    };
  }

  static UnicodeToAscii(str: string) {
    const result = str.replace(/&#(\d+);/g, () =>
      // eslint-disable-next-line prefer-rest-params
      String.fromCharCode(arguments[1])
    );
    return result;
  }

  static bootstrapTrack(track: any, success: CallableFunction, failure: CallableFunction) {
    const sound = {} as any;
    const songId = track.id.slice('qqtrack_'.length);
    const target_url = 'https://u.y.qq.com/cgi-bin/musicu.fcg';
    // thanks to https://github.com/Rain120/qq-music-api/blob/2b9cb811934888a532545fbd0bf4e4ab2aea5dbe/routers/context/getMusicPlay.js
    const guid = '10000';
    const songmidList = [songId];
    const uin = '0';

    const fileType = '128';
    const fileConfig = {
      m4a: {
        s: 'C400',
        e: '.m4a',
        bitrate: 'M4A'
      },
      128: {
        s: 'M500',
        e: '.mp3',
        bitrate: '128kbps'
      },
      320: {
        s: 'M800',
        e: '.mp3',
        bitrate: '320kbps'
      },
      ape: {
        s: 'A000',
        e: '.ape',
        bitrate: 'APE'
      },
      flac: {
        s: 'F000',
        e: '.flac',
        bitrate: 'FLAC'
      }
    };
    const fileInfo = fileConfig[fileType];
    const file = songmidList.length === 1 && `${fileInfo.s}${songId}${songId}${fileInfo.e}`;

    const reqData = {
      req_0: {
        module: 'vkey.GetVkeyServer',
        method: 'CgiGetVkey',
        param: {
          filename: file ? [file] : [],
          guid,
          songmid: songmidList,
          songtype: [0],
          uin,
          loginflag: 1,
          platform: '20'
        }
      },
      loginUin: uin,
      comm: {
        uin,
        format: 'json',
        ct: 24,
        cv: 0
      }
    };
    const params = {
      format: 'json',
      data: JSON.stringify(reqData)
    };
    axios
      .get(target_url, { params })
      .then((response) => {
        const { data } = response;
        const { purl } = data.req_0.data.midurlinfo[0];

        if (purl === '') {
          // vip
          failure(sound);
          return;
        }
        const url = data.req_0.data.sip[0] + purl;
        sound.url = url;
        const prefix = purl.slice(0, 4);
        const found = Object.values(fileConfig).filter((i) => i.s === prefix);
        sound.bitrate = found.length > 0 ? found[0].bitrate : '';
        sound.platform = 'qq';

        success(sound);
      })
      .catch(() => failure(sound));
  }

  // eslint-disable-next-line no-unused-vars
  static str2ab(str: string) {
    // string to array buffer.
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i += 1) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

  static async lyric(url: string) {
    const track_id = getParameterByName('track_id', url)?.split('_').pop();
    // use chrome extension to modify referer.
    const target_url =
      'https://i.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?' + `songmid=${track_id}&g_tk=5381&format=json&inCharset=utf8&outCharset=utf-8&nobase64=1`;
    const { data } = await axios.get(target_url);
    const lyric = data.lyric || '';
    const tlyric = data.trans.replace(/\/\//g, '') || '';
    return { lyric, tlyric };
  }

  static async parseUrl(url: string) {
    let result;

    const matchList = [
      /\/\/y.qq.com\/n\/yqq\/playlist\/([0-9]+)/,
      /\/\/y.qq.com\/n\/ryqq\/playlist\/([0-9]+)/,
      /\/\/y.qq.com\/n\/yqq\/playsquare\/([0-9]+)/,
      /\/\/y.qq.com\/n\/m\/detail\/taoge\/index.html\?id=([0-9]+)/
    ];
    matchList.forEach((reg) => {
      const match = reg.exec(url);
      if (match != null) {
        const playlist_id = match[1];
        result = {
          type: 'playlist',
          id: `qqplaylist_${playlist_id}`
        };
        return result;
      }
    });

    // https://c.y.qq.com/base/fcgi-bin/u?__=1MsbSLu
    const match = /\/\/c.y.qq.com\/base\/fcgi-bin\/u\?__=([0-9a-zA-Z]+)/.exec(url);
    if (match != null) {
      const response = await axios.get(url);

      const { responseURL } = response.request;
      const playlist_id = getParameterByName('id', responseURL);
      result = {
        type: 'playlist',
        id: `qqplaylist_${playlist_id}`
      };
      return result;
    }
    return result;
  }

  static getPlaylist(url: string) {
    const list_id = getParameterByName('list_id', url)?.split('_')[0];
    switch (list_id) {
      case 'qqplaylist':
        return this.qq_get_playlist(url);
      case 'qqalbum':
        return this.qq_album(url);
      case 'qqartist':
        return this.qq_artist(url);
      case 'qqtoplist':
        return this.qq_toplist(url);
      default:
        return null;
    }
  }

  static async getPlaylistFilters() {
    const target_url =
      'https://c.y.qq.com/splcloud/fcgi-bin/fcg_get_diss_tag_conf.fcg' +
      `?picmid=1&rnd=${Math.random()}&g_tk=732560869` +
      '&loginUin=0&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8' +
      '&notice=0&platform=yqq.json&needNewCode=0';
    const { data } = await axios.get(target_url);
    const all = [] as any[];
    data.data.categories.forEach((cate: any) => {
      const result = { category: cate.categoryGroupName, filters: [] };
      if (cate.usable === 1) {
        result.filters = cate.items.map((item: any) => ({ id: item.categoryId, name: this.htmlDecode(item.categoryName) }));
        all.push(result);
      }
    });
    const recommendLimit = 8;
    const recommend = [{ id: '', name: '全部' }, { id: 'toplist', name: '排行榜' }, ...all[1].filters.slice(0, recommendLimit)];

    return {
      recommend,
      all
    };
  }

  static async get_user_by_uin(uin: string) {
    const infoUrl = `https://u.y.qq.com/cgi-bin/musicu.fcg?format=json&&loginUin=${uin}&hostUin=0inCharset=utf8&outCharset=utf-8&platform=yqq.json&needNewCode=0&data=${encodeURIComponent(
      JSON.stringify({
        comm: { ct: 24, cv: 0 },
        vip: {
          module: 'userInfo.VipQueryServer',
          method: 'SRFVipQuery_V2',
          param: { uin_list: [uin] }
        },
        base: {
          module: 'userInfo.BaseUserInfoServer',
          method: 'get_user_baseinfo_v2',
          param: { vec_uin: [uin] }
        }
      })
    )}`;

    const response = await axios.get(infoUrl);
    const { data } = response;
    const info = data.base.data.map_userinfo[uin];
    const result = {
      is_login: true,
      user_id: uin,
      user_name: uin,
      nickname: info.nick,
      avatar: info.headurl,
      platform: 'qq',
      data
    };
    return { status: 'success', data: result };
  }

  static async getUserCreatedPlaylist(url: string) {
    const user_id = getParameterByName('user_id', url);
    // TODO: load more than size
    const size = 100;

    const target_url = `https://c.y.qq.com/rsc/fcgi-bin/fcg_user_created_diss?cv=4747474&ct=24&format=json&inCharset=utf-8&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=1&uin=${user_id}&hostuin=${user_id}&sin=0&size=${size}`;
    const response = await axios.get(target_url);
    const playlists = <any>[];
    response.data.data.disslist.forEach((item: any) => {
      let playlist = {};
      if (item.dir_show === 0) {
        if (item.tid === 0) {
          return;
        }
        if (item.diss_name === '我喜欢') {
          playlist = {
            cover_img_url: 'https://y.gtimg.cn/mediastyle/y/img/cover_love_300.jpg',
            id: `qqplaylist_${item.tid}`,
            source_url: `https://y.qq.com/n/ryqq/playlist/${item.tid}`,
            title: item.diss_name
          };
          playlists.push(playlist);
        }
      } else {
        playlist = {
          cover_img_url: item.diss_cover,
          id: `qqplaylist_${item.tid}`,
          source_url: `https://y.qq.com/n/ryqq/playlist/${item.tid}`,
          title: item.diss_name
        };
        playlists.push(playlist);
      }
    });
    return {
      status: 'success',
      data: {
        playlists
      }
    };
  }

  static async getUserFavoritePlaylist(url: string) {
    const user_id = getParameterByName('user_id', url);
    // TODO: load more than size
    const size = 100;
    // https://github.com/jsososo/QQMusicApi/blob/master/routes/user.js
    const target_url = `https://c.y.qq.com/fav/fcgi-bin/fcg_get_profile_order_asset.fcg`;
    const data = {
      ct: 20,
      cid: 205360956,
      userid: user_id,
      reqtype: 3,
      sin: 0,
      ein: size
    };
    const response = await axios.get(target_url, { params: data });

    const playlists = <any>[];
    response.data.data.cdlist.forEach((item: any) => {
      let playlist = {};
      if (item.dir_show === 0) {
        return;
      }
      playlist = {
        cover_img_url: item.logo,
        id: `qqplaylist_${item.dissid}`,
        source_url: `https://y.qq.com/n/ryqq/playlist/${item.dissid}`,
        title: item.dissname
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

  static async getRecommendPlaylist() {
    const target_url = `https://u.y.qq.com/cgi-bin/musicu.fcg?format=json&&loginUin=0&hostUin=0inCharset=utf8&outCharset=utf-8&platform=yqq.json&needNewCode=0&data=${encodeURIComponent(
      JSON.stringify({
        comm: {
          ct: 24
        },
        recomPlaylist: {
          method: 'get_hot_recommend',
          param: {
            async: 1,
            cmd: 2
          },
          module: 'playlist.HotRecommendServer'
        }
      })
    )}`;
    const response = await axios.get(target_url);
    const playlists = <any>[];
    response.data.recomPlaylist.data.v_hot.forEach((item: any) => {
      const playlist = {
        cover_img_url: item.cover,
        id: `qqplaylist_${item.content_id}`,
        source_url: `https://y.qq.com/n/ryqq/playlist/${item.content_id}`,
        title: item.title
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
    const domain = 'https://y.qq.com';
    const qqCookie = await cookieGetPromise({
      url: domain,
      name: 'uin'
    });
    if (qqCookie === null) {
      const wxCookie = await cookieGetPromise({
        url: domain,
        name: 'wxuin'
      });
      if (wxCookie === null) {
        return { status: 'fail', data: {} };
      }
      let { value: uin } = wxCookie as any;
      uin = `1${uin.slice('o'.length)}`; // replace prefix o with 1
      return this.get_user_by_uin(uin);
    }
  }

  static getLoginUrl() {
    return `https://y.qq.com/portal/profile.html`;
  }

  static logout() {
    cookieRemove(
      {
        url: 'https://y.qq.com',
        name: 'uin'
      },
      () => {
        cookieRemove(
          {
            url: 'https://y.qq.com',
            name: 'wxuin'
          },
          () => {
            // empty block
          }
        );
      }
    );
  }
  static async getCommentList(trackId: string, offset: number, limit: number) {
    if (trackId === undefined) {
      return { comments: [], total: 0, offset, limit };
    }
    const qqId = trackId.split('_')[1];
    const url = 'http://c.y.qq.com/base/fcgi-bin/fcg_global_comment_h5.fcg';
    const req = {
      uin: '0',
      format: 'json',
      cid: '0',
      reqtype: '2',
      biztype: '1',
      topid: qqId,
      cmd: '9',
      needmusiccrit: '1',
      pagenum: offset / limit,
      pagesize: limit
    } as any;
    const formData = new FormData();
    Object.keys(req).forEach((key) => {
      formData.append(key, req[key]);
    });

    const response = await axios.post(url, formData);

    const comments = response.data.comment.commentlist.map((item: any) => {
      const data = {
        id: `${item.rootcommentid}_${item.commentid}`,
        content: item.rootcommentcontent ? item.rootcommentcontent : '',
        time: parseInt(item.time + '000'),
        nickname: item.rootcommentnick ? item.rootcommentnick : '',
        avatar: item.avatarurl,
        user_id: item.encrypt_rootcommentuin,
        like: item.praisenum,
        reply: []
      };
      return data;
    });
    return { comments, total: comments.length, offset, limit };
  }
};

export default provider;
