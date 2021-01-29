/* eslint-disable no-unused-vars */
/* global getParameterByName forge */
/* global isElectron cookieSet cookieGet async */
function build_netease() {
  function ne_show_playlist(url) {
    const order = 'hot';
    const offset = getParameterByName('offset', url);

    let target_url = '';
    if (offset != null) {
      target_url = `http://music.163.com/discover/playlist/?order=${order}&limit=35&offset=${offset}`;
    } else {
      target_url = `http://music.163.com/discover/playlist/?order=${order}`;
    }

    return {
      success(fn) {
        axios.get(target_url).then((response) => {
          const { data } = response;
          const list_elements = Array.from((new DOMParser()).parseFromString(data, 'text/html').getElementsByClassName('m-cvrlst')[0].children);
          const result = list_elements.map((item) => ({
            cover_img_url: item.getElementsByTagName('img')[0].src,
            title: item.getElementsByTagName('div')[0].getElementsByTagName('a')[0].title,
            id: `neplaylist_${getParameterByName('id', item.getElementsByTagName('div')[0].getElementsByTagName('a')[0].href)}`,
            source_url: `http://music.163.com/#/playlist?id=${getParameterByName('id', item.getElementsByTagName('div')[0].getElementsByTagName('a')[0].href)}`,
          }));
          return fn({
            result,
          });
        });
      },
    };
  }

  function _create_secret_key(size) { // eslint-disable-line no-underscore-dangle
    const result = [];
    const choice = '012345679abcdef'.split('');
    for (let i = 0; i < size; i += 1) {
      const index = Math.floor(Math.random() * choice.length);
      result.push(choice[index]);
    }
    return result.join('');
  }

  function _aes_encrypt(text, sec_key) { // eslint-disable-line no-underscore-dangle
    const cipher = forge.cipher.createCipher('AES-CBC', sec_key);
    cipher.start({ iv: '0102030405060708' });
    cipher.update(forge.util.createBuffer(text));
    cipher.finish();

    return btoa(cipher.output.data);
  }

  function _rsa_encrypt(text, pubKey, modulus) { // eslint-disable-line no-underscore-dangle
    text = text.split('').reverse().join(''); // eslint-disable-line no-param-reassign

    const n = new forge.jsbn.BigInteger(modulus, 16);
    const e = new forge.jsbn.BigInteger(pubKey, 16);
    const b = new forge.jsbn.BigInteger(forge.util.bytesToHex(text), 16);
    const enc = b.modPow(e, n).toString(16);
    return enc;
  }

  function _encrypted_request(text) { // eslint-disable-line no-underscore-dangle
    const modulus = '00e0b509f6259df8642dbc35662901477df22677ec152b5ff68ace615bb7b72'
      + '5152b3ab17a876aea8a5aa76d2e417629ec4ee341f56135fccf695280104e0312ecbd'
      + 'a92557c93870114af6c9d05c4f7f0c3685b7a46bee255932575cce10b424d813cfe48'
      + '75d3e82047b97ddef52741d546b8e289dc6935b3ece0462db0a22b8e7';
    const nonce = '0CoJUm6Qyw8W8jud';
    const pubKey = '010001';
    text = JSON.stringify(text); // eslint-disable-line no-param-reassign
    const sec_key = _create_secret_key(16);
    const enc_text = _aes_encrypt(_aes_encrypt(text, nonce), sec_key);
    const enc_sec_key = _rsa_encrypt(sec_key, pubKey, modulus);
    const data = {
      params: enc_text,
      encSecKey: enc_sec_key,
    };

    return data;
  }

  function ne_ensure_cookie(callback) {
    const domain = 'https://music.163.com';
    const nuidName = '_ntes_nuid';
    const nnidName = '_ntes_nnid';
    let env = null;
    if (!isElectron()) {
      env = 'chrome';
    } else {
      const remote = require('electron').remote; // eslint-disable-line
      env = 'electron';
    }
    cookieGet({
      url: domain,
      name: nuidName,
    }, (arg1, arg2) => {
      if (((env === 'chrome') && (arg1 == null)) || ((env === 'electron' && arg2.length === 0))) {
        const nuidValue = _create_secret_key(32);
        const nnidValue = `${nuidValue},${(new Date()).getTime()}`;
        // netease default cookie expire time: 100 years
        const expire = ((new Date()).getTime() + 1e3 * 60 * 60 * 24 * 365 * 100) / 1000;

        cookieSet({
          url: domain,
          name: nuidName,
          value: nuidValue,
          expirationDate: expire,
        }, (cookie) => { // eslint-disable-line no-unused-vars
          cookieSet({
            url: domain,
            name: nnidName,
            value: nnidValue,
            expirationDate: expire,
          }, (cookie2) => { // eslint-disable-line no-unused-vars
            callback(null);
          });
        });
      } else {
        callback(null);
      }
    });
  }

  function async_process_list(data_list, handler, handler_extra_param_list, callback) {
    const fnDict = {};
    data_list.forEach((item, index) => {
      fnDict[index] = (cb) => handler(index, item, handler_extra_param_list, cb);
    });
    async.parallel(fnDict,
      (err, results) => callback(null, data_list.map((item, index) => results[index])));
  }

  function ng_render_playlist_result_item(index, item, callback) {
    const target_url = 'https://music.163.com/weapi/v3/song/detail';
    const queryIds = [item.id];
    const d = {
      c: `[${queryIds.map((id) => (`{"id":${id}}`)).join(',')}]`,
      ids: `[${queryIds.join(',')}]`,
    };
    const data = _encrypted_request(d);
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
        source_url: `http://music.163.com/#/song?id=${track_json.id}`,
        img_url: track_json.al.picUrl,
        // url: `netrack_${track_json.id}`,
      };
      return callback(null, track);
    });
  }

  function ng_parse_playlist_tracks(playlist_tracks, callback) {
    const target_url = 'https://music.163.com/weapi/v3/song/detail';
    const track_ids = playlist_tracks.map((i) => i.id);
    const d = {
      c: `[${track_ids.map((id) => (`{"id":${id}}`)).join(',')}]`,
      ids: `[${track_ids.join(',')}]`,
    };
    const data = _encrypted_request(d);
    axios.post(target_url, new URLSearchParams(data)).then((response) => {
      const tracks = response.data.songs.map((track_json) => ({
        id: `netrack_${track_json.id}`,
        title: track_json.name,
        artist: track_json.ar[0].name,
        artist_id: `neartist_${track_json.ar[0].id}`,
        album: track_json.al.name,
        album_id: `nealbum_${track_json.al.id}`,
        source: 'netease',
        source_url: `http://music.163.com/#/song?id=${track_json.id}`,
        img_url: track_json.al.picUrl,
        // url: `netrack_${track_json.id}`,
      }));

      return callback(null, tracks);
    });
  }
  function split_array(myarray, size) {
    const count = Math.ceil(myarray.length / size);
    const result = [];
    for (let i = 0; i < count; i += 1) {
      result.push(myarray.slice(i * size, (i + 1) * size));
    }
    return result;
  }

  function ne_get_playlist(url) {
    // special thanks for @Binaryify
    // https://github.com/Binaryify/NeteaseCloudMusicApi
    return {
      success(fn) {
        const list_id = getParameterByName('list_id', url).split('_').pop();
        const target_url = 'http://music.163.com/weapi/v3/playlist/detail';
        const d = {
          id: list_id,
          offset: 0,
          total: true,
          limit: 1000,
          n: 1000,
          csrf_token: '',
        };
        const data = _encrypted_request(d);
        ne_ensure_cookie(() => {
          axios.post(target_url, new URLSearchParams(data)).then((response) => {
            const { data: res_data } = response;
            const info = {
              id: `neplaylist_${list_id}`,
              cover_img_url: res_data.playlist.coverImgUrl,
              title: res_data.playlist.name,
              source_url: `http://music.163.com/#/playlist?id=${list_id}`,
            };
            const max_allow_size = 1000;
            const trackIdsArray = split_array(res_data.playlist.trackIds, max_allow_size);

            function ng_parse_playlist_tracks_wrapper(trackIds, callback) {
              return ng_parse_playlist_tracks(trackIds, callback);
            }

            async.concat(trackIdsArray, ng_parse_playlist_tracks_wrapper, (err, tracks) => {
              fn({ tracks, info });
            });

            // request every tracks to fetch song info
            // async_process_list(res_data.playlist.trackIds, ng_render_playlist_result_item,
            //   (err, tracks) => fn({
            //     tracks,
            //     info,
            //   }));
          });
        });
      },
    };
  }

  function ne_bootstrap_track(sound, track, success, failure) {
    const target_url = 'http://music.163.com/weapi/song/enhance/player/url/v1?csrf_token=';
    const csrf = '';
    let song_id = track.id;

    song_id = song_id.slice('netrack_'.length);

    const d = {
      ids: [song_id],
      level: 'standard',
      encodeType: 'aac',
      csrf_token: '',
    };
    const data = _encrypted_request(d);

    axios.post(target_url, new URLSearchParams(data)).then((response) => {
      const { data: res_data } = response;
      const { url } = res_data.data[0];
      if (url != null) {
        sound.url = url; // eslint-disable-line no-param-reassign
        success();
      } else {
        failure();
      }
    });
  }

  function is_playable(song) {
    return (song.fee !== 4) && (song.fee !== 1);
  }

  function ne_search(url) {
    // use chrome extension to modify referer.
    const target_url = 'http://music.163.com/api/search/pc';
    const keyword = getParameterByName('keywords', url);
    const curpage = getParameterByName('curpage', url);
    const searchType = getParameterByName('type', url);
    let ne_search_type = '1';
    if (searchType === '1') {
      ne_search_type = '1000';
    }
    const req_data = {
      s: keyword,
      offset: 20 * (curpage - 1),
      limit: 20,
      type: ne_search_type,
    };
    return {
      success(fn) {
        axios.post(target_url, new URLSearchParams(req_data)).then((response) => {
          const { data } = response;
          let result = [];
          let total = 0;
          if (searchType === '0') {
            result = data.result.songs.map((song_info) => ({
              id: `netrack_${song_info.id}`,
              title: song_info.name,
              artist: song_info.artists[0].name,
              artist_id: `neartist_${song_info.artists[0].id}`,
              album: song_info.album.name,
              album_id: `nealbum_${song_info.album.id}`,
              source: 'netease',
              source_url: `http://music.163.com/#/song?id=${song_info.id}`,
              img_url: song_info.album.picUrl,
              // url: `netrack_${song_info.id}`,
              disabled: !is_playable(song_info),
            }));
            total = data.result.songCount;
          } else if (searchType === '1') {
            result = data.result.playlists.map((info) => ({
              id: `neplaylist_${info.id}`,
              title: info.name,
              source: 'netease',
              source_url: `https://music.163.com/#/playlist?id=${info.id}`,
              img_url: info.coverImgUrl,
              url: `neplaylist_${info.id}`,
              author: info.creator.nickname,
              count: info.trackCount,
            }));
            total = data.result.playlistCount;
          }

          return fn({
            result,
            total,
            type: searchType,
          });
        }).catch(() => fn({
          result: [],
          total: 0,
          type: searchType,
        }));
      },
    };
  }

  function ne_album(url) { // eslint-disable-line no-unused-vars
    const album_id = getParameterByName('list_id', url).split('_').pop();
    // use chrome extension to modify referer.
    const target_url = `http://music.163.com/api/album/${album_id}`;

    return {
      success(fn) {
        axios.get(target_url).then((response) => {
          const { data } = response;
          const info = {
            cover_img_url: data.album.picUrl,
            title: data.album.name,
            id: `nealbum_${data.album.id}`,
            source_url: `http://music.163.com/#/album?id=${data.album.id}`,
          };

          const tracks = data.album.songs.map((song_info) => ({
            id: `netrack_${song_info.id}`,
            title: song_info.name,
            artist: song_info.artists[0].name,
            artist_id: `neartist_${song_info.artists[0].id}`,
            album: song_info.album.name,
            album_id: `nealbum_${song_info.album.id}`,
            source: 'netease',
            source_url: `http://music.163.com/#/song?id=${song_info.id}`,
            img_url: song_info.album.picUrl,
            // url: `netrack_${song_info.id}`,
            disabled: !is_playable(song_info),
          }));
          return fn({
            tracks,
            info,
          });
        });
      },
    };
  }

  function ne_artist(url) { // eslint-disable-line no-unused-vars
    const artist_id = getParameterByName('list_id', url).split('_').pop();
    // use chrome extension to modify referer.
    const target_url = `http://music.163.com/api/artist/${artist_id}`;

    return {
      success(fn) {
        axios.get(target_url).then((response) => {
          const { data } = response;
          const info = {
            cover_img_url: data.artist.picUrl,
            title: data.artist.name,
            id: `neartist_${data.artist.id}`,
            source_url: `http://music.163.com/#/artist?id=${data.artist.id}`,
          };

          const tracks = data.hotSongs.map((song_info) => ({
            id: `netrack_${song_info.id}`,
            title: song_info.name,
            artist: song_info.artists[0].name,
            artist_id: `neartist_${song_info.artists[0].id}`,
            album: song_info.album.name,
            album_id: `nealbum_${song_info.album.id}`,
            source: 'netease',
            source_url: `http://music.163.com/#/song?id=${song_info.id}`,
            img_url: song_info.album.picUrl,
            // url: `netrack_${song_info.id}`,
            disabled: !is_playable(song_info),
          }));
          return fn({
            tracks,
            info,
          });
        });
      },
    };
  }

  function ne_lyric(url) {
    const track_id = getParameterByName('track_id', url).split('_').pop();
    // use chrome extension to modify referer.
    const target_url = 'http://music.163.com/weapi/song/lyric?csrf_token=';
    const csrf = '';
    const d = {
      id: track_id,
      lv: -1,
      tv: -1,
      csrf_token: csrf,
    };
    const data = _encrypted_request(d);
    return {
      success(fn) {
        axios.post(target_url, new URLSearchParams(data)).then((response) => {
          const { data: res_data } = response;
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
          return fn({
            lyric: lrc,
            tlyric: tlrc,
          });
        });
      },
    };
  }

  function ne_parse_url(url) {
    let result;
    let id = '';
    url = url.replace('music.163.com/#/discover/toplist?', 'music.163.com/#/playlist?'); // eslint-disable-line no-param-reassign
    url = url.replace('music.163.com/#/my/m/music/', 'music.163.com/'); // eslint-disable-line no-param-reassign
    url = url.replace('music.163.com/#/m/', 'music.163.com/'); // eslint-disable-line no-param-reassign
    url = url.replace('music.163.com/#/', 'music.163.com/'); // eslint-disable-line no-param-reassign
    if (url.search('//music.163.com/playlist') !== -1) {
      const match = /\/\/music.163.com\/playlist\/([0-9]+)/.exec(url);
      id = match ? match[1] : getParameterByName('id', url);
      result = {
        type: 'playlist',
        id: `neplaylist_${id}`,
      };
    } else if (url.search('//music.163.com/artist') !== -1) {
      result = {
        type: 'playlist',
        id: `neartist_${getParameterByName('id', url)}`,
      };
    } else if (url.search('//music.163.com/album') !== -1) {
      const match = /\/\/music.163.com\/album\/([0-9]+)/.exec(url);
      id = match ? match[1] : getParameterByName('id', url);
      result = {
        type: 'playlist',
        id: `nealbum_${id}`,
      };
    }
    return result;
  }

  function get_playlist(url) {
    const list_id = getParameterByName('list_id', url).split('_')[0];
    switch (list_id) {
      case 'neplaylist':
        return ne_get_playlist(url);
      case 'nealbum':
        return ne_album(url);
      case 'neartist':
        return ne_artist(url);
      default:
        return null;
    }
  }

  return {
    show_playlist: ne_show_playlist,
    get_playlist,
    parse_url: ne_parse_url,
    bootstrap_track: ne_bootstrap_track,
    search: ne_search,
    lyric: ne_lyric,
  };
}

const netease = build_netease(); // eslint-disable-line no-unused-vars
