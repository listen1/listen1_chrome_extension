function build_migu() {
  function handleProtocolRelativeUrl(url) {
    const regex = /^.*?\/\//;
    const result = url.replace(regex, 'http://');
    return result;
  }

  function mg_show_playlist(url) {
    const offset = getParameterByName('offset', url);
    const page_size = 25;
    let target_url = '';
    if (offset != null) {
      const page = offset / page_size + 1;
      target_url = `http://music.migu.cn/v3/music/playlist?page=${page}`;
    } else {
      target_url = `http://music.migu.cn/v3/music/playlist`;
    }

    return {
      success(fn) {
        axios.get(target_url).then((response) => {
          const {
            data
          } = response;
          const domObj = (new DOMParser()).parseFromString(data, 'text/html');
          const playlist_elements = Array.from(domObj.getElementsByClassName('song-list-cont')[0].getElementsByTagName('ul')[0].children);
          const result = playlist_elements.map(item => ({
            cover_img_url: handleProtocolRelativeUrl(item.getElementsByClassName('img-full')[0].dataset.original),
            title: item.getElementsByClassName('song-list-name')[0].getElementsByTagName('a')[0].innerHTML,
            id: `mgplaylist_${item.getElementsByClassName('playlist-play')[0].dataset.id}`,
            source_url: `http://music.migu.cn/v3/music/playlist/${item.getElementsByClassName('playlist-play')[0].dataset.id}`,
          }));
          return fn({
            result,
          });
        });
      },
    };
  }

  function get_playlist_data_from_response(playlist_type, list_type, list_id, data){
    let target_url = '';
    if (playlist_type == 'playlist') {
      target_url = `http://music.migu.cn/v3/music/playlist/${list_id}`;
    } else if (playlist_type == 'album') {
      target_url = `http://music.migu.cn/v3/music/album/${list_id}`;
    } else if (playlist_type == 'artist') {
      target_url = `http://music.migu.cn/v3/music/artist/${list_id}/song`;
    }

    const domObj = (new DOMParser()).parseFromString(data, 'text/html');
    const song_elements = Array.from(domObj.getElementsByClassName('songlist-body')[0].children);
    let cover_url = '';
    let title = '';
    if (playlist_type == 'artist') {
      cover_url = handleProtocolRelativeUrl(domObj.getElementsByClassName('artist-avatar')[0].getElementsByTagName('img')[0].src);
      title = domObj.getElementsByClassName('artist-avatar')[0].getElementsByTagName('img')[0].alt;
    } else {
      cover_url = handleProtocolRelativeUrl(domObj.getElementsByClassName('thumb-img')[0].src);
      title = domObj.getElementsByClassName('thumb-img')[0].alt;
    }
    const info = {
      id: `${list_type}_${list_id}`,
      cover_img_url: cover_url,
      title: title,
      source_url: target_url,
    };
    const tracks = song_elements.map(item => {
      const cid = item.getElementsByClassName('song-index')[0].dataset.cid;
      let album_name = '';
      if (playlist_type == 'playlist' || playlist_type == 'artist') {
        const album_list = item.getElementsByClassName('song-belongs')[0].getElementsByTagName('a');
        if (album_list.length > 0) {
          album_name = album_list[0].title;
        }
      } else {
        album_name = domObj.getElementsByClassName('thumb-img')[0].alt;
      }

      const artist_url_list = item.getElementsByClassName('song-singers')[0].getElementsByTagName('a')[0].href.split('/');
      const artist_id = artist_url_list[artist_url_list.length - 1];

      return {
        id: `mgtrack_${cid}`,
        title: item.getElementsByClassName('song-name')[0].getElementsByTagName('a')[0].innerHTML,
        artist: item.getElementsByClassName('song-singers')[0].getElementsByTagName('a')[0].innerHTML,
        artist_id: `mgartist_${artist_id}`,
        album: album_name,
        album_id: `mgalbum_${item.getElementsByClassName('song-index')[0].dataset.aid}`,
        source: 'migu',
        source_url: `http://music.migu.cn/v3/music/song/${cid}`,
        img_url: cover_url, // TODO: use different cover for every song solution: change to mobile api. By now some play problem exists.
        // url: `mgtrack_${cid}`,
        disabled: cid == ''
      }
    });
    // current page fetch only work for playlist.
    // album page has no pager.
    // artist page will fail and only keep default 1 page
    // to avoid too many tracks to fetch once open
    // TODO: customized pager/pager fit provider
    let page_items = domObj.querySelectorAll('.page a:not(.page-c)');
    let current = 1;
    if(page_items.length === 0){
      total = 1;
      current = 1;
    }
    else{
      total = page_items.length;
      current = parseInt(domObj.querySelector('.page a.on').innerHTML);
    }
    
    return {
      info,
      tracks,
      total,
      current
    };
  }

  function get_playlist_from_url(index, url, params, callback){
    const playlist_type = params[0];
    const list_type = params[1];
    const list_id = params[2];

    axios.get(url).then((response) => {
      const { data } = response;
      const result = get_playlist_data_from_response(playlist_type, list_type, list_id, data);
      return callback(null, result);
    });
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

  function mg_get_playlist(url, se, playlist_type) {
    return {
      success(fn) {
        const list_id = getParameterByName('list_id', url).split('_').pop();
        const list_type = getParameterByName('list_id', url).split('_')[0];
        let target_url = '';
        if (playlist_type == 'playlist') {
          target_url = `http://music.migu.cn/v3/music/playlist/${list_id}`;
        } else if (playlist_type == 'album') {
          target_url = `http://music.migu.cn/v3/music/album/${list_id}`;
        } else if (playlist_type == 'artist') {
          target_url = `http://music.migu.cn/v3/music/artist/${list_id}/song`;
        }
        get_playlist_from_url(0, target_url, [playlist_type, list_type, list_id], function(err, result){
          if (result.total === 1){
            return fn(result);
          }
          const urls = [];
          for(var i=2; i<=result.total;i++){
            let url = `${target_url}?page=${i}`
            urls.push(url);
          }
          return async_process_list(urls, get_playlist_from_url, [playlist_type, list_type, list_type],
            (err, playlists) => {
              playlists.forEach(function(playlist){
                result.tracks = result.tracks.concat(playlist.tracks);
              })
              return fn(result);
            });
        });
      }
    };
  }

  function mg_bootstrap_track(sound, track, success, failure) {
    let song_id = track.id;
    song_id = song_id.slice('mgtrack_'.length);

    const k = "4ea5c508a6566e76240543f8feb06fd457777be39549c4016436afda65d2330e";
    const rsaEncrypt = new JSEncrypt();
    const publicKey = "-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC8asrfSaoOb4je+DSmKdriQJKW\nVJ2oDZrs3wi5W67m3LwTB9QVR+cE3XWU21Nx+YBxS0yun8wDcjgQvYt625ZCcgin\n2ro/eOkNyUOTBIbuj9CvMnhUYiR61lC1f1IGbrSYYimqBVSjpifVufxtx/I3exRe\nZosTByYp4Xwpb1+WAQIDAQAB\n-----END PUBLIC KEY-----";
    rsaEncrypt.setPublicKey(publicKey);
    const secKey = rsaEncrypt.encrypt(k);
    // type parameter for music quality: 1: normal 2: hq 3: sq
    const aesResult = CryptoJS.AES.encrypt(`{"copyrightId":"${song_id}","type":2,"auditionsFlag":0}`, k).toString();

    const url = `http://music.migu.cn/v3/api/music/audioPlayer/getPlayInfo?dataType=2&data=${encodeURIComponent(aesResult)}&secKey=${encodeURIComponent(secKey)}`;

    axios.get(url).then((response) => {
      const { data: res_data } = response;
      let { playUrl } = res_data.data;
      if (playUrl != null) {
        if (playUrl.startsWith('//')) {
          playUrl = 'https:' + playUrl;
        }
        sound.url = playUrl; // eslint-disable-line no-param-reassign
        success();
      } else {
        failure();
      }
    });
  }

  function mg_search(url) {
    const keyword = getParameterByName('keywords', url);
    const curpage = getParameterByName('curpage', url);
    const target_url = 'https://m.music.migu.cn/migu/remoting/scr_search_tag?rows=20&type=2&keyword=' + keyword + '&pgc=' + curpage;
    const searchType = getParameterByName('type', url);
    if (searchType === '1') {
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
        axios.get(target_url).then((response) => {
          const { data } = response;
          if(data.musics === undefined){
            return fn({
              result: [],
              total: 0,
              type: searchType
            });
          }
          const tracks = data.musics.map(song_info => ({
            id: `mgtrack_${song_info.copyrightId}`,
            title: song_info.songName,
            artist: song_info.singerName.split(',')[0],
            artist_id: `mgartist_${song_info.singerId.split(',')[0]}`,
            album: song_info.albumName,
            album_id: `mgalbum_${song_info.albumId}`,
            source: 'migu',
            source_url: `http://music.migu.cn/v3/music/song/${song_info.copyrightId}`,
            img_url: song_info.cover,
            // url: `mgtrack_${song_info.copyrightId}`,
            disabled: false,
          }));
          return fn({
            result: tracks,
            total: data.pgt * 20,
            type: searchType
          });
        });
      },
    };
  }

  function mg_lyric(url) {
    const song_id = getParameterByName('track_id', url).split('_').pop();
    const target_url = 'http://music.migu.cn/v3/api/music/audioPlayer/getLyric?copyrightId=' + song_id;
    return {
      success(fn) {
        axios.get(target_url).then((response) => {
          const { data: res_data } = response;
          let lrc = '';
          if (res_data.lyric != null) {
            lrc = res_data.lyric;
          }
          return fn({
            lyric: lrc,
          });
        });
      },
    };
  }

  function mg_parse_url(url) {
    let result;
    const regex = /\/\/music.migu.cn\/v3\/music\/playlist\/([0-9]+)/g;
    const regex_result = regex.exec(url);
    if (regex_result !== null) {
      result = {
        type: 'playlist',
        id: `mgplaylist_${regex_result[1]}`,
      };
    }
    return result;
  }

  function get_playlist(url) {
    const list_id = getParameterByName('list_id', url).split('_')[0];
    switch (list_id) {
      case 'mgplaylist':
        return mg_get_playlist(url, 'playlist');
      case 'mgalbum':
        return mg_get_playlist(url, 'album');
      case 'mgartist':
        return mg_get_playlist(url, 'artist');
      default:
        return null;
    }
  }

  return {
    show_playlist: mg_show_playlist,
    get_playlist,
    parse_url: mg_parse_url,
    bootstrap_track: mg_bootstrap_track,
    search: mg_search,
    lyric: mg_lyric,
  };
}

const migu = build_migu(); // eslint-disable-line no-unused-vars
