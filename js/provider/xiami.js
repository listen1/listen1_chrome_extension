/* global chrome */
/* global MD5 getParameterByName parseInt */
/* eslint-disable no-param-reassign */
function build_xiami() {
  function xm_get_token(callback) {
    const domain = 'https://www.xiami.com';
    const name = 'xm_sg_tk';
    if (typeof chrome !== 'undefined') {
      cookieGet({
        url: domain,
        name,
      }, (cookie) => {
        if (cookie == null) {
          return callback('');
        }
        return callback(cookie.value);
      });
    } else {
      const remote = require('electron').remote; // eslint-disable-line
      cookieGet({
        domain: '.xiami.com',
        name,
      }, (err, cookie) => {
        if (cookie.length === 0) {
          return callback('');
        }
        return callback(cookie[0].value);
      });
    }
  }

  function xm_get_api_url(api, params, token) {
    const params_string = JSON.stringify(params);
    const origin = `${token.split('_')[0]}_xmMain_${api}_${params_string}`;
    const sign = MD5(origin);
    const baseUrl = 'https://www.xiami.com';
    return encodeURI(`${baseUrl + api}?_q=${params_string}&_s=${sign}`);
  }

  function xm_cookie_get(hm, api, params, callback) {
    xm_get_token((token) => {
      const url = xm_get_api_url(api, params, token);
      hm.get(url).then((response) => {
        if (response.data.code === 'SG_TOKEN_EMPTY' || response.data.code === 'SG_TOKEN_EXPIRED' || response.data.code === 'SG_INVALID') {
          // token expire, refetch token and start get url
          xm_get_token((token2) => {
            const url2 = xm_get_api_url(api, params, token2);
            hm.get(url2).then((res) => {
              callback(res);
            });
          });
        } else {
          callback(response);
        }
      });
    });
  }

  function xm_get_low_quality_img_url(url) {
    return `${url}?x-oss-process=image/resize,m_fill,limit_0,s_330/quality,q_80`;
  }

  function xm_show_playlist(url, hm) {
    const offset = getParameterByName('offset', url);
    const page = offset / 30 + 1;
    const pageSize = 60;

    return {
      success(fn) {
        const api = '/api/list/collect';
        const params = {
          pagingVO: {
            page,
            pageSize,
          },
          dataType: 'system',
        };
        xm_cookie_get(hm, api, params, (response) => {
          const result = response.data.result.data.collects.map((d) => {
            const default_playlist = {
              cover_img_url: '',
              title: '',
              id: '',
              source_url: '',
            };
            default_playlist.cover_img_url = xm_get_low_quality_img_url(d.collectLogo);
            default_playlist.title = d.collectName;
            const list_id = d.listId;
            default_playlist.id = `xmplaylist_${list_id}`;
            default_playlist.source_url = `https://www.xiami.com/collect/${list_id}`;
            return default_playlist;
          });
          return fn({
            result,
          });
        });
      },
    };
  }

  // eslint-disable-next-line no-unused-vars
  function xm_bootstrap_track(sound, track, success, failure, hm, se) {
    if (!track.sound_url) {
      const api = '/api/song/getPlayInfo';
      const song_id = track.id.slice('xmtrack_'.length);
      const params = {
        "songIds":[song_id]
      };
      xm_cookie_get(hm, api, params, (response) => {
        const { playInfos: data } = response.data.result.data.songPlayInfos[0];
        if (data[0].listenFile || data[1].listenFile) {
          sound.url = data[0].listenFile || data[1].listenFile;
          success();
        } else {
          failure();
        }
      });
    } else {
      sound.url = track.sound_url;
      success();
    }
  }

  function xm_convert_song(song_info) {
    const track = {
      id: `xmtrack_${song_info.song_id}`,
      title: song_info.song_name,
      artist: song_info.artist_name,
      artist_id: `xmartist_${song_info.artist_id}`,
      album: song_info.album_name,
      album_id: `xmalbum_${song_info.album_id}`,
      source: 'xiami',
      source_url: `https://www.xiami.com/song/${song_info.song_id}`,
      img_url: song_info.album_logo,
      url: `xmtrack_${song_info.song_id}`,
      lyric_url: song_info.lyric,
      disabled: song_info.listen_file,
    };
    return track;
  }

  function xm_convert_song2(song_info) { // eslint-disable-line no-unused-vars
    const track = {
      id: `xmtrack_${song_info.songId}`,
      title: song_info.songName,
      artist: song_info.artistName,
      artist_id: `xmartist_${song_info.artistId}`,
      album: song_info.albumName,
      album_id: `xmalbum_${song_info.albumId}`,
      source: 'xiami',
      source_url: `https://www.xiami.com/song/${song_info.songId}`,
      img_url: song_info.albumLogo,
      url: `xmtrack_${song_info.songId}`,
      lyric_url: song_info.lyricInfo ? song_info.lyricInfo.lyricFile : '',
    };
    if (song_info.listenFiles && song_info.listenFiles.length > 0) {
      track.sound_url = get_highest_quality(song_info.listenFiles);
    } else {
      track.sound_url = '';
    }
    return track;
  }

  function get_highest_quality(arr) {
    var max = 0;
    var url = "";
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].fileSize > max) {
        max = arr[i].fileSize;
        url = arr[i].listenFile;
      }
    }
    return url;
  }

  function xm_get_playlist(url, hm, se) { // eslint-disable-line no-unused-vars
    const list_id = getParameterByName('list_id', url).split('_').pop();
    return {
      success(fn) {
        const api = '/api/collect/getCollectStaticUrl';
        const params = {
          listId: parseInt(list_id, 10),
        };
        xm_cookie_get(hm, api, params, (response) => {
          const collect_url = response.data.result.data.data.data.url;
          hm.get(collect_url).then((response) => {
            let { data } = response;
            const info = {
              cover_img_url: xm_get_low_quality_img_url(data.resultObj.collectLogo),
              title: data.resultObj.collectName,
              id: `xmplaylist_${list_id}`,
              source_url: `https://www.xiami.com/collect/${list_id}`,
            };
            const tracks = data.resultObj.songs.map(item => xm_convert_song2(item));
            return fn({
              tracks,
              info,
            });
          });
        });
      },
    };
  }

  function xm_search(url, hm, se) { // eslint-disable-line no-unused-vars
    return {
      success(fn) {
        const keyword = getParameterByName('keywords', url);
        const curpage = getParameterByName('curpage', url);
        const target_url = 'https://api.xiami.com/web?';
        const  data = {
          key: `${keyword}`,
          v: '2.0',
          app_key: 1,
          r: 'search/songs',
          page: `${curpage}`,
          limit: 60
        };
        hm({
          url: target_url,
          method: 'GET',
          params: data,
        }).then((response) => {
          const tracks = response.data.data.songs.map(item => xm_convert_song(item));
          return fn({
            result: tracks,
            total: response.data.data.total,
          });
        });
      },
    };
  }

  function xm_album(url, hm, se) { // eslint-disable-line no-unused-vars
    return {
      success(fn) {
        const album_id = getParameterByName('list_id', url).split('_').pop();
        const api = '/api/album/initialize';
        const params = {
          "albumId":album_id
        };
        xm_cookie_get(hm, api, params, (response) => {
          const { data } = response.data.result;
          const info = {
            cover_img_url: data.albumDetail.albumLogo,
            title: data.albumDetail.albumName,
            id: `xmalbum_${album_id}`,
            source_url: `https://www.xiami.com/album/${album_id}`,
          };
          const tracks = data.albumDetail.songs.map(item => xm_convert_song2(item));
          return fn({
            tracks,
            info,
          });
        });
      },
    };
  }

  function xm_artist(url, hm, se) { // eslint-disable-line no-unused-vars
    return {
      success(fn) {
        const artist_id = getParameterByName('list_id', url).split('_').pop();

        const target_url = `https://m.xiami.com/graphql?query=query{artistDetail(artistId:%22${artist_id
        }%22,artistStringId:%22${artist_id}%22){artistDetailVO{artistName%20artistLogo}}}`;

        hm.get(target_url).then((response) => {
          const { artistDetailVO: data } = response.data.data.artistDetail;
          const info = {
            cover_img_url: data.artistLogo,
            title: data.artistName,
            id: `xmartist_${artist_id}`,
            source_url: `https://www.xiami.com/artist/${artist_id}`,
          };

          const offset = getParameterByName('offset', url);
          const page = offset / 50 + 1;
          const pageSize = 50; 
          const category = 0;
          const api = '/api/song/getArtistSongs';
          const params = {
            artistId: artist_id,
            category,
            pagingVO: {
              page,
              pageSize
            }
          };
          xm_cookie_get(hm, api, params, (response) => {
            const tracks = response.data.result.data.songs.map(item => xm_convert_song2(item));
            return fn({
              tracks,
              info,
            });
          });
        });
      },
    };
  }

  function xm_lyric(url, hm, se) { // eslint-disable-line no-unused-vars
    const lyric_url = getParameterByName('lyric_url', url);
    return {
      success(fn) {
        if (lyric_url) {
          hm.get(lyric_url).then((response) => {
            const data = xm_generate_translation(response.data);
            return fn({
              lyric: data.lrc,
              tlyric: data.tlrc
            });
          });
        } else {
          return fn({
            lyric: '',
            tlyric: ''
          });
        }
      },
    };
  }

  function xm_generate_translation(plain) {
    var lrc = '';
    var tlrc = '';
    const reg_ms = /<\d+>/g;
    if (plain.search(/\[x-trans]/) !== -1 || reg_ms.test(plain)) { // 如有翻译或者动感歌词，进行处理
      const reg_timetamp = /\[(\d{2,}):(\d{2})(?:\.(\d{1,3}))?]/g;
      var arr_plain = plain.split('\n');
      var arr_lyric = arr_plain.slice(0);
      var arr_timetamp = reg_timetamp.exec(plain);
      var timetamp_length = arr_timetamp[0].length;  //求时间戳字符串长度
      if (arr_lyric[arr_lyric.length - 1] !='') { // 统一歌词格式，方便后续处理
        arr_lyric.push('');
      }
      if (reg_ms.test(plain)) {
        for (var i = 0, j = 0; i < arr_plain.length; i++) {
          if (arr_plain[i].search(/<\d+>/) !== -1) {
            var invl = 0;
            var timetamp = '';
            var plain_line = arr_plain[i];
            var indx_next = arr_plain.slice(i + 1).findIndex((nextline) => nextline.search(/<\d+>/) !== -1); //求有动态歌词的下一行下标
            arr_ms = plain_line.match(reg_ms);
            // 动态歌词时间间隔求和，得出总间隔
            for (var k = 0, ms = 0; k < arr_ms.length; k++){
              ms = parseInt(arr_ms[k].replace(/[^\d]/g,''));
              invl += ms;
            }
            // 总间隔与下一行时间差值大于1000ms，则加上时间戳
            if (Math.abs(to_millisecond(arr_plain[i].substr(1, timetamp_length - 2)) + invl - to_millisecond(arr_plain[i + 1 + indx_next].substr(1, timetamp_length - 2))) > 1000) {
              timetamp = '[' + format_time(to_millisecond(arr_plain[i].substr(1, timetamp_length - 2)) + invl) + ']';
              if (plain.search(/\[x-trans]/) == -1 && indx_next > -1) {
                arr_lyric.splice(i + 1 + indx_next + j,0,timetamp);
                j++;
              } else if (plain.search(/\[x-trans]/) !== -1) {
                arr_lyric.splice(i + 1 + Math.abs(indx_next) + j,0,timetamp);
                j++;
              } else {
                arr_lyric.splice(i + 1 + j,0,timetamp);
                j++;
              }
            }
          }
        }
        lrc = (arr_lyric.join('\n')).replace(reg_ms,''); //去除类似<200>的动态歌词时间间隔表示
      } else {
        lrc = plain;
      }
      if (plain.search(/\[x-trans]/) !== -1) {  // 翻译歌词加上时间戳
        var arr_tlyric = [];
        for (var i = 0; i < arr_lyric.length; i++) {
          arr_lyric[i] = arr_lyric[i].replace(/\r/,'');
          if (arr_lyric[i].search(/\[x-trans]/) !== -1) {
            var translation_line = arr_lyric[i].replace(/\[x-trans]/,'').trim();
            if (translation_line != arr_lyric[i - 1].trim().substring(timetamp_length).replace(reg_ms,'').trim()) {
              arr_tlyric = arr_tlyric.concat(arr_lyric[i - 1].substr(0, timetamp_length) + translation_line);
            } else {
              arr_tlyric = arr_tlyric.concat(arr_lyric[i - 1].substr(0, timetamp_length));
            }
          } else {
            if (arr_lyric[i].match(reg_timetamp) && arr_lyric[i].trim().substring(timetamp_length).trim() == '') {
              arr_tlyric = arr_tlyric.concat(arr_lyric[i]);
            }
          }
        }
        tlrc = arr_tlyric.join('\n');
      }
      return {
        lrc,
        tlrc
      };
    } else {
      lrc = plain;
      return {
        lrc,
        tlrc
      };
    }
  }

  function to_millisecond(timeString) {
    return parseInt(timeString.slice(0, 2), 10) * 60000 + parseInt(timeString.substr(3, 2), 10) * 1000 + parseInt(timeString.substr(6, 3), 10);
  }

  function zpad(n) {
    var s = n.toString();
    if (s.length < 2) {
      return '0' + s;
    } else if (s.length > 2) {
      return s.substr(0, 2);
    } else {
      return s;
    }
  }

  function zpad_ms(n) {
    var s = n.toString();
    switch(s.length) {
      case 1:
        return '00'+s;
      case 2:
        return '0'+s;
      default:
        return s;
    }
  }

  function format_time(time) {
    var t = Math.abs(time / 1000);
    var h = Math.floor(t / 3600);
    t = t - h * 3600;
    var m = Math.floor(t / 60);
    t = t - m * 60;
    var s = Math.floor(t);
    var ms = t - s;
    var str = (h ? zpad(h) + ':' : '') + zpad(m) + ':' + zpad(s) + '.' + zpad_ms(Math.floor(ms * 1000));
    return str;
  }

  function xm_parse_url(url) {
    let result;
    const match = /\/\/www.xiami.com\/collect\/([0-9]+)/.exec(url);
    if (match != null) {
      const playlist_id = match[1];
      result = {
        type: 'playlist',
        id: `xmplaylist_${playlist_id}`,
      };
    }
    return result;
  }

  function get_playlist(url, hm, se) {
    const list_id = getParameterByName('list_id', url).split('_')[0];
    switch (list_id) {
      case 'xmplaylist':
        return xm_get_playlist(url, hm, se);
      case 'xmalbum':
        return xm_album(url, hm, se);
      case 'xmartist':
        return xm_artist(url, hm, se);
      default:
        return null;
    }
  }
  return {
    show_playlist: xm_show_playlist,
    get_playlist,
    parse_url: xm_parse_url,
    bootstrap_track: xm_bootstrap_track,
    search: xm_search,
    lyric: xm_lyric,
  };
}

const xiami = build_xiami(); // eslint-disable-line no-unused-vars
