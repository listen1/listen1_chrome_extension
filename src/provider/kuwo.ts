import axios from 'axios';
import { cookieGet } from '../utils';
import { getParameterByName } from "../utils";
import { MusicResource, MusicProvider } from './types';

const kwConvertSong = (item: any) => ({
  id: `kwtrack_${item.rid}`,
  title: html_decode(item.name),
  artist: html_decode(item.artist),
  artist_id: `kwartist_${item.artistid}`,
  album: html_decode(item.album),
  album_id: `kwalbum_${item.albumid}`,
  source: 'kuwo',
  source_url: `https://www.kuwo.cn/play_detail/${item.rid}`,
  img_url: item.pic,
  // url: `kwtrack_${musicrid}`,
  lyric_url: item.rid
});

function html_decode(str: string) {
  let text = str;
  const entities = [
    ['amp', '&'],
    ['apos', "'"],
    ['#x27', "'"],
    ['#x2F', '/'],
    ['#39', "'"],
    ['#47', '/'],
    ['lt', '<'],
    ['gt', '>'],
    ['nbsp', ' '],
    ['quot', '"']
  ];
  for (let i = 0, max = entities.length; i < max; i += 1) {
    text = text.replace(new RegExp(`&${entities[i][0]};`, 'g'), entities[i][1]);
  }
  return text;
}
const provider: MusicProvider = class kuwo extends MusicResource {
  // Fix single quote in json
  static fix_json(data: any) {
    return data.replace(/(')/g, '"');
  }

  static num2str(num: number) {
    // const t = parseInt(num, 10);
    return Math.floor(num).toString();
  }

  /*
  static kw_convert_song(item) {
    const song_id = item.MUSICRID.split('_').pop();
    const track = {
      id: `kwtrack_${song_id}`,
      title: html_decode(item.SONGNAME),
      artist: html_decode(item.ARTIST),
      artist_id: `kwartist_${item.ARTISTID}`,
      album: html_decode(item.ALBUM),
      album_id: `kwalbum_${item.ALBUMID}`,
      source: 'kuwo',
      source_url: `https://www.kuwo.cn/play_detail/${song_id}`,
      img_url: '',
      // url: `kwtrack_${song_id}`,
      lyric_url: song_id,
    };
    return track;
  }
  */

  /*
  function async_process_list(data_list, handler, handler_extra_param_list, callback) {
    const fnDict = {};
    data_list.forEach((item, index) => {
      fnDict[index] = (cb) => handler(index, item, handler_extra_param_list, cb);
    });
    parallel(fnDict, (err, results) => {
      callback(null, data_list.map((item, index) => results[index]));
    });
  }

  function kw_add_song_pic_in_track(track, params, callback) {
    // Add song picture image
    const target_url = 'https://artistpicserver.kuwo.cn/pic.web?'
      + `type=rid_pic&pictype=url&size=240&rid=${track.lyric_url}`;
    axios.get(target_url)
      .then((response) => {
        const { data } = response;
        track.img_url = data; // eslint-disable-line no-param-reassign
        callback(null, track);
      });
  }

  function kw_render_search_result_item(index, item, params, callback) {
    const track = kw_convert_song(item);
    kw_add_song_pic_in_track(track, params, callback);
  }

  function kw_render_artist_result_item(index, item, params, callback) {
    const track = {
      id: `kwtrack_${item.musicrid}`,
      title: html_decode(item.name),
      artist: item.artist,
      artist_id: `kwartist_${item.artistid}`,
      album: html_decode(item.album),
      album_id: `kwalbum_${item.albumid}`,
      source: 'kuwo',
      source_url: `https://www.kuwo.cn/play_detail/${item.musicrid}`,
      img_url: '',
      //url: `kwtrack_${item.musicrid}`,
      lyric_url: item.musicrid,
    };

    kw_add_song_pic_in_track(track, params, callback);
  }

  function kw_render_album_result_item(index, item, params, callback) {
    const info = params[0];

    const track = {
      id: `kwtrack_${item.id}`,
      title: html_decode(item.name),
      artist: item.artist,
      artist_id: `kwartist_${item.artistid}`,
      album: info.title,
      album_id: `kwalbum_${info.id}`,
      source: 'kuwo',
      source_url: `https://www.kuwo.cn/play_detail/${item.id}`,
      img_url: '',
      //url: `kwtrack_${item.id}`,
      lyric_url: item.id,
    };

    kw_add_song_pic_in_track(track, params, callback);
  }

  function kw_render_playlist_result_item(index, item, params, callback) {
    const track = {
      id: `kwtrack_${item.id}`,
      title: html_decode(item.name),
      artist: item.artist,
      artist_id: `kwartist_${item.artistid}`,
      album: html_decode(item.album),
      album_id: `kwalbum_${item.albumid}`,
      source: 'kuwo',
      source_url: `https://www.kuwo.cn/play_detail/${item.id}`,
      img_url: '',
      //url: `kwtrack_${item.id}`,
      lyric_url: item.id,
    };

    kw_add_song_pic_in_track(track, params, callback);
  }
  */
  static getToken(isRetry = false): Promise<string> {
    const domain = 'https://www.kuwo.cn';
    const name = 'kw_token';
    return new Promise((res) => {
      cookieGet(
        {
          url: domain,
          name
        },
        async (cookie: any) => {
          if (cookie == null) {
            if (isRetry) {
              res('');
            }
            await axios.get('https://www.kuwo.cn/');
            res(this.getToken(true));
          } else {
            res(cookie.value);
          }
        }
      );
    });
  }

  static kw_get_token(callback: CallableFunction, isRetry = false) {
    const domain = 'https://www.kuwo.cn';
    const name = 'kw_token';

    cookieGet(
      {
        url: domain,
        name
      },
      (cookie: any) => {
        if (cookie == null) {
          if (isRetry) {
            return callback('');
          }
          return axios.get('https://www.kuwo.cn/').then(() => {
            this.kw_get_token(callback, true);
          });
        }
        return callback(cookie.value);
      }
    );
  }
  static async getCookie(url: string) {
    const token = await this.getToken();
    const response = await axios
      .get(url, {
        headers: {
          csrf: token
        }
      })
      .catch(() => {
        return;
      });
    if (response !== undefined && response.data.success === false) {
      // token expire, refetch token and start get url
      const token2 = await this.getToken();
      const res = await axios
        .get(url, {
          headers: {
            csrf: token2
          }
        })
        .catch(() => {
          return;
        });
      return res;
    } else {
      return response;
    }
  }
  static kw_cookie_get(url: string, callback: CallableFunction) {
    this.kw_get_token((token: string) => {
      axios
        .get(url, {
          headers: {
            csrf: token
          }
        })
        .then((response) => {
          if (response.data.success === false) {
            // token expire, refetch token and start get url
            this.kw_get_token((token2: string) => {
              axios
                .get(url, {
                  headers: {
                    csrf: token2
                  }
                })
                .then((res) => {
                  callback(res);
                });
            });
          } else {
            callback(response);
          }
        })
        .catch(() => {
          callback();
        });
    });
  }

  static kw_render_tracks(url: string, page: number) {
    const list_id = getParameterByName('list_id', url)?.split('_').pop();
    const playlist_type = getParameterByName('list_id', url)?.split('_')[0];
    let tracks_url = '';
    switch (playlist_type) {
      case 'kwplaylist':
        // tracks_url = `https://m.kuwo.cn/newh5app/api/mobile/v1/music/playlist/${list_id}?pn=${page}&rn=1000`
        tracks_url = `https://www.kuwo.cn/api/www/playlist/playListInfo?pid=${list_id}&pn=${page}&rn=100&httpsStatus=1`;
        break;
      case 'kwalbum':
        // tracks_url = `https://m.kuwo.cn/newh5app/api/mobile/v1/music/album/${list_id}?rn=1000`
        tracks_url = `https://www.kuwo.cn/api/www/album/albumInfo?albumId=${list_id}&pn=${page}&rn=100&httpsStatus=1`;
        break;
      default:
        break;
    }
    // axios.get(tracks_url).then((response) => {
    return new Promise((res) => {
      this.kw_cookie_get(tracks_url, (response: any) => {
        const tracks = response.data.data.musicList.map(kwConvertSong);
        res(tracks);
      });
    });
  }

  static async search(url: any) {
    // eslint-disable-line no-unused-vars
    const keyword = getParameterByName('keywords', url);
    const curpage = getParameterByName('curpage', url);
    const searchType = getParameterByName('type', url);
    let api = '';
    switch (searchType) {
      case '0':
        api = 'searchMusicBykeyWord';
        break;
      case '1':
        api = 'searchPlayListBykeyWord';
        break;
      default:
        break;
    }
    const target_url = `https://www.kuwo.cn/api/www/search/${api}?key=${keyword}&pn=${curpage}&rn=20`;
    const response = await this.getCookie(target_url);
    let result = <any>[];
    let total = 0;
    if (response === undefined) {
      return {
        result,
        total,
        type: searchType
      };
    }
    if (searchType === '0' && response.data.data !== undefined) {
      result = response.data.data.list.map(kwConvertSong);
      total = response.data.data.total;
    } else if (searchType === '1' && response.data.data !== undefined) {
      result = response.data.data.list.map((item: any) => ({
        id: `kwplaylist_${item.id}`,
        title: html_decode(item.name),
        source: 'kuwo',
        source_url: `https://www.kuwo.cn/playlist_detail/${item.id}`,
        img_url: item.img,
        url: `kwplaylist_${item.id}`,
        author: html_decode(item.uname),
        count: item.total
      }));
      total = response.data.data.total;
    }
    return {
      result,
      total,
      type: searchType
    };
  }

  // eslint-disable-next-line no-unused-vars
  static bootstrapTrack(track: any, success: CallableFunction, failure: CallableFunction) {
    const sound = {} as any;
    const song_id = track.id.slice('kwtrack_'.length);
    const target_url = 'https://antiserver.kuwo.cn/anti.s?' + `type=convert_url&format=mp3&response=url&rid=${song_id}`;
    /* const target_url = 'https://www.kuwo.cn/url?'
      + `format=mp3&rid=${song_id}&response=url&type=convert_url3&br=128kmp3&from=web`;
    https://m.kuwo.cn/newh5app/api/mobile/v1/music/src/${song_id} */

    axios
      .get(target_url)
      .then((response) => {
        const { data } = response;
        if (data.length > 0) {
          sound.url = data;
          sound.platform = 'kuwo';

          success(sound);
        } else {
          failure(sound);
        }
      })
      .catch(() => failure(sound));
  }

  static kw_get_lrc(arr: any[]) {
    const lyric = arr.reduce((str, item) => {
      const t = parseFloat(item.time);
      const m = Math.floor(t / 60);
      const s = Math.floor(t - m * 60);
      const ms = Math.floor((t - m * 60 - s) * 100);
      return `${str}[${this.num2str(m)}:${this.num2str(s)}.${this.num2str(ms)}]${item.lineLyric}\n`;
    }, '');
    return lyric;
  }

  static kw_generate_translation(lrclist: any[]) {
    if (lrclist) {
      lrclist.filter((e: any) => e && e.lineLyric !== '//');

      // 暂时原歌词和翻译都在原歌词显示
      // 酷我的歌词格式中没区分，查看了几个歌词文件发现，翻译歌词也存在和原来歌词的时间轴不一致的情况
      // 如果按照时间区分可能造成错行问题。

      // 将歌词和翻译分成两个数组，并将对应歌词和翻译的时间调整为相等，数组最后一个数据无法做判断，故传给翻译数组做后续处理
      // const lrc_arr = [];
      // const tlrc_arr = [];
      // let lrc_arr = lrclist.filter(
      //   (item, index, self) => {
      //     if (index < self.length - 1) {
      //       if (Number(item.time) === 0) {
      //         return item;
      //       }
      //       return item.time !== self[index + 1].time;
      //     }
      //     return null;
      //   },
      // );
      // let tlrc_arr = lrclist.filter(
      //   (item, index, self) => {
      //     if (index < self.length - 1 && Number(item.time) !== 0
      //       && item.time === self[index + 1].time) {
      //       return item.time === self[index - 1].time;
      //     }
      //     return (index === self.length - 1 ? item : null);
      //   },
      // );
      // // tlrc_arr如只有一个即为没有翻译歌词
      // if (tlrc_arr.length === 1) {
      //   lrc_arr = [...lrc_arr, ...tlrc_arr];
      //   tlrc_arr = [];
      // } else {
      //   tlrc_arr[tlrc_arr.length - 1].time = lrc_arr[lrc_arr.length - 1].time;
      // }
      return {
        lrc: kuwo.kw_get_lrc(lrclist),
        tlrc: kuwo.kw_get_lrc([])
      };
    }
    return {
      lrc: '',
      tlrc: ''
    };
  }

  static async lyric(url: string) {
    // eslint-disable-line no-unused-vars
    const track_id = getParameterByName('lyric_url', url);
    const target_url = `https://m.kuwo.cn/newh5/singles/songinfoandlrc?musicId=${track_id}`;
    let { data } = await axios.get(target_url);
    data = data.status === 200 ? this.kw_generate_translation(data.data.lrclist) : {};
    return {
      lyric: data.lrc || '',
      tlyric: data.tlrc || ''
    };
  }

  static async kw_artist(url: string) {
    // eslint-disable-line no-unused-vars
    const artist_id = getParameterByName('list_id', url)?.split('_').pop();

    const getInfo = async () => {
      const target_url = `https://www.kuwo.cn/api/www/artist/artist?artistid=${artist_id}`;
      const response = await this.getCookie(target_url) as any;
      const { data } = response.data;
      return {
        cover_img_url: data.pic300,
        title: html_decode(data.name),
        id: `kwartist_${data.id}`,
        source_url: `https://www.kuwo.cn/singer_detail/${data.id}`
      };
    };
    // data = JSON.parse(fix_json(data));
    // Get songs
    const getSongs = async () => {
      const target_url = `https://www.kuwo.cn/api/www/artist/artistMusic?artistid=${artist_id}&pn=1&rn=50`;
      const res = await this.getCookie(target_url) as any;
      return res.data.data.list.map(kwConvertSong);
    };

    const [tracks, info] = await Promise.all([getSongs(), getInfo()]);
    return {
      tracks,
      info
    };

    /*
          target_url = 'https://search.kuwo.cn/r.s?stype=artist2music'
            + '&sortby=0&alflac=1&pcmp4=1&encoding=utf8'
            + `&artistid=${artist_id}&pn=0&rn=100`;
          axios.get(target_url).then((response) => {
            let { data } = response; // TODO: Check JSON Schema is correct
            data = JSON.parse(fix_json(data));

            async_process_list(data.musiclist, kw_render_artist_result_item, [],
              (err, tracks) => fn({
                tracks,
                info,
              }));
            */
  }

  static async kw_album(url: string) {
    // eslint-disable-line no-unused-vars
    const album_id = getParameterByName('list_id', url)?.split('_').pop();

    const target_url =
      'https://search.kuwo.cn/r.s?pn=0&rn=0&stype=albuminfo' + `&albumid=${album_id}&alflac=1&pcmp4=1&encoding=utf8` + '&vipver=MUSIC_8.7.7.0_W4';
    let { data } = await axios.get(target_url);

    data = JSON.parse(this.fix_json(data));

    const info = {
      cover_img_url: data.hts_img.replace('/120/', '/400/'),
      title: html_decode(data.name),
      id: `kwalbum_${data.albumid}`,
      source_url: `https://www.kuwo.cn/album_detail/${data.albumid}`
    };
    // Get songs
    const total = data.songnum;
    const page = Math.ceil(total / 100);
    const page_array = Array.from({ length: page }, (v, k) => k + 1);
    const tracks = (await Promise.all(page_array.map((page) => this.kw_render_tracks(url, page)))).flat();
    return {
      tracks,
      info
    };
    /*
          async_process_list(data.musiclist, kw_render_album_result_item, [info],
            (err, tracks) => fn({
              tracks,
              info,
            }));
          */
  }

  static async showPlaylist(url: string) {
    const offset = Number(getParameterByName('offset', url));

    /* const id_available = {
      1265: '经典',
      577: '纯音乐',
      621: '网络',
      155: '怀旧',
      1879: '网红',
      220: '佛乐',
      180: '影视',
      578: '器乐',
      1877: '游戏',
      181: '二次元',
      882: 'KTV',
      216: '喊麦',
      1366: '3D',
      146: '伤感',
      62: '放松',
      58: '励志',
      143: '开心',
      137: '甜蜜',
      139: '兴奋',
      67: '安静',
      66: '治愈',
      147: '寂寞',
      160: '四年',
      366: '运动',
      354: '睡前',
      378: '跳舞',
      1876: '学习',
      353: '清晨',
      359: '夜店',
      382: '校园',
      544: '亲热',
      363: '咖啡店',
      375: '旅行',
      371: '散步',
      386: '工作',
      336: '婚礼',
      637: '70后',
      638: '80后',
      639: '90后',
      640: '00后',
      268: '10后',
      393: '流行',
      391: '电子',
      389: '摇滚',
      1921: '民歌',
      392: '民谣',
      399: '乡村',
      35: '欧洲',
      37: '华语',
    }; */
    // const target_url = 'https://www.kuwo.cn/www/categoryNew/getPlayListInfoUnderCategory?'
    // + `type=taglist&digest=10000&id=${37}&start=${offset}&count=50`;
    const target_url = `https://www.kuwo.cn/api/pc/classify/playlist/getRcmPlayList?pn=${offset / 25 + 1}&rn=25&order=hot&httpsStatus=1`;
    /*
    精选歌单:roder=最热:hot, 最新:new
    tag歌单地址 https://www.kuwo.cn/api/pc/classify/playlist/getTagPlayList?pn=${offset / 25 + 1}&rn=25&id=37&httpsStatus=1
    id =华语:37,
    */
    const { data } = (await axios.get(target_url)).data;

    if (!data) {
      return [];
    }
    /** @type {{cover_img_url:string;id:string;source_url:string;title:string}[]}*/
    const result = data.data.map((item: any) => ({
      cover_img_url: item.img,
      title: item.name,
      id: `kwplaylist_${item.id}`,
      source_url: `https://www.kuwo.cn/playlist_detail/${item.id}`
    }));
    return result;
  }

  static async kw_get_playlist(url: string) {
    // eslint-disable-line no-unused-vars
    const list_id = getParameterByName('list_id', url)?.split('_').pop();
    const target_url = `https://nplserver.kuwo.cn/pl.svc?op=getlistinfo&pn=0&rn=0&encode=utf-8&keyset=pl2012&pcmp4=1&pid=${list_id}&vipver=MUSIC_9.0.2.0_W1&newver=1`;
    // https://www.kuwo.cn/api/www/playlist/playListInfo?pid=3134372426&pn=1&rn=30
    const { data } = await axios.get(target_url);

    const info = {
      cover_img_url: data.pic.replace('_150.jpg', '_400.jpg'),
      title: data.title,
      id: `kwplaylist_${data.id}`,
      source_url: `https://www.kuwo.cn/playlist_detail/${data.id}`
    };
    const { total } = data;
    const page = Math.ceil(total / 100);
    const page_array = Array.from({ length: page }, (v, k) => k + 1);
    const tracks = (await Promise.all(page_array.map((page) => this.kw_render_tracks(url, page)))).flat();
    return { tracks, info };

    /*
          async_process_list(data.musiclist, kw_render_playlist_result_item, [],
            (err, tracks) => fn({
              tracks,
              info,
            }));
          */
  }

  static async parseUrl(myurl: string) {
    let result;
    let id;
    let url = myurl;
    url = url.replace(/kuwo.cn\/(h5app|newh5(?:app){0,1})\//, 'kuwo.cn/');
    url = url.replace(/kuwo.cn\/(album\/|\?albumid=)/, 'kuwo.cn/album_detail/');
    url = url.replace(/kuwo.cn\/(artist|singers)\//, 'kuwo.cn/singer_detail/');
    url = url.replace(/kuwo.cn\/playlist\//, 'kuwo.cn/playlist_detail/');
    if (url.search('kuwo.cn/playlist_detail') !== -1) {
      const match = /kuwo.cn\/playlist_detail\/([0-9]+)/.exec(url);
      id = match ? match[1] : getParameterByName('pid', url);
      result = {
        type: 'playlist',
        id: `kwplaylist_${id}`
      };
    } else if (url.search('kuwo.cn/singer_detail') !== -1) {
      const match = /kuwo.cn\/singer_detail\/([0-9]+)/.exec(url);
      id = match ? match[1] : getParameterByName('id', url);
      result = {
        type: 'playlist',
        id: `kwartist_${id}`
      };
    } else if (url.search('kuwo.cn/album_detail') !== -1) {
      const match = /kuwo.cn\/album_detail\/([0-9]+)/.exec(url);
      if (match) {
        // eslint-disable-next-line prefer-destructuring
        id = match[1];
        result = {
          type: 'playlist',
          id: `kwalbum_${id}`
        };
      }
    }
    return result;
  }

  static getPlaylist(url: string) {
    const list_id = getParameterByName('list_id', url)?.split('_')[0];
    switch (list_id) {
      case 'kwplaylist':
        return this.kw_get_playlist(url);
      case 'kwalbum':
        return this.kw_album(url);
      case 'kwartist':
        return this.kw_artist(url);
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
    return `https://www.kuwo.com`;
  }

  static logout() {
    // empty block
  }
  static async getCommentList(trackId: string, offset: number, limit: number) {
    limit = 20;
    const page = offset / limit + 1;
    const kuwoId = trackId.split('_')[1];
    const target_url = `http://comment.kuwo.cn/com.s?type=get_rec_comment&uid=0&digest=15&sid=${kuwoId}&page=${page}&rows=${limit}&f=web&devid=0`;

    const response = await axios.get(target_url);

    let comments = [];
    if(response.data.rows) {
      comments = response.data.rows.map((item: any) => {
        const data = {
          id: item.id,
          content: item.msg,
          time: item.time,
          nickname: decodeURIComponent(item.u_name),
          avatar: item.u_pic,
          user_id: item.u_id,
          like: item.like_num,
          reply: []
        };
        return item.reply
          ? {
              id: item.id,
              content: item.reply.msg,
              time: item.reply.time,
              nickname: decodeURIComponent(item.reply.u_name),
              avatar: item.reply.u_pic,
              user_id: item.reply.u_id,
              like: item.reply.like_num,
              reply: [data]
            }
          : data;
      });
    }

    return { comments, total: comments.length, offset, limit };

  }
}

export default provider;