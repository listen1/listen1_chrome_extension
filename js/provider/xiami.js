/* global chrome */
/* global MD5 getParameterByName parseInt */
/* eslint-disable no-param-reassign */
function build_xiami() {
  function xm_get_token(callback) {
    const domain = 'https://www.xiami.com';
    const name = 'xm_sg_tk';
    if (!isElectron()) {
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
      //url: `xmtrack_${song_info.song_id}`,
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
      //url: `xmtrack_${song_info.songId}`,
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
    const keyword = getParameterByName('keywords', url);
    const curpage = getParameterByName('curpage', url);
    const searchType = getParameterByName('type', url);
    if(searchType === '1') {
      return {
        success(fn) {
          return fn({
            result: [],
            total: 0,
            type: searchType
          });
        }
      };
    }
    return {
      success(fn) {

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
            type: searchType
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

    function tag2millisecond(time_tag) {
    var reg_time_tag_grouped = /\[(\d{2,}):(\d{2})(?:\.(\d{1,3}))?\]/g;
    var r = reg_time_tag_grouped.exec(time_tag);
    var minute = parseInt(r[1]);
    var second = parseInt(r[2]);
    var millisecond = 0;
    if (r.length >= 4) {
      millisecond = parseInt(r[3]);
    }
    var result = minute * 60000 + second * 1000 + millisecond;
    return result;
  }

  function zpad(n, width, z) {
    z = z || "0";
    n = n + "";
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  }

  function millisecond2tag(v) {
    var t = Math.abs(v / 1000);
    var h = Math.floor(t / 3600);
    t = t - h * 3600;
    var m = Math.floor(t / 60);
    t = t - m * 60;
    var s = Math.floor(t);
    var ms = t - s;
    var str =
      (h ? zpad(h, 2) + ":" : "") +
      zpad(m, 2) +
      ":" +
      zpad(s, 2) +
      "." +
      zpad(Math.floor(ms * 1000), 3);
    return "[" + str + "]";
  }

  function xm_generate_translation(plain) {
    var reg_xtrans_tag = /\[x-trans\]/;
    var reg_durning_tag = /<\d+>/g;

    var has_translate = plain.search(reg_xtrans_tag) !== -1;
    var has_perword_timestamp = reg_durning_tag.test(plain);
    if (!has_translate && !has_perword_timestamp) {
      return {
        lrc: plain,
        tlrc: "",
      };
    }

    // 处理xtrans标记，替换为上一行的时间轴标记，并加入tlrc结果中
    var lrc = "";
    var tlrc = "";
    var plain_array = plain.split("\n");
    var i = 0;
    var last_time_tag = "[00:00.000]";
    var last_end_timestamp = 0;
    var MAX_ALLOW_GAP_MILLISECOND = 1000;

    while (i < plain_array.length) {
      var line = plain_array[i];
      var reg_time_tag = /(\[\d{2,}:\d{2}(?:\.\d{1,3})?\])/g;
      var time_tag_info = line.match(reg_time_tag);
      if (time_tag_info) {
        // 之前结束是否过早，是否需要添加空白行
        var current_time_tag = time_tag_info[0];
        var current_millisecond = tag2millisecond(current_time_tag);
        if (
          current_millisecond - last_end_timestamp >=
          MAX_ALLOW_GAP_MILLISECOND
        ) {
          var placeholder_time_tag = millisecond2tag(last_end_timestamp);
          lrc += placeholder_time_tag + "\n";
          if (i - 1 >= 0 && plain_array[i - 1].match(reg_xtrans_tag)) {
            // 上一行是翻译行
            tlrc += placeholder_time_tag + "\n";
          }
        }
        // 添加本行时间轴
        lrc += line.replace(reg_durning_tag, "") + "\n";
        last_time_tag = current_time_tag;
        // 计算本行结束时间轴
        var durning = 0;
        line.match(reg_durning_tag) && line.match(reg_durning_tag).forEach((s) => {
          durning += parseInt(s.replace(/[^\d]/g, ""));
        });
        last_end_timestamp = tag2millisecond(last_time_tag) + durning;
      }
      var xtrans_tag = line.match(reg_xtrans_tag);
      if (xtrans_tag) {
        tlrc +=
          line
            .replace(reg_xtrans_tag, last_time_tag)
            .replace(reg_durning_tag, "") + "\n";
      }
      i += 1;
    }
    return {
      lrc: lrc,
      tlrc: tlrc,
    };
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
