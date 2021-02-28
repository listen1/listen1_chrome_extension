/* eslint-disable no-use-before-define */
/* global getParameterByName */
function build_qq() {
  function htmlDecode(value) {
    const parser = new DOMParser();
    return parser.parseFromString(value, 'text/html').body.textContent;
  }

  function qq_show_playlist(url) {
    const offset = Number(getParameterByName('offset', url)) || 0;
    const target_url =
      'https://c.y.qq.com/splcloud/fcgi-bin/fcg_get_diss_by_tag.fcg' +
      `?picmid=1&rnd=${Math.random()}&g_tk=732560869` +
      '&loginUin=0&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8' +
      '&notice=0&platform=yqq.json&needNewCode=0' +
      `&categoryId=10000000&sortId=5&sin=${offset}&ein=${29 + offset}`;

    return {
      success: (fn) => {
        axios.get(target_url).then((response) => {
          const { data } = response;

          const playlists = data.data.list.map((item) => ({
            cover_img_url: item.imgurl,
            title: htmlDecode(item.dissname),
            id: `qqplaylist_${item.dissid}`,
            source_url: `https://y.qq.com/#type=taoge&id=${item.dissid}`,
          }));

          return fn({
            result: playlists,
          });
        });
      },
    };
  }

  function qq_get_image_url(qqimgid, img_type) {
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

  function qq_is_playable(song) {
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

  function qq_convert_song(song) {
    const d = {
      id: `qqtrack_${song.songmid}`,
      title: htmlDecode(song.songname),
      artist: htmlDecode(song.singer[0].name),
      artist_id: `qqartist_${song.singer[0].mid}`,
      album: htmlDecode(song.albumname),
      album_id: `qqalbum_${song.albummid}`,
      img_url: qq_get_image_url(song.albummid, 'album'),
      source: 'qq',
      source_url: `https://y.qq.com/#type=song&mid=${song.songmid}&tpl=yqq_song_detail`,
      // url: `qqtrack_${song.songmid}`,
      url: !qq_is_playable(song) ? '' : undefined,
    };
    return d;
  }

  function qq_get_playlist(url) {
    // eslint-disable-line no-unused-vars
    const list_id = getParameterByName('list_id', url).split('_').pop();

    return {
      success(fn) {
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
            source_url: `https://y.qq.com/#type=taoge&id=${list_id}`,
          };

          const tracks = data.cdlist[0].songlist.map((item) =>
            qq_convert_song(item)
          );
          return fn({
            tracks,
            info,
          });
        });
      },
    };
  }

  function qq_album(url) {
    const album_id = getParameterByName('list_id', url).split('_').pop();

    return {
      success(fn) {
        const target_url =
          'https://i.y.qq.com/v8/fcg-bin/fcg_v8_album_info_cp.fcg' +
          `?platform=h5page&albummid=${album_id}&g_tk=938407465` +
          '&uin=0&format=json&inCharset=utf-8&outCharset=utf-8' +
          '&notice=0&platform=h5&needNewCode=1&_=1459961045571';
        axios.get(target_url).then((response) => {
          const { data } = response;

          const info = {
            cover_img_url: qq_get_image_url(album_id, 'album'),
            title: data.data.name,
            id: `qqalbum_${album_id}`,
            source_url: `https://y.qq.com/#type=album&mid=${album_id}`,
          };

          const tracks = data.data.list.map((item) => qq_convert_song(item));
          return fn({
            tracks,
            info,
          });
        });
      },
    };
  }

  function qq_artist(url) {
    const artist_id = getParameterByName('list_id', url).split('_').pop();

    return {
      success(fn) {
        const target_url =
          'https://i.y.qq.com/v8/fcg-bin/fcg_v8_singer_track_cp.fcg' +
          `?platform=h5page&order=listen&begin=0&num=50&singermid=${artist_id}` +
          '&g_tk=938407465&uin=0&format=json&' +
          'inCharset=utf-8&outCharset=utf-8&notice=0&platform=' +
          'h5&needNewCode=1&from=h5&_=1459960621777';
        axios.get(target_url).then((response) => {
          const { data } = response;

          const info = {
            cover_img_url: qq_get_image_url(artist_id, 'artist'),
            title: data.data.singer_name,
            id: `qqartist_${artist_id}`,
            source_url: `https://y.qq.com/#type=singer&mid=${artist_id}`,
          };

          const tracks = data.data.list.map((item) =>
            qq_convert_song(item.musicData)
          );
          return fn({
            tracks,
            info,
          });
        });
      },
    };
  }

  function qq_search(url) {
    // eslint-disable-line no-unused-vars
    const keyword = getParameterByName('keywords', url);
    const curpage = getParameterByName('curpage', url);
    const searchType = getParameterByName('type', url);
    let target_url = '';
    switch (searchType) {
      case '0':
        target_url =
          'https://i.y.qq.com/s.music/fcgi-bin/search_for_qq_cp?' +
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
      success(fn) {
        axios.get(target_url).then((response) => {
          const { data } = response;
          let result = [];
          let total = 0;
          if (searchType === '0') {
            result = data.data.song.list.map((item) => qq_convert_song(item));
            total = data.data.song.totalnum;
          } else if (searchType === '1') {
            result = data.data.list.map((info) => ({
              id: `qqplaylist_${info.dissid}`,
              title: htmlDecode(info.dissname),
              source: 'qq',
              source_url: `https://y.qq.com/#type=taoge&id=${info.dissid}`,
              img_url: info.imgurl,
              url: `qqplaylist_${info.dissid}`,
              author: UnicodeToAscii(info.creator.name),
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

  function UnicodeToAscii(str) {
    const result = str.replace(/&#(\d+);/g, () =>
      // eslint-disable-next-line prefer-rest-params
      String.fromCharCode(arguments[1])
    );
    return result;
  }

  // eslint-disable-next-line no-unused-vars
  function qq_bootstrap_track(sound, track, success, failure) {
    const songId = track.id.slice('qqtrack_'.length);
    const target_url =
      'https://u.y.qq.com/cgi-bin/musicu.fcg?loginUin=0&' +
      'hostUin=0&format=json&inCharset=utf8&outCharset=utf-8&notice=0&' +
      'platform=yqq.json&needNewCode=0&data=%7B%22req_0%22%3A%7B%22' +
      'module%22%3A%22vkey.GetVkeyServer%22%2C%22method%22%3A%22' +
      `CgiGetVkey%22%2C%22param%22%3A%7B%22guid%22%3A%2210000%22%2C%22songmid%22%3A%5B%22${songId}%22%5D%2C%22songtype%22%3A%5B0%5D%2C%22uin%22%3A%220%22%2C%22loginflag%22` +
      '%3A1%2C%22platform%22%3A%2220%22%7D%7D%2C%22comm%22%3A%7B%22uin%22%3A0%2C%22' +
      'format%22%3A%22json%22%2C%22ct%22%3A20%2C%22cv%22%3A0%7D%7D';
    axios.get(target_url).then((response) => {
      const { data } = response;
      if (data.req_0.data.midurlinfo[0].purl === '') {
        // vip
        failure();
        return;
      }
      const url = data.req_0.data.sip[0] + data.req_0.data.midurlinfo[0].purl;
      sound.url = url; // eslint-disable-line no-param-reassign
      success();
    });
  }

  // eslint-disable-next-line no-unused-vars
  function str2ab(str) {
    // string to array buffer.
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i += 1) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

  function qq_lyric(url) {
    // eslint-disable-line no-unused-vars
    const track_id = getParameterByName('track_id', url).split('_').pop();
    // use chrome extension to modify referer.
    const target_url =
      'https://i.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?' +
      `songmid=${track_id}&g_tk=5381&format=json&inCharset=utf8&outCharset=utf-8&nobase64=1`;
    return {
      success(fn) {
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

  function qq_parse_url(url) {
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
    match = /\/\/y.qq.com\/n\/m\/detail\/taoge\/index.html\?id=([0-9]+)/.exec(
      url
    );
    if (match != null) {
      const playlist_id = match[1];
      result = {
        type: 'playlist',
        id: `qqplaylist_${playlist_id}`,
      };
    }
    return result;
  }

  function get_playlist(url) {
    const list_id = getParameterByName('list_id', url).split('_')[0];
    switch (list_id) {
      case 'qqplaylist':
        return qq_get_playlist(url);
      case 'qqalbum':
        return qq_album(url);
      case 'qqartist':
        return qq_artist(url);
      default:
        return null;
    }
  }

  function get_playlist_filters() {
    const result = [];
    return {
      success(fn) {
        return fn(result);
      },
    };
  }

  return {
    show_playlist: qq_show_playlist,
    get_playlist_filters,
    get_playlist,
    parse_url: qq_parse_url,
    bootstrap_track: qq_bootstrap_track,
    search: qq_search,
    lyric: qq_lyric,
  };
}

const qq = build_qq(); // eslint-disable-line no-unused-vars
