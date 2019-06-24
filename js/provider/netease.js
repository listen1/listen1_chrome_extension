/* global aesjs chrome DOMParser getParameterByName */
/* global sub btoa bigInt2str dup equalsInt int2bigInt mod mult powMod str2bigInt rightShift_ */
function build_netease() {
  function ne_show_playlist(url, hm) {
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
        hm.get(target_url).then((response) => {
          const { data } = response;
          const list_elements = Array.from((new DOMParser()).parseFromString(data, 'text/html').getElementsByClassName('m-cvrlst')[0].children);
          const result = list_elements.map(item => ({
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
    const pad = 16 - (text.length % 16);
    for (let i = 0; i < pad; i += 1) {
      text += String.fromCharCode(pad); // eslint-disable-line no-param-reassign
    }
    const key = aesjs.util.convertStringToBytes(sec_key);
    // The initialization vector, which must be 16 bytes
    const iv = aesjs.util.convertStringToBytes('0102030405060708');
    let textBytes = aesjs.util.convertStringToBytes(text);
    const aesCbc = new aesjs.ModeOfOperation.cbc(key, iv); // eslint-disable-line new-cap
    const cipherArray = [];
    while (textBytes.length !== 0) {
      const block = aesCbc.encrypt(textBytes.slice(0, 16));
      Array.prototype.push.apply(cipherArray, block);
      textBytes = textBytes.slice(16);
    }
    let ciphertext = '';
    for (let i = 0; i < cipherArray.length; i += 1) {
      ciphertext += String.fromCharCode(cipherArray[i]);
    }
    ciphertext = btoa(ciphertext);
    return ciphertext;
  }

  function hexify(text) {
    return text.split('').map(x => x.charCodeAt(0).toString(16)).join('');
  }

  function zfill(num, size) {
    let s = `${num}`;
    while (s.length < size) s = `0${s}`;
    return s;
  }


  function expmod(base, exp, mymod) {
    if (equalsInt(exp, 0) === 1) return int2bigInt(1, 10);
    if (equalsInt(mod(exp, int2bigInt(2, 10)), 0)) {
      const newexp = dup(exp);
      rightShift_(newexp, 1);
      const result = powMod(expmod(base, newexp, mymod), [2, 0], mymod);
      return result;
    }
    const result = mod(mult(expmod(base, sub(exp, int2bigInt(1, 10)), mymod), base), mymod);
    return result;
  }

  function _rsa_encrypt(text, pubKey, modulus) { // eslint-disable-line no-underscore-dangle
    text = text.split('').reverse().join(''); // eslint-disable-line no-param-reassign
    const base = str2bigInt(hexify(text), 16);
    const exp = str2bigInt(pubKey, 16);
    const mod = str2bigInt(modulus, 16);
    const bigNumber = expmod(base, exp, mod);
    const rs = bigInt2str(bigNumber, 16);
    return zfill(rs, 256).toLowerCase();
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
    let cookieProvider = null;
    let env = null;
    if (typeof chrome !== 'undefined') {
      cookieProvider = chrome;
      env = 'chrome';
    } else {
      const remote = require('electron').remote; // eslint-disable-line
      cookieProvider = remote.session.defaultSession;
      env = 'electron';
    }
    cookieProvider.cookies.get({
      url: domain,
      name: nuidName,
    }, (arg1, arg2) => {
      if (((env === 'chrome') && (arg1 == null)) || ((env === 'electron' && arg2.length === 0))) {
        const nuidValue = _create_secret_key(32);
        const nnidValue = `${nuidValue},${(new Date()).getTime()}`;
        // netease default cookie expire time: 100 years
        const expire = ((new Date()).getTime() + 1e3 * 60 * 60 * 24 * 365 * 100) / 1000;

        cookieProvider.cookies.set({
          url: domain,
          name: nuidName,
          value: nuidValue,
          expirationDate: expire,
        }, (cookie) => { // eslint-disable-line no-unused-vars
          cookieProvider.cookies.set({
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

  function ne_get_playlist(url, hm, se) {
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
          hm({
            url: target_url,
            method: 'POST',
            data: se(data),
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }).then((response) => {
            const { data: res_data } = response;
            const info = {
              id: `neplaylist_${list_id}`,
              cover_img_url: res_data.playlist.coverImgUrl,
              title: res_data.playlist.name,
              source_url: `http://music.163.com/#/playlist?id=${list_id}`,
            };
            const tracks = res_data.playlist.tracks.map(track_json => ({
              id: `netrack_${track_json.id}`,
              title: track_json.name,
              artist: track_json.ar[0].name,
              artist_id: `neartist_${track_json.ar[0].id}`,
              album: track_json.al.name,
              album_id: `nealbum_${track_json.al.id}`,
              source: 'netease',
              source_url: `http://music.163.com/#/song?id=${track_json.id}`,
              img_url: track_json.al.picUrl,
              url: `netrack_${track_json.id}`,
            }));
            return fn({
              info,
              tracks,
            });
          });
        });
      },
    };
  }

  function ne_bootstrap_track(sound, track, success, failure, hm, se) {
    const target_url = 'http://music.163.com/weapi/song/enhance/player/url/v1?csrf_token=';
    const csrf = '';
    let song_id = track.id;

    song_id = song_id.slice('netrack_'.length);

    const d = {
      ids: [song_id],
      level: "standard",
      encodeType: "aac",
      csrf_token: ""
    };
    const data = _encrypted_request(d);

    hm({
      url: target_url,
      method: 'POST',
      data: se(data),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }).then((response) => {
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

  function ne_search(url, hm, se) {
    // use chrome extension to modify referer.
    const target_url = 'http://music.163.com/api/search/pc';
    const keyword = getParameterByName('keywords', url);
    const curpage = getParameterByName('curpage', url);
    const req_data = {
      s: keyword,
      offset: 20 * (curpage - 1),
      limit: 20,
      type: 1,
    };
    return {
      success(fn) {
        hm({
          url: target_url,
          method: 'POST',
          data: se(req_data),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }).then((response) => {
          const { data } = response;
          const tracks = data.result.songs.map(song_info => ({
            id: `netrack_${song_info.id}`,
            title: song_info.name,
            artist: song_info.artists[0].name,
            artist_id: `neartist_${song_info.artists[0].id}`,
            album: song_info.album.name,
            album_id: `nealbum_${song_info.album.id}`,
            source: 'netease',
            source_url: `http://music.163.com/#/song?id=${song_info.id}`,
            img_url: song_info.album.picUrl,
            url: `netrack_${song_info.id}`,
            disabled: !is_playable(song_info),
          }));
          return fn({
            result: tracks,
            total: data.result.songCount,
          });
        });
      },
    };
  }


  function ne_album(url, hm, se) { // eslint-disable-line no-unused-vars
    const album_id = getParameterByName('list_id', url).split('_').pop();
    // use chrome extension to modify referer.
    const target_url = `http://music.163.com/api/album/${album_id}`;

    return {
      success(fn) {
        hm({
          url: target_url,
          method: 'GET',
        }).then((response) => {
          const { data } = response;
          const info = {
            cover_img_url: data.album.picUrl,
            title: data.album.name,
            id: `nealbum_${data.album.id}`,
            source_url: `http://music.163.com/#/album?id=${data.album.id}`,
          };

          const tracks = data.album.songs.map(song_info => ({
            id: `netrack_${song_info.id}`,
            title: song_info.name,
            artist: song_info.artists[0].name,
            artist_id: `neartist_${song_info.artists[0].id}`,
            album: song_info.album.name,
            album_id: `nealbum_${song_info.album.id}`,
            source: 'netease',
            source_url: `http://music.163.com/#/song?id=${song_info.id}`,
            img_url: song_info.album.picUrl,
            url: `netrack_${song_info.id}`,
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

  function ne_artist(url, hm, se) { // eslint-disable-line no-unused-vars
    const artist_id = getParameterByName('list_id', url).split('_').pop();
    // use chrome extension to modify referer.
    const target_url = `http://music.163.com/api/artist/${artist_id}`;

    return {
      success(fn) {
        hm({
          url: target_url,
          method: 'GET',
        }).then((response) => {
          const { data } = response;
          const info = {
            cover_img_url: data.artist.picUrl,
            title: data.artist.name,
            id: `neartist_${data.artist.id}`,
            source_url: `http://music.163.com/#/artist?id=${data.artist.id}`,
          };

          const tracks = data.hotSongs.map(song_info => ({
            id: `netrack_${song_info.id}`,
            title: song_info.name,
            artist: song_info.artists[0].name,
            artist_id: `neartist_${song_info.artists[0].id}`,
            album: song_info.album.name,
            album_id: `nealbum_${song_info.album.id}`,
            source: 'netease',
            source_url: `http://music.163.com/#/song?id=${song_info.id}`,
            img_url: song_info.album.picUrl,
            url: `netrack_${song_info.id}`,
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

  function ne_lyric(url, hm, se) {
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
        hm({
          url: target_url,
          method: 'POST',
          data: se(data),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }).then((response) => {
          const { data: res_data } = response;
          let lrc = '';
          if (res_data.lrc != null) {
            lrc = res_data.lrc.lyric;
          }
          return fn({
            lyric: lrc,
          });
        });
      },
    };
  }

  function ne_parse_url(url) {
    let result;
    url = url.replace('music.163.com/#/my/m/music/playlist?', 'music.163.com/#/playlist?'); // eslint-disable-line no-param-reassign
    if (url.search('//music.163.com/#/m/playlist') !== -1 || url.search('//music.163.com/#/playlist') !== -1 || url.search('//music.163.com/playlist') !== -1) {
      result = {
        type: 'playlist',
        id: `neplaylist_${getParameterByName('id', url)}`,
      };
    }
    return result;
  }

  function get_playlist(url, hm, se) {
    const list_id = getParameterByName('list_id', url).split('_')[0];
    switch (list_id) {
      case 'neplaylist':
        return ne_get_playlist(url, hm, se);
      case 'nealbum':
        return ne_album(url, hm, se);
      case 'neartist':
        return ne_artist(url, hm, se);
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
