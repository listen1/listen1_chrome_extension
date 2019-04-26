/* global chrome */
/* global MD5 getParameterByName parseInt */
/* eslint-disable no-param-reassign */
function build_xiami() {
  function caesar(location) {
    const num = location[0];
    const avg_len = Math.floor(location.slice(1).length / num);
    const remainder = location.slice(1).length % num;

    const result = [];
    for (let i = 0; i < remainder; i += 1) {
      const line = location.slice(i * (avg_len + 1) + 1, (i + 1) * (avg_len + 1) + 1);
      result.push(line);
    }

    for (let i = 0; i < num - remainder; i += 1) {
      const line = location.slice((avg_len + 1) * remainder)
        .slice(i * avg_len + 1, (i + 1) * avg_len + 1);
      result.push(line);
    }

    const s = [];
    for (let i = 0; i < avg_len; i += 1) {
      for (let j = 0; j < num; j += 1) {
        s.push(result[j][i]);
      }
    }

    for (let i = 0; i < remainder; i += 1) {
      s.push(result[i].slice(-1));
    }

    return unescape(s.join('')).replace(/\^/g, '0');
  }

  function handleProtocolRelativeUrl(url) {
    const regex = /^.*?\/\//;
    const result = url.replace(regex, 'http://');
    return result;
  }

  function xm_retina_url(s) {
    if (s.slice(-6, -4) === '_1') {
      return s.slice(0, -6) + s.slice(-4);
    }
    return s;
  }

  function xm_get_token(callback) {
    const domain = 'https://www.xiami.com';
    const name = 'xm_sg_tk';
    let cookieProvider = null;
    if (typeof chrome !== 'undefined') {
      cookieProvider = chrome;
      cookieProvider.cookies.get({
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
      cookieProvider = remote.session.defaultSession;
      cookieProvider.cookies.get({
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
            default_playlist.source_url = `http://www.xiami.com/collect/${list_id}`;
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
    const target_url = `http://emumo.xiami.com/song/playlist/id/${track.id.slice('xmtrack_'.length)
    }/object_name/default/object_id/0/cat/json`;
    hm.get(target_url).then((response) => {
      const { data } = response;
      if (data.data.trackList == null) {
        failure();
        return;
      }
      const { location } = data.data.trackList[0];
      // eslint-disable-next-line
      sound.url = handleProtocolRelativeUrl(caesar(location));
      track.img_url = xm_retina_url(handleProtocolRelativeUrl(data.data.trackList[0].pic));
      track.album = data.data.trackList[0].album_name;
      track.album_id = `xmalbum_${data.data.trackList[0].album_id}`;
      track.lyric_url = handleProtocolRelativeUrl(data.data.trackList[0].lyric_url);
      success();
    });
  }

  function xm_convert_song(song_info, artist_field_name) {
    const track = {
      id: `xmtrack_${song_info.song_id}`,
      title: song_info.song_name,
      artist: song_info[artist_field_name],
      artist_id: `xmartist_${song_info.artist_id}`,
      album: song_info.album_name,
      album_id: `xmalbum_${song_info.album_id}`,
      source: 'xiami',
      source_url: `http://www.xiami.com/song/${song_info.song_id}`,
      img_url: song_info.album_logo,
      url: `xmtrack_${song_info.song_id}`,
      lyric_url: song_info.lyric_file,
    };
    return track;
  }

  function xm_convert_song2(song_info, artist_field_name) { // eslint-disable-line no-unused-vars
    const track = {
      id: `xmtrack_${song_info.songId}`,
      title: song_info.songName,
      artist: song_info.artistName,
      artist_id: `xmartist_${song_info.artistId}`,
      album: song_info.albumName,
      album_id: `xmalbum_${song_info.albumId}`,
      source: 'xiami',
      source_url: `http://www.xiami.com/song/${song_info.songId}`,
      img_url: song_info.albumLogo,
      url: `xmtrack_${song_info.songId}`,
      // 'lyric_url': song_info.lyricInfo.lyricFile
    };
    if (song_info.lyricInfo) {
      track.lyric_url = song_info.lyricInfo.lyricFile;
    }
    return track;
  }

  function xm_get_playlist(url, hm, se) { // eslint-disable-line no-unused-vars
    const list_id = getParameterByName('list_id', url).split('_').pop();

    return {
      success(fn) {
        const api = '/api/collect/initialize';
        const params = {
          listId: parseInt(list_id, 10),
        };
        xm_cookie_get(hm, api, params, (response) => {
          const collect = response.data.result.data.collectDetail;
          const info = {
            cover_img_url: xm_get_low_quality_img_url(collect.collectLogo),
            title: collect.collectName,
            id: `xmplaylist_${list_id}`,
            source_url: `http://www.xiami.com/collect/${list_id}`,
          };
          const tracks = response.data.result.data.collectSongs.map(item => xm_convert_song2(item, 'artist_name'));
          return fn({
            tracks,
            info,
          });
        });
      },
    };
  }

  function xm_search(url, hm, se) { // eslint-disable-line no-unused-vars
    return {
      success(fn) {
        const api = '/api/search/searchSongs';
        const keyword = getParameterByName('keywords', url);
        const curpage = getParameterByName('curpage', url);
        const pageSize = 60;
        const params = {
          pagingVO: {
            page: curpage,
            pageSize,
          },
          key: keyword,
        };
        xm_cookie_get(hm, api, params, (response) => {
          const tracks = response.data.result.data.songs.map(item => xm_convert_song2(item, 'artistName'));
          return fn({
            result: tracks,
            total: response.data.result.data.pagingVO.pages,
          });
        });
      },
    };
  }

  function xm_album(url, hm, se) { // eslint-disable-line no-unused-vars
    return {
      success(fn) {
        const album_id = getParameterByName('list_id', url).split('_').pop();
        const target_url = `http://api.xiami.com/web?v=2.0&app_key=1&id=${album_id
        }&page=1&limit=20&callback=jsonp217&r=album/detail`;
        hm({
          url: target_url,
          method: 'GET',
          transformResponse: undefined,
        })
          .then((response) => {
            let { data } = response;
            data = data.slice('jsonp217('.length, -')'.length);
            data = JSON.parse(data);

            const info = {
              cover_img_url: data.data.album_logo,
              title: data.data.album_name,
              id: `xmalbum_${data.data.album_id}`,
              source_url: `http://www.xiami.com/album/${data.data.album_id}`,
            };

            const tracks = data.data.songs.map(item => xm_convert_song(item, 'singers'));
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

        let target_url = `http://api.xiami.com/web?v=2.0&app_key=1&id=${artist_id
        }&page=1&limit=20&_ksTS=1459931285956_216`
          + '&callback=jsonp217&r=artist/detail';

        hm({
          url: target_url,
          method: 'GET',
          transformResponse: undefined,
        })
          .then((response) => {
            let { data } = response;
            data = data.slice('jsonp217('.length, -')'.length);
            data = JSON.parse(data);

            const info = {
              cover_img_url: xm_retina_url(data.data.logo),
              title: data.data.artist_name,
              id: `xmartist_${artist_id}`,
              source_url: `http://www.xiami.com/artist/${artist_id}`,
            };

            target_url = `http://api.xiami.com/web?v=2.0&app_key=1&id=${artist_id
            }&page=1&limit=20&callback=jsonp217&r=artist/hot-songs`;
            hm({
              url: target_url,
              method: 'GET',
              transformResponse: undefined,
            })
              .then((res) => {
                let { data: res_data } = res;
                res_data = res_data.slice('jsonp217('.length, -')'.length);
                res_data = JSON.parse(res_data);

                const tracks = res_data.data.map((item) => {
                  const track = xm_convert_song(item, 'singers');
                  track.artist_id = `xmartist_${artist_id}`;
                  return track;
                });
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
    // const track_id = getParameterByName('track_id', url).split('_').pop();
    const lyric_url = getParameterByName('lyric_url', url);
    return {
      success(fn) {
        hm({
          url: lyric_url,
          method: 'GET',
          transformResponse: undefined,
        }).then((response) => {
          const { data } = response;
          return fn({
            lyric: data,
          });
        });
      },
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
