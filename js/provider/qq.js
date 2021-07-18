/* eslint-disable no-use-before-define */
/* global getParameterByName cookieGet cookieRemove */
// eslint-disable-next-line no-unused-vars
class qq {
  static htmlDecode(value) {
    const parser = new DOMParser();
    return parser.parseFromString(value, 'text/html').body.textContent;
  }

  static qq_show_toplist(offset) {
    if (offset !== undefined && offset > 0) {
      return {
        success: (fn) => fn({ result: [] }),
      };
    }
    const url =
      'https://c.y.qq.com/v8/fcg-bin/fcg_myqq_toplist.fcg?g_tk=5381&inCharset=utf-8&outCharset=utf-8&notice=0&format=json&uin=0&needNewCode=1&platform=h5';

    return {
      success: (fn) => {
        axios.get(url).then((response) => {
          const result = [];
          response.data.data.topList.forEach((item) => {
            const playlist = {
              cover_img_url: item.picUrl,
              id: `qqtoplist_${item.id}`,
              source_url: `https://y.qq.com/n/yqq/toplist/${item.id}.html`,
              title: item.topTitle,
            };
            result.push(playlist);
          });
          return fn({ result });
        });
      },
    };
  }

  static show_playlist(url) {
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

    return {
      success: (fn) => {
        axios.get(target_url).then((response) => {
          const { data } = response;

          const playlists = data.data.list.map((item) => ({
            cover_img_url: item.imgurl,
            title: this.htmlDecode(item.dissname),
            id: `qqplaylist_${item.dissid}`,
            source_url: `https://y.qq.com/n/ryqq/playlist/${item.dissid}`,
          }));

          return fn({
            result: playlists,
          });
        });
      },
    };
  }

  static qq_get_image_url(qqimgid, img_type) {
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

  static qq_is_playable(song) {
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

  static qq_convert_song(song) {
    const d = {
      id: `qqtrack_${song.songmid}`,
      title: this.htmlDecode(song.songname),
      artist: this.htmlDecode(song.singer[0].name),
      artist_id: `qqartist_${song.singer[0].mid}`,
      album: this.htmlDecode(song.albumname),
      album_id: `qqalbum_${song.albummid}`,
      img_url: this.qq_get_image_url(song.albummid, 'album'),
      source: 'qq',
      source_url: `https://y.qq.com/#type=song&mid=${song.songmid}&tpl=yqq_song_detail`,
      // url: `qqtrack_${song.songmid}`,
      url: !qq.qq_is_playable(song) ? '' : undefined,
    };
    return d;
  }

  static get_toplist_url(id, period, limit) {
    return `https://u.y.qq.com/cgi-bin/musicu.fcg?format=json&inCharset=utf8&outCharset=utf-8&platform=yqq.json&needNewCode=0&data=${encodeURIComponent(
      JSON.stringify({
        comm: {
          cv: 1602,
          ct: 20,
        },
        toplist: {
          module: 'musicToplist.ToplistInfoServer',
          method: 'GetDetail',
          param: {
            topid: id,
            num: limit,
            period,
          },
        },
      })
    )}`;
  }

  static get_periods(topid) {
    const periodUrl = 'https://c.y.qq.com/node/pc/wk_v15/top.html';
    const regExps = {
      periodList:
        /<i class="play_cover__btn c_tx_link js_icon_play" data-listkey=".+?" data-listname=".+?" data-tid=".+?" data-date=".+?" .+?<\/i>/g,
      period:
        /data-listname="(.+?)" data-tid=".*?\/(.+?)" data-date="(.+?)" .+?<\/i>/,
    };
    const periods = {};
    return axios.get(periodUrl).then((response) => {
      const html = response.data;
      const pl = html.match(regExps.periodList);
      if (!pl) return Promise.reject();
      pl.forEach((p) => {
        const pr = p.match(regExps.period);
        if (!pr) return;
        periods[pr[2]] = {
          name: pr[1],
          id: pr[2],
          period: pr[3],
        };
      });
      const info = periods[topid];
      return info && info.period;
    });
  }

  static qq_toplist(url) {
    // special thanks to lx-music-desktop solution
    // https://github.com/lyswhut/lx-music-desktop/blob/24521bf50d80512a44048596639052e3194b2bf1/src/renderer/utils/music/tx/leaderboard.js

    const list_id = Number(getParameterByName('list_id', url).split('_').pop());

    return {
      success: (fn) => {
        this.get_periods(list_id).then((listPeriod) => {
          const limit = 100;
          // TODO: visit all pages of toplist
          const target_url = this.get_toplist_url(list_id, listPeriod, limit);

          axios.get(target_url).then((response) => {
            const { data } = response;
            const tracks = data.toplist.data.songInfoList.map((song) => {
              const d = {
                id: `qqtrack_${song.mid}`,
                title: this.htmlDecode(song.name),
                artist: this.htmlDecode(song.singer[0].name),
                artist_id: `qqartist_${song.singer[0].mid}`,
                album: this.htmlDecode(song.album.name),
                album_id: `qqalbum_${song.album.mid}`,
                img_url: this.qq_get_image_url(song.album.mid, 'album'),
                source: 'qq',
                source_url: `https://y.qq.com/#type=song&mid=${song.mid}&tpl=yqq_song_detail`,
              };
              return d;
            });
            const info = {
              cover_img_url: data.toplist.data.data.frontPicUrl,
              title: data.toplist.data.data.title,
              id: `qqtoplist_${list_id}`,
              source_url: `https://y.qq.com/n/yqq/toplist/${list_id}.html`,
            };
            return fn({
              tracks,
              info,
            });
          });
        });
      },
    };
  }

  static qq_get_playlist(url) {
    // eslint-disable-line no-unused-vars
    const list_id = getParameterByName('list_id', url).split('_').pop();

    return {
      success: (fn) => {
        const target_url =
          'https://i.y.qq.com/qzone-music/fcg-bin/fcg_ucc_getcdinfo_' +
          'byids_cp.fcg?type=1&json=1&utf8=1&onlysong=0' +
          `&nosign=1&disstid=${list_id}&g_tk=5381&loginUin=0&hostUin=0` +
          '&format=json&inCharset=GB2312&outCharset=utf-8&notice=0' +
          '&platform=yqq&needNewCode=0';
        axios.get(target_url).then((response) => {
          const { data } = response;

          const info = {
            cover_img_url: data.cdlist[0].logo,
            title: data.cdlist[0].dissname,
            id: `qqplaylist_${list_id}`,
            source_url: `https://y.qq.com/n/ryqq/playlist/${list_id}`,
          };

          const tracks = data.cdlist[0].songlist.map((item) =>
            this.qq_convert_song(item)
          );
          return fn({
            tracks,
            info,
          });
        });
      },
    };
  }

  static qq_album(url) {
    const album_id = getParameterByName('list_id', url).split('_').pop();

    return {
      success: (fn) => {
        const target_url =
          'https://i.y.qq.com/v8/fcg-bin/fcg_v8_album_info_cp.fcg' +
          `?platform=h5page&albummid=${album_id}&g_tk=938407465` +
          '&uin=0&format=json&inCharset=utf-8&outCharset=utf-8' +
          '&notice=0&platform=h5&needNewCode=1&_=1459961045571';
        axios.get(target_url).then((response) => {
          const { data } = response;

          const info = {
            cover_img_url: this.qq_get_image_url(album_id, 'album'),
            title: data.data.name,
            id: `qqalbum_${album_id}`,
            source_url: `https://y.qq.com/#type=album&mid=${album_id}`,
          };

          const tracks = data.data.list.map((item) =>
            this.qq_convert_song(item)
          );
          return fn({
            tracks,
            info,
          });
        });
      },
    };
  }

  static qq_artist(url) {
    const artist_id = getParameterByName('list_id', url).split('_').pop();

    return {
      success: (fn) => {
        const target_url =
          'https://i.y.qq.com/v8/fcg-bin/fcg_v8_singer_track_cp.fcg' +
          `?platform=h5page&order=listen&begin=0&num=50&singermid=${artist_id}` +
          '&g_tk=938407465&uin=0&format=json&' +
          'inCharset=utf-8&outCharset=utf-8&notice=0&platform=' +
          'h5&needNewCode=1&from=h5&_=1459960621777';
        axios.get(target_url).then((response) => {
          const { data } = response;

          const info = {
            cover_img_url: this.qq_get_image_url(artist_id, 'artist'),
            title: data.data.singer_name,
            id: `qqartist_${artist_id}`,
            source_url: `https://y.qq.com/#type=singer&mid=${artist_id}`,
          };

          const tracks = data.data.list.map((item) =>
            this.qq_convert_song(item.musicData)
          );
          return fn({
            tracks,
            info,
          });
        });
      },
    };
  }

  static search(url) {
    // eslint-disable-line no-unused-vars
    const keyword = getParameterByName('keywords', url);
    const curpage = getParameterByName('curpage', url);
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
    return {
      success: (fn) => {
        axios.get(target_url).then((response) => {
          const { data } = response;
          let result = [];
          let total = 0;
          if (searchType === '0') {
            result = data.data.song.list.map((item) =>
              this.qq_convert_song(item)
            );
            total = data.data.song.totalnum;
          } else if (searchType === '1') {
            result = data.data.list.map((info) => ({
              id: `qqplaylist_${info.dissid}`,
              title: this.htmlDecode(info.dissname),
              source: 'qq',
              source_url: `https://y.qq.com/n/ryqq/playlist/${info.dissid}`,
              img_url: info.imgurl,
              url: `qqplaylist_${info.dissid}`,
              author: this.UnicodeToAscii(info.creator.name),
              count: info.song_count,
            }));
            total = data.data.sum;
          }
          return fn({
            result,
            total,
            type: searchType,
          });
        });
      },
    };
  }

  static UnicodeToAscii(str) {
    const result = str.replace(/&#(\d+);/g, () =>
      // eslint-disable-next-line prefer-rest-params
      String.fromCharCode(arguments[1])
    );
    return result;
  }

  // eslint-disable-next-line no-unused-vars
  static bootstrap_track(track, success, failure) {
    const sound = {};
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
        bitrate: 'M4A',
      },
      128: {
        s: 'M500',
        e: '.mp3',
        bitrate: '128kbps',
      },
      320: {
        s: 'M800',
        e: '.mp3',
        bitrate: '320kbps',
      },
      ape: {
        s: 'A000',
        e: '.ape',
        bitrate: 'APE',
      },
      flac: {
        s: 'F000',
        e: '.flac',
        bitrate: 'FLAC',
      },
    };
    const fileInfo = fileConfig[fileType];
    const file =
      songmidList.length === 1 &&
      `${fileInfo.s}${songId}${songId}${fileInfo.e}`;

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
          platform: '20',
        },
      },
      loginUin: uin,
      comm: {
        uin,
        format: 'json',
        ct: 24,
        cv: 0,
      },
    };
    const params = {
      format: 'json',
      data: JSON.stringify(reqData),
    };
    axios.get(target_url, { params }).then((response) => {
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
    });
  }

  // eslint-disable-next-line no-unused-vars
  static str2ab(str) {
    // string to array buffer.
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i += 1) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

  static lyric(url) {
    // eslint-disable-line no-unused-vars
    const track_id = getParameterByName('track_id', url).split('_').pop();
    // use chrome extension to modify referer.
    const target_url =
      'https://i.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?' +
      `songmid=${track_id}&g_tk=5381&format=json&inCharset=utf8&outCharset=utf-8&nobase64=1`;
    return {
      success: (fn) => {
        axios.get(target_url).then((response) => {
          const { data } = response;
          const lrc = data.lyric || '';
          const tlrc = data.trans.replace(/\/\//g, '') || '';
          return fn({
            lyric: lrc,
            tlyric: tlrc,
          });
        });
      },
    };
  }

  static parse_url(url) {
    return {
      success: (fn) => {
        let result;

        let match = /\/\/y.qq.com\/n\/yqq\/playlist\/([0-9]+)/.exec(url);
        if (match != null) {
          const playlist_id = match[1];
          result = {
            type: 'playlist',
            id: `qqplaylist_${playlist_id}`,
          };
        }
        match = /\/\/y.qq.com\/n\/yqq\/playsquare\/([0-9]+)/.exec(url);
        if (match != null) {
          const playlist_id = match[1];
          result = {
            type: 'playlist',
            id: `qqplaylist_${playlist_id}`,
          };
        }
        match =
          /\/\/y.qq.com\/n\/m\/detail\/taoge\/index.html\?id=([0-9]+)/.exec(
            url
          );
        if (match != null) {
          const playlist_id = match[1];
          result = {
            type: 'playlist',
            id: `qqplaylist_${playlist_id}`,
          };
        }

        // c.y.qq.com/base/fcgi-bin/u?__=1MsbSLu
        match = /\/\/c.y.qq.com\/base\/fcgi-bin\/u\?__=([0-9a-zA-Z]+)/.exec(
          url
        );
        if (match != null) {
          return axios
            .get(url)
            .then((response) => {
              const { responseURL } = response.request;
              const playlist_id = getParameterByName('id', responseURL);
              result = {
                type: 'playlist',
                id: `qqplaylist_${playlist_id}`,
              };
              return fn(result);
            })
            .catch(() => fn(undefined));
        }
        return fn(result);
      },
    };
  }

  static get_playlist(url) {
    const list_id = getParameterByName('list_id', url).split('_')[0];
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

  static get_playlist_filters() {
    const target_url =
      'https://c.y.qq.com/splcloud/fcgi-bin/fcg_get_diss_tag_conf.fcg' +
      `?picmid=1&rnd=${Math.random()}&g_tk=732560869` +
      '&loginUin=0&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8' +
      '&notice=0&platform=yqq.json&needNewCode=0';

    return {
      success: (fn) => {
        axios.get(target_url).then((response) => {
          const { data } = response;
          const all = [];
          data.data.categories.forEach((cate) => {
            const result = { category: cate.categoryGroupName, filters: [] };
            if (cate.usable === 1) {
              cate.items.forEach((item) => {
                result.filters.push({
                  id: item.categoryId,
                  name: this.htmlDecode(item.categoryName),
                });
              });
              all.push(result);
            }
          });
          const recommendLimit = 8;
          const recommend = [
            { id: '', name: '全部' },
            { id: 'toplist', name: '排行榜' },
            ...all[1].filters.slice(0, recommendLimit),
          ];

          return fn({
            recommend,
            all,
          });
        });
      },
    };
  }

  static get_user_by_uin(uin, callback) {
    const infoUrl = `https://u.y.qq.com/cgi-bin/musicu.fcg?format=json&&loginUin=${uin}&hostUin=0inCharset=utf8&outCharset=utf-8&platform=yqq.json&needNewCode=0&data=${encodeURIComponent(
      JSON.stringify({
        comm: { ct: 24, cv: 0 },
        vip: {
          module: 'userInfo.VipQueryServer',
          method: 'SRFVipQuery_V2',
          param: { uin_list: [uin] },
        },
        base: {
          module: 'userInfo.BaseUserInfoServer',
          method: 'get_user_baseinfo_v2',
          param: { vec_uin: [uin] },
        },
      })
    )}`;

    return axios.get(infoUrl).then((response) => {
      const { data } = response;
      const info = data.base.data.map_userinfo[uin];
      const result = {
        is_login: true,
        user_id: uin,
        user_name: uin,
        nickname: info.nick,
        avatar: info.headurl,
        platform: 'qq',
        data,
      };
      return callback({ status: 'success', data: result });
    });
  }

  static get_user_created_playlist(url) {
    const user_id = getParameterByName('user_id', url);
    // TODO: load more than size
    const size = 100;

    const target_url = `https://c.y.qq.com/rsc/fcgi-bin/fcg_user_created_diss?cv=4747474&ct=24&format=json&inCharset=utf-8&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=1&uin=${user_id}&hostuin=${user_id}&sin=0&size=${size}`;

    return {
      success: (fn) => {
        axios.get(target_url).then((response) => {
          const playlists = [];
          response.data.data.disslist.forEach((item) => {
            let playlist = {};
            if (item.dir_show === 0) {
              if (item.tid === 0) {
                return;
              }
              if (item.diss_name === '我喜欢') {
                playlist = {
                  cover_img_url:
                    'https://y.gtimg.cn/mediastyle/y/img/cover_love_300.jpg',
                  id: `qqplaylist_${item.tid}`,
                  source_url: `https://y.qq.com/n/ryqq/playlist/${item.tid}`,
                  title: item.diss_name,
                };
                playlists.push(playlist);
              }
            } else {
              playlist = {
                cover_img_url: item.diss_cover,
                id: `qqplaylist_${item.tid}`,
                source_url: `https://y.qq.com/n/ryqq/playlist/${item.tid}`,
                title: item.diss_name,
              };
              playlists.push(playlist);
            }
          });
          return fn({
            status: 'success',
            data: {
              playlists,
            },
          });
        });
      },
    };
  }

  static get_user_favorite_playlist(url) {
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
      ein: size,
    };
    return {
      success: (fn) => {
        axios.get(target_url, { params: data }).then((response) => {
          const playlists = [];
          response.data.data.cdlist.forEach((item) => {
            let playlist = {};
            if (item.dir_show === 0) {
              return;
            }
            playlist = {
              cover_img_url: item.logo,
              id: `qqplaylist_${item.dissid}`,
              source_url: `https://y.qq.com/n/ryqq/playlist/${item.dissid}`,
              title: item.dissname,
            };
            playlists.push(playlist);
          });
          return fn({
            status: 'success',
            data: {
              playlists,
            },
          });
        });
      },
    };
  }

  static get_recommend_playlist() {
    const target_url = `https://u.y.qq.com/cgi-bin/musicu.fcg?format=json&&loginUin=0&hostUin=0inCharset=utf8&outCharset=utf-8&platform=yqq.json&needNewCode=0&data=${encodeURIComponent(
      JSON.stringify({
        comm: {
          ct: 24,
        },
        recomPlaylist: {
          method: 'get_hot_recommend',
          param: {
            async: 1,
            cmd: 2,
          },
          module: 'playlist.HotRecommendServer',
        },
      })
    )}`;

    return {
      success: (fn) => {
        axios.get(target_url).then((response) => {
          const playlists = [];
          response.data.recomPlaylist.data.v_hot.forEach((item) => {
            const playlist = {
              cover_img_url: item.cover,
              id: `qqplaylist_${item.content_id}`,
              source_url: `https://y.qq.com/n/ryqq/playlist/${item.content_id}`,
              title: item.title,
            };
            playlists.push(playlist);
          });
          return fn({
            status: 'success',
            data: {
              playlists,
            },
          });
        });
      },
    };
  }

  static get_user() {
    return {
      success: (fn) => {
        const domain = 'https://y.qq.com';
        cookieGet(
          {
            url: domain,
            name: 'uin',
          },
          (qqCookie) => {
            if (qqCookie === null) {
              return cookieGet(
                {
                  url: domain,
                  name: 'wxuin',
                },
                (wxCookie) => {
                  if (wxCookie == null) {
                    return fn({ status: 'fail', data: {} });
                  }
                  let { value: uin } = wxCookie;
                  uin = `1${uin.slice('o'.length)}`; // replace prefix o with 1
                  return this.get_user_by_uin(uin, fn);
                }
              );
            }
            const { value: uin } = qqCookie;
            return this.get_user_by_uin(uin, fn);
          }
        );
      },
    };
  }

  static get_login_url() {
    return `https://y.qq.com/portal/profile.html`;
  }

  static logout() {
    cookieRemove(
      {
        url: 'https://y.qq.com',
        name: 'uin',
      },
      () => {
        cookieRemove(
          {
            url: 'https://y.qq.com',
            name: 'wxuin',
          },
          () => {}
        );
      }
    );
  }
}
