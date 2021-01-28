/* eslint-disable consistent-return */
/* eslint-disable no-unused-vars */
/* eslint-disable no-use-before-define */
/* global getParameterByName async forge */
function build_migu() {
  function mg_convert_song(song) {
    return {
      id: `mgtrack_${song.copyrightId}`,
      title: song.songName,
      artist: song.artists ? song.artists[0].name : song.singer,
      artist_id: `mgartist_${song.artists ? song.artists[0].id : song.singerId}`,
      album: song.albumId !== 1 ? song.album : '',
      album_id: song.albumId !== 1 ? `mgalbum_${song.albumId}` : 'mgalbum_',
      source: 'migu',
      source_url: `https://music.migu.cn/v3/music/song/${song.copyrightId}`,
      img_url: song.albumImgs[1].img,
      // url: `mgtrack_${song.copyrightId}`,
      lyric_url: song.lrcUrl || '',
      tlyric_url: song.trcUrl || '',
      quality: song.toneControl,
      disabled: song.copyright === 0,
    };
  }

  function mg_render_tracks(url, page, callback) {
    const list_id = getParameterByName('list_id', url).split('_').pop();
    const playlist_type = getParameterByName('list_id', url).split('_')[0];
    let tracks_url = '';
    switch (playlist_type) {
      case 'mgplaylist':
        tracks_url = `https://app.c.nf.migu.cn/MIGUM2.0/v1.0/user/queryMusicListSongs.do?musicListId=${list_id}&pageNo=${page}&pageSize=50`;
        break;
      case 'mgalbum':
        tracks_url = `https://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/queryAlbumSong?albumId=${list_id}&pageNo=${page}&pageSize=50`;
        break;
      default:
        break;
    }
    axios.get(tracks_url).then((response) => {
      const data = playlist_type === 'mgplaylist' ? response.data.list : response.data.songList;
      const tracks = data.map((item) => mg_convert_song(item));
      return callback(null, tracks);
    });
  }

  function mg_show_playlist(url) {
    const offset = Number(getParameterByName('offset', url));
    const pageSize = 25;
    const target_url = `https://app.c.nf.migu.cn/MIGUM2.0/v2.0/content/getMusicData.do?count=${pageSize}&start=${offset / pageSize + 1}&templateVersion=5&type=1`;
    // const target_url = `https://m.music.migu.cn/migu/remoting/playlist_bycolumnid_tag?playListType=2&type=1&columnId=15127315&tagId=&startIndex=${offset}`;
    // columnId=15127315为推荐，15127272为最新
    return {
      success(fn) {
        axios.get(target_url).then((response) => {
          const { data } = response.data;
          const result = data.contentItemList[0].itemList.map((item) => {
            const match = /id=([0-9]+)&/.exec(item.actionUrl);
            const id = match ? match[1] : '';
            return {
              cover_img_url: item.imageUrl,
              title: item.title,
              id: `mgplaylist_${id}`,
              source_url: `https://music.migu.cn/v3/music/playlist/${id}`,
            };
          });
          fn({ result });
        });
      },
    };
  }

  function mg_get_playlist(url) {
    const list_id = getParameterByName('list_id', url).split('_').pop();
    return {
      success(fn) {
        const info_url = `https://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/resourceinfo.do?needSimple=00&resourceType=2021&resourceId=${list_id}`;
        axios.get(info_url).then((response) => {
          const info = {
            id: `mgplaylist_${list_id}`,
            cover_img_url: response.data.resource[0].imgItem.img,
            title: response.data.resource[0].title,
            source_url: `https://music.migu.cn/v3/music/playlist/${list_id}`,
          };
          const total = response.data.resource[0].musicNum;
          const page = Math.ceil(total / 50);
          const page_array = Array.from({ length: page }, (v, k) => k + 1);
          async.concat(page_array,
            (item, callback) => mg_render_tracks(url, item, callback),
            (err, tracks) => {
              fn({
                tracks,
                info,
              });
            });
        });
      },
    };
  }

  function mg_album(url) {
    const album_id = getParameterByName('list_id', url).split('_').pop();
    return {
      success(fn) {
        const info_url = `https://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/resourceinfo.do?needSimple=00&resourceType=2003&resourceId=${album_id}`;
        axios.get(info_url).then((response) => {
          const { data } = response;
          const info = {
            id: `mgalbum_${album_id}`,
            cover_img_url: data.resource[0].imgItems[1].img,
            title: data.resource[0].title,
            source_url: `https://music.migu.cn/v3/music/album/${album_id}`,
          };
          const total = data.resource[0].totalCount;
          const page = Math.ceil(total / 50);
          const page_array = Array.from({ length: page }, (v, k) => k + 1);
          async.concat(page_array,
            (item, callback) => mg_render_tracks(url, item, callback),
            (err, tracks) => {
              fn({
                tracks,
                info,
              });
            });
        });
      },
    };
  }

  function mg_artist(url) {
    const artist_id = getParameterByName('list_id', url).split('_').pop();
    const offset = Number(getParameterByName('offset', url));
    const pageSize = 50;
    const page = offset / pageSize + 1;
    const target_url = `https://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/singer_songs.do?pageNo=${page}&pageSize=${pageSize}&resourceType=2&singerId=${artist_id}`;

    return {
      success(fn) {
        axios.get(target_url).then((response) => {
          const { data } = response;
          const info = {
            id: `mgartist_${artist_id}`,
            cover_img_url: data.singer.imgs[1].img,
            title: data.singer.singer,
            source_url: `https://music.migu.cn/v3/music/artist/${artist_id}/song`,
          };

          const tracks = data.songlist.map((item) => mg_convert_song(item));
          return fn({
            tracks,
            info,
          });
        });
      },
    };
  }

  function mg_bootstrap_track(sound, track, success, failure) {
    const song_id = track.id.slice('mgtrack_'.length);
    let type;
    switch (track.quality) {
      case '110000':
        type = 2;
        break;
      case '111100':
        type = 3;
        break;
      case '111111':
        type = 4;
        break;
      default:
        type = 1;
    }
    const k = '4ea5c508a6566e76240543f8feb06fd457777be39549c4016436afda65d2330e';
    // type parameter for music quality: 1: normal, 2: hq, 3: sq, 4: zq, 5: z3d
    const plain = forge.util.createBuffer(`{"copyrightId":"${song_id}","type":${type},"auditionsFlag":0}`);
    const salt = forge.random.getBytesSync(8);
    const derivedBytes = forge.pbe.opensslDeriveBytes(k, salt, 48);
    const buffer = forge.util.createBuffer(derivedBytes);
    const key = buffer.getBytes(32);
    const iv = buffer.getBytes(16);

    const cipher = forge.cipher.createCipher('AES-CBC', key);
    cipher.start({ iv });
    cipher.update(plain);
    cipher.finish();
    const output = forge.util.createBuffer();
    output.putBytes('Salted__');
    output.putBytes(salt);
    output.putBuffer(cipher.output);
    const aesResult = forge.util.encode64(output.bytes());

    const publicKey = '-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC8asrfSaoOb4je+DSmKdriQJKW\nVJ2oDZrs3wi5W67m3LwTB9QVR+cE3XWU21Nx+YBxS0yun8wDcjgQvYt625ZCcgin\n2ro/eOkNyUOTBIbuj9CvMnhUYiR61lC1f1IGbrSYYimqBVSjpifVufxtx/I3exRe\nZosTByYp4Xwpb1+WAQIDAQAB\n-----END PUBLIC KEY-----';
    const secKey = forge.util.encode64(forge.pki.publicKeyFromPem(publicKey).encrypt(k));

    const target_url = `https://music.migu.cn/v3/api/music/audioPlayer/getPlayInfo?dataType=2&data=${encodeURIComponent(aesResult)}&secKey=${encodeURIComponent(secKey)}`;

    axios.get(target_url).then((response) => {
      // const { data } = response.data;
      let playUrl = response.data.data ? response.data.data.playUrl : null;
      if (playUrl) {
        if (playUrl.startsWith('//')) {
          playUrl = `https:${playUrl}`;
        }
        sound.url = playUrl.replace(/\+/g, '%2B'); // eslint-disable-line no-param-reassign
        // 无损 formatType=SQ resourceType=E
        // 高品 formatType=HQ resourceType=2
        // https://app.pd.nf.migu.cn/MIGUM2.0/v1.0/content/sub/listenSong.do?toneFlag=${formatType}&netType=00&userId=15548614588710179085069&ua=Android_migu&version=5.1&copyrightId=0&contentId={$contentId}&resourceType=${resourceType}&channel=0
        success();
      } else {
        failure();
      }
    });
  }

  function mg_search(url) {
    const keyword = getParameterByName('keywords', url);
    const curpage = getParameterByName('curpage', url);
    const searchType = getParameterByName('type', url);
    const sid = (uuid() + uuid()).replace(/-/g, '');
    // let type ='';
    let searchSwitch = '';
    let target_url = 'https://jadeite.migu.cn/music_search/v2/search/searchAll?';
    switch (searchType) {
      case '0':
        searchSwitch = '{"song":1}'; // {"song":1,"album":0,"singer":0,"tagSong":1,"mvSong":0,"bestShow":1,"songlist":0,"lyricSong":0}
        // type = 2;
        target_url = `${target_url}sid=${sid}&isCorrect=1&isCopyright=1`
          + `&searchSwitch=${encodeURIComponent(searchSwitch)}&pageSize=20`
          + `&text=${encodeURIComponent(keyword)}&pageNo=${curpage}`
          + '&feature=1000000000&sort=1';
        break;
      case '1':
        searchSwitch = '{"songlist":1}';
        // type = 6;
        target_url = `${target_url}sid=${sid}&isCorrect=1&isCopyright=1`
          + `&searchSwitch=${encodeURIComponent(searchSwitch)}`
          + '&userFilter=%7B%22songlisttag%22%3A%5B%5D%7D&pageSize=20'
          + `&text=${encodeURIComponent(keyword)}&pageNo=${curpage}`
          // + `&sort=1&userSort=%7B%22songlist%22%3A%22default%22%7D`;
          + '&feature=0000000010&sort=1';
        break;
      default:
        break;
    }
    // const target_url = `https://pd.musicapp.migu.cn/MIGUM3.0/v1.0/content/search_all.do?&isCopyright=0&isCorrect=0&text=${keyword}&pageNo=${curpage}&searchSwitch=${searchSwitch}`;
    // const target_url = `https://m.music.migu.cn/migu/remoting/scr_search_tag?rows=20&type=${type}&keyword=${keyword}'&pgc=${curpage}`;

    const deviceId = forge.md5.create().update(uuid().replace(/-/g, '')).digest().toHex()
      .toLocaleUpperCase(); // 设备的UUID
    const timestamp = (new Date()).getTime();
    const signature_md5 = '6cdc72a439cef99a3418d2a78aa28c73'; // app签名证书的md5
    const text = `${keyword + signature_md5}yyapp2d16148780a1dcc7408e06336b98cfd50${deviceId}${timestamp}`;
    const sign = forge.md5.create(text).update(forge.util.encodeUtf8(text)).digest().toHex();
    const headers = {
      // android_id: 'db2cd8c4cdc1345f',
      appId: 'yyapp2',
      // brand: 'google',
      // channel: '0147151',
      deviceId,
      // HWID: '',
      // IMEI: '',
      // IMSI: '',
      // ip: '192.168.1.101',
      // mac: '02:00:00:00:00:00',
      // 'mgm-Network-standard': '01',
      // 'mgm-Network-type': '04',
      // mode: 'android',
      // msisdn: '',
      // OAID: '',
      // os: 'android 7.0',
      // osVersion: 'android 7.0',
      // platform: 'G011C',
      sign,
      timestamp,
      // ua: 'Android_migu',
      // uid: '',
      uiVersion: 'A_music_3.3.0',
      version: '7.0.4',
    };
    return {
      success(fn) {
        axios.get(target_url, {
          headers,
        }).then((response) => {
          const { data } = response;
          let result = [];
          let total = 0;
          if (searchType === '0') {
            if (data.songResultData.result) {
              result = data.songResultData.result.map((item) => mg_convert_song(item));
              total = data.songResultData.totalCount;
            }
          } else if (searchType === '1') {
            if (data.songListResultData.result) {
              result = data.songListResultData.result.map((item) => ({
                // result = data.songLists.map(item => ({
                id: `mgplaylist_${item.id}`,
                title: item.name,
                source: 'migu',
                source_url: `https://music.migu.cn/v3/music/playlist/${item.id}`,
                // img_url: item.img,
                img_url: item.musicListPicUrl,
                url: `mgplaylist_${item.id}`,
                author: item.userName,
                count: item.musicNum,
              }));
              total = data.songListResultData.totalCount;
            }
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

  // https://abhishekdutta.org/blog/standalone_uuid_generator_in_javascript.html
  function uuid() {
    const temp_url = URL.createObjectURL(new Blob());
    const strTemp = temp_url.toString();
    URL.revokeObjectURL(temp_url);
    return strTemp.substr(strTemp.lastIndexOf('/') + 1); // remove prefix (e.g. blob:null/, blob:www.test.com/, ...)
  }

  function mg_lyric(url) {
    const lyric_url = getParameterByName('lyric_url', url);
    const tlyric_url = getParameterByName('tlyric_url', url);
    return {
      success(fn) {
        async.parallel([
          (callback) => {
            if (lyric_url) {
              axios.get(lyric_url).then((response) => callback(null, response.data));
            } else {
              return callback(null, '[00:00.00]暂无歌词\r\n[00:02.00]\r\n');
            }
          },
          (callback) => {
            if (tlyric_url) {
              axios.get(tlyric_url).then((response) => callback(null, response.data));
            } else {
              return callback(null, '');
            }
          },
        ], (err, results) => {
          const data = mg_generate_translation(results[0], results[1]);
          return fn({
            lyric: data.lrc,
            tlyric: data.tlrc,
          });
        });
      },
    };
  }

  function mg_generate_translation(plain, translation) {
    if (!translation) {
      return {
        lrc: plain,
        tlrc: '',
      };
    }
    const arr_plain = plain.split('\n');
    let arr_translation = translation.split('\n');
    // 歌词和翻译顶部信息不一定都有，会导致行列对不齐，所以删掉
    const reg_head = /\[(ti|ar|al|by|offset|kana|high):/;
    let plain_head_line = 0;
    let trans_head_line = 0;
    for (let i = 0; i < 7; i += 1) {
      if (reg_head.test(arr_plain[i])) {
        plain_head_line += 1;
      }
      if (reg_head.test(arr_translation[i])) {
        trans_head_line += 1;
      }
    }
    arr_plain.splice(0, plain_head_line);
    arr_translation.splice(0, trans_head_line);
    // 删除翻译与原歌词重复的歌曲名，歌手、作曲、作词等信息
    const reg_info = /(\u4f5c|\u7f16)(\u8bcd|\u66f2)|\u6b4c(\u624b|\u66f2)\u540d|Written by/;
    let trans_info_line = 0;
    for (let i = 0; i < 6; i += 1) {
      if (reg_info.test(arr_translation[i])) {
        trans_info_line += 1;
      }
    }
    arr_translation = arr_translation.splice(trans_info_line);
    const tlrc = arr_translation.join('\r\n');
    return {
      lrc: plain,
      tlrc,
    };
  }

  function mg_parse_url(url) {
    let result;
    // eslint-disable-next-line no-param-reassign
    url = url.replace('music.migu.cn/v3/my/playlist/', 'music.migu.cn/v3/music/playlist/');
    const regex = /\/\/music.migu.cn\/v3\/music\/playlist\/([0-9]+)/g;
    const regex_result = regex.exec(url);
    if (regex_result) {
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
        return mg_get_playlist(url);
      case 'mgalbum':
        return mg_album(url);
      case 'mgartist':
        return mg_artist(url);
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
