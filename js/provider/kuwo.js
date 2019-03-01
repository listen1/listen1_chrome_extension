/* global async getParameterByName */
function build_kuwo() {
  // Convert html code
  function html_decode(str) {
    return str.replace(/(&nbsp;)/g, ' ');
  }
  // Fix single quote in json
  function fix_json(data) {
    return data.replace(/(')/g, '"');
  }

  function num2str(num) {
    // const t = parseInt(num, 10);
    return parseInt(num / 10, 10).toString() + (num % 10).toString();
  }

  function kw_convert_song(item) {
    const song_id = item.MUSICRID.split('_').pop();
    const track = {
      id: `kwtrack_${song_id}`,
      title: html_decode(item.SONGNAME),
      artist: html_decode(item.ARTIST),
      artist_id: `kwartist_${item.ARTISTID}`,
      album: html_decode(item.ALBUM),
      album_id: `kwalbum_${item.ALBUMID}`,
      source: 'kuwo',
      source_url: `http://www.kuwo.cn/yinyue/${song_id}`,
      img_url: '',
      url: `xmtrack_${song_id}`,
      lyric_url: song_id,
    };
    return track;
  }

  function async_process_list(data_list, handler, handler_extra_param_list, callback) {
    const fnDict = {};
    data_list.forEach((item, index) => {
      fnDict[index] = cb => handler(index, item, handler_extra_param_list, cb);
    });
    async.parallel(fnDict, (err, results) => {
      callback(null, data_list.map((item, index) => results[index]));
    });
  }

  function kw_add_song_pic_in_track(track, params, callback) {
    const hm = params[0];

    // Add song picture image
    const target_url = `${'http://artistpicserver.kuwo.cn/pic.web?'
      + 'type=rid_pic&pictype=url&size=240&rid='}${track.lyric_url}`;
    hm({
      url: target_url,
      method: 'GET',
      transformResponse: undefined,
    }).then((response) => {
      const { data } = response;
      track.img_url = data; // eslint-disable-line no-param-reassign
      callback(null, track);
    });
  }

  function kw_render_search_result_item(index, item, params, callback) {
    // const hm = params[0];

    const track = kw_convert_song(item);
    kw_add_song_pic_in_track(track, params, callback);
  }

  function kw_render_artist_result_item(index, item, params, callback) {
    // const hm = params[0];

    const track = {
      id: `kwtrack_${item.musicrid}`,
      title: html_decode(item.name),
      artist: item.artist,
      artist_id: `kwartist_${item.artistid}`,
      album: html_decode(item.album),
      album_id: `kwalbum_${item.albumid}`,
      source: 'kuwo',
      source_url: `http://www.kuwo.cn/yinyue/${item.musicrid}`,
      img_url: '',
      url: `xmtrack_${item.musicrid}`,
      lyric_url: item.musicrid,
    };

    kw_add_song_pic_in_track(track, params, callback);
  }

  function kw_render_album_result_item(index, item, params, callback) {
    // const hm = params[0];
    const info = params[1];

    const track = {
      id: `kwtrack_${item.id}`,
      title: html_decode(item.name),
      artist: item.artist,
      artist_id: `kwartist_${item.artistid}`,
      album: info.title,
      album_id: `kwalbum_${info.id}`,
      source: 'kuwo',
      source_url: `http://www.kuwo.cn/yinyue/${item.id}`,
      img_url: '',
      url: `xmtrack_${item.id}`,
      lyric_url: item.id,
    };

    kw_add_song_pic_in_track(track, params, callback);
  }

  function kw_render_playlist_result_item(index, item, params, callback) {
    // const hm = params[0];

    const track = {
      id: `kwtrack_${item.id}`,
      title: html_decode(item.name),
      artist: item.artist,
      artist_id: `kwartist_${item.artistid}`,
      album: html_decode(item.album),
      album_id: `kwalbum_${item.albumid}`,
      source: 'kuwo',
      source_url: `http://www.kuwo.cn/yinyue/${item.id}`,
      img_url: '',
      url: `xmtrack_${item.id}`,
      lyric_url: item.id,
    };

    kw_add_song_pic_in_track(track, params, callback);
  }

  function kw_search(url, hm, se) { // eslint-disable-line no-unused-vars
    // API From https://blog.csdn.net/u011354613/article/details/52756467
    const keyword = getParameterByName('keywords', url);
    let curpage = getParameterByName('curpage', url);
    // page number is started from 0
    curpage -= 1;
    const target_url = `${'http://search.kuwo.cn/r.s?'
      + 'ft=music&itemset=web_2013&client=kt'
      + '&rformat=json&encoding=utf8'}${
      '&all={0}&pn={1}&rn=20'.replace('{0}', keyword).replace('{1}', curpage)}`;

    return {
      success(fn) {
        hm({
          url: target_url,
          method: 'GET',
          ransformResponse: undefined,
        }).then((response) => {
          let { data } = response;
          data = JSON.parse(fix_json(data));
          async_process_list(data.abslist, kw_render_search_result_item, [hm], (err, tracks) => fn({
            result: tracks,
            total: data.TOTAL,
          }));
        });
      },
    };
  }

  // eslint-disable-next-line no-unused-vars
  function kw_bootstrap_track(sound, track, success, failure, hm, se) {
    const song_id = track.id.slice('kwtrack_'.length);
    const target_url = `${'http://antiserver.kuwo.cn/anti.s?'
      + 'type=convert_url&format=aac|mp3|wma&response=url&rid=MUSIC_'}${song_id}`;

    hm({
      url: target_url,
      method: 'GET',
      transformResponse: undefined,
    }).then((response) => {
      const { data } = response;
      if (data.length > 0) {
        sound.url = data; // eslint-disable-line no-param-reassign
        success();
      } else {
        failure();
      }
    });
  }

  function kw_lyric(url, hm, se) { // eslint-disable-line no-unused-vars
    const track_id = getParameterByName('lyric_url', url);
    const target_url = `http://m.kuwo.cn/newh5/singles/songinfoandlrc?musicId=${track_id}`;

    return {
      success(fn) {
        hm({
          url: target_url,
          method: 'GET',
          transformResponse: undefined,
        }).then((response) => {
          let { data } = response;
          data = JSON.parse(data);

          const lyric = data.data.lrclist.reduce((str, item) => {
            const t = parseFloat(item.time);
            const m = parseInt(t / 60, 10);
            const s = parseInt(t - m * 60, 10);
            const ms = parseInt((t - m * 60 - s) * 100, 10);
            return `${str}[${num2str(m)}:${num2str(parseInt(s, 10))}.${num2str(ms)}]${item.lineLyric}\n`;
          }, '');
          return fn({
            lyric,
          });
        });
      },
    };
  }

  function kw_artist(url, hm, se) { // eslint-disable-line no-unused-vars
    const artist_id = getParameterByName('list_id', url).split('_').pop();
    return {
      success(fn) {
        let target_url = `${'http://search.kuwo.cn/r.s?stype=artistinfo'
          + '&artistid='}${artist_id}&encoding=utf8`;
        hm({
          url: target_url,
          method: 'GET',
          transformResponse: undefined,
        }).then((response) => {
          let { data } = response;
          data = JSON.parse(fix_json(data));
          const info = {
            cover_img_url: `http://img1.sycdn.kuwo.cn/star/starheads/${data.pic}`,
            title: html_decode(data.name),
            id: `kwartist_${data.id}`,
            source_url: `http://www.kuwo.cn/artist/content?name=${data.name}`,
          };

          // Get songs
          target_url = `${'http://search.kuwo.cn/r.s?stype=artist2music'
            + '&sortby=0&alflac=1&pcmp4=1&encoding=utf8'
            + '&artistid='}${artist_id}&pn=0&rn=100`;
          hm({
            url: target_url,
            method: 'GET',
            transformResponse: undefined,
          }).then((res) => {
            let { data: res_data } = res;
            res_data = JSON.parse(fix_json(res_data));
            async_process_list(res_data.musiclist, kw_render_artist_result_item, [hm],
              (err, tracks) => fn({
                tracks,
                info,
              }));
          });
        });
      },
    };
  }

  function kw_album(url, hm, se) { // eslint-disable-line no-unused-vars
    const album_id = getParameterByName('list_id', url).split('_').pop();
    return {
      success(fn) {
        const target_url = `${'http://search.kuwo.cn/r.s?pn=0&rn=1000&stype=albuminfo'
          + '&albumid='}${album_id
        }&alflac=1&pcmp4=1&encoding=utf8&vipver=MUSIC_8.7.7.0_W4`;
        hm({
          url: target_url,
          method: 'GET',
          transformResponse: undefined,
        }).then((response) => {
          let { data } = response;
          data = JSON.parse(fix_json(data));

          const info = {
            cover_img_url: `http://img1.sycdn.kuwo.cn/star/albumcover/${data.pic}`,
            title: html_decode(data.name),
            id: data.albumid,
            source_url: `http://www.kuwo.cn/album/${data.albumid}`,
          };

          // Get songs
          async_process_list(data.musiclist, kw_render_album_result_item, [hm, info],
            (err, tracks) => fn({
              tracks,
              info,
            }));
        });
      },
    };
  }

  function kw_show_playlist(url, hm) {
    let offset = getParameterByName('offset', url);
    if (!offset) {
      offset = 0;
    }
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
    const target_url = `${'http://www.kuwo.cn/www/categoryNew/getPlayListInfoUnderCategory?'
      + 'type=taglist&digest=10000&id='}${37}&start=${offset}&count=50`;

    return {
      success(fn) {
        hm.get(target_url).then((response) => {
          const { data } = response.data;
          if (!data[0]) {
            return fn([]);
          }
          const result = data[0].data.map(item => ({
            cover_img_url: item.img,
            title: item.name,
            id: `kwplaylist_${item.id}`,
            source_url: `http://www.kuwo.cn/playlist/index?pid=${item.id}`,
          }));
          return fn({
            result,
          });
        });
      },
    };
  }

  function kw_get_playlist(url, hm, se) { // eslint-disable-line no-unused-vars
    const list_id = getParameterByName('list_id', url).split('_').pop();
    const target_url = `${'http://nplserver.kuwo.cn/pl.svc?'
      + 'op=getlistinfo&pn=0&rn=200&encode=utf-8&keyset=pl2012&pcmp4=1'
      + '&pid='}${list_id}&vipver=MUSIC_9.0.2.0_W1&newver=1`;

    return {
      success(fn) {
        hm.get(target_url).then((response) => {
          const { data } = response;

          const info = {
            cover_img_url: data.pic,
            title: data.title,
            id: `kwplaylist_${data.id}`,
            source_url: `http://www.kuwo.cn/playlist/index?pid=${data.id}`,
          };

          async_process_list(data.musiclist, kw_render_playlist_result_item, [hm],
            (err, tracks) => fn({
              tracks,
              info,
            }));
        });
      },
    };
  }

  function kw_parse_url(url) {
    let result;
    const match = /\/\/www.kuwo.cn\/playlist\/index\?pid=([0-9]+)/.exec(url);
    if (match != null) {
      const playlist_id = match[1];
      result = {
        type: 'playlist',
        id: `kwplaylist_${playlist_id}`,
      };
    }
    return result;
  }

  function get_playlist(url, hm, se) {
    const list_id = getParameterByName('list_id', url).split('_')[0];
    switch (list_id) {
      case 'kwplaylist':
        return kw_get_playlist(url, hm, se);
      case 'kwalbum':
        return kw_album(url, hm, se);
      case 'kwartist':
        return kw_artist(url, hm, se);
      default:
        return null;
    }
  }

  return {
    show_playlist: kw_show_playlist,
    get_playlist,
    parse_url: kw_parse_url,
    bootstrap_track: kw_bootstrap_track,
    search: kw_search,
    lyric: kw_lyric,
  };
}

const kuwo = build_kuwo(); // eslint-disable-line no-unused-vars
