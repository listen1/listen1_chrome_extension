function build_migu() {
  function handleProtocolRelativeUrl(url) {
    const regex = /^.*?\/\//;
    const result = url.replace(regex, 'http://');
    return result;
  }

  function mg_show_playlist(url, hm) {
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
        hm.get(target_url).then((response) => {
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

  function mg_get_playlist(url, hm, se, playlist_type) {
    return {
      success(fn) {
        const list_id = getParameterByName('list_id', url).split('_').pop();
        let target_url = '';
        if (playlist_type == 'playlist') {
          target_url = `http://music.migu.cn/v3/music/playlist/${list_id}`;
        } else if (playlist_type == 'album') {
          target_url = `http://music.migu.cn/v3/music/album/${list_id}`;
        } else if (playlist_type == 'artist') {
          target_url = `http://music.migu.cn/v3/music/artist/${list_id}/song`;
        }

        hm({
          url: target_url,
          method: 'GET'
        }).then((response) => {
          const {
            data
          } = response;
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
            id: `mgplaylist_${list_id}`,
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
              url: `mgtrack_${cid}`,
              disabled: cid == ''
            }
          });

          return fn({
            info,
            tracks,
          });
        });
      },
    };
  }

  function mg_bootstrap_track(sound, track, success, failure, hm, se) {
    let song_id = track.id;
    song_id = song_id.slice('mgtrack_'.length);

    const k = "4ea5c508a6566e76240543f8feb06fd457777be39549c4016436afda65d2330e";
    const rsaEncrypt = new JSEncrypt();
    const publicKey = "-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC8asrfSaoOb4je+DSmKdriQJKW\nVJ2oDZrs3wi5W67m3LwTB9QVR+cE3XWU21Nx+YBxS0yun8wDcjgQvYt625ZCcgin\n2ro/eOkNyUOTBIbuj9CvMnhUYiR61lC1f1IGbrSYYimqBVSjpifVufxtx/I3exRe\nZosTByYp4Xwpb1+WAQIDAQAB\n-----END PUBLIC KEY-----";
    rsaEncrypt.setPublicKey(publicKey);
    const secKey = rsaEncrypt.encrypt(k);
    const aesResult = CryptoJS.AES.encrypt(`{"copyrightId":"${song_id}"}`, k).toString();
    const url = `http://music.migu.cn/v3/api/music/audioPlayer/getPlayInfo?dataType=2&data=${encodeURIComponent(aesResult)}&secKey=${encodeURIComponent(secKey)}`;

    hm({
      url: url,
      method: 'GET',
    }).then((response) => {
      const {
        data: res_data
      } = response;
      const {
        playUrl
      } = res_data.data.hqPlayInfo;
      if (playUrl != null) {
        sound.url = playUrl; // eslint-disable-line no-param-reassign
        success();
      } else {
        failure();
      }
    });
  }

  function mg_search(url, hm, se) {
    const keyword = getParameterByName('keywords', url);
    const curpage = getParameterByName('curpage', url);
    const target_url = 'http://m.music.migu.cn/migu/remoting/scr_search_tag?rows=20&type=2&keyword=' + keyword + '&pgc=' + curpage;
    return {
      success(fn) {
        hm({
          url: target_url,
          method: 'GET',
        }).then((response) => {
          const {
            data
          } = response;
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
            url: `mgtrack_${song_info.copyrightId}`,
            disabled: false,
          }));
          return fn({
            result: tracks,
            total: data.pgt * 20,
          });
        });
      },
    };
  }

  function mg_lyric(url, hm, se) {
    const song_id = getParameterByName('track_id', url).split('_').pop();
    const target_url = 'http://music.migu.cn/v3/api/music/audioPlayer/getLyric?copyrightId=' + song_id;
    return {
      success(fn) {
        hm({
          url: target_url,
          method: 'GET',
        }).then((response) => {
          const {
            data: res_data
          } = response;
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

  function get_playlist(url, hm, se) {
    const list_id = getParameterByName('list_id', url).split('_')[0];
    switch (list_id) {
      case 'mgplaylist':
        return mg_get_playlist(url, hm, se, 'playlist');
      case 'mgalbum':
        return mg_get_playlist(url, hm, se, 'album');
      case 'mgartist':
        return mg_get_playlist(url, hm, se, 'artist');
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
