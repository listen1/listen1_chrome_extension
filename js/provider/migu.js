/* eslint-disable consistent-return */
/* eslint-disable no-unused-vars */
/* eslint-disable no-use-before-define */
/* global getParameterByName cookieRemove async forge */
class migu {
  static mg_convert_song(song) {
    return {
      id: `mgtrack_${song.copyrightId}`,
      title: song.songName,
      artist: song.artists ? song.artists[0].name : song.singer,
      artist_id: `mgartist_${
        song.artists ? song.artists[0].id : song.singerId
      }`,
      album: song.albumId !== 1 ? song.album : '',
      album_id: song.albumId !== 1 ? `mgalbum_${song.albumId}` : 'mgalbum_',
      source: 'migu',
      source_url: `https://music.migu.cn/v3/music/song/${song.copyrightId}`,
      img_url: song.albumImgs[1].img,
      // url: `mgtrack_${song.copyrightId}`,
      lyric_url: song.lrcUrl || '',
      tlyric_url: song.trcUrl || '',
      quality: song.toneControl,
      url: song.copyright === 0 ? '' : undefined,
      song_id: song.songId,
    };
  }

  static mg_render_tracks(url, page, callback) {
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
      const data =
        playlist_type === 'mgplaylist'
          ? response.data.list
          : response.data.songList;
      const tracks = data.map((item) => this.mg_convert_song(item));
      return callback(null, tracks);
    });
  }

  static mg_show_toplist(offset) {
    if (offset !== undefined && offset > 0) {
      return {
        success: (fn) => fn({ result: [] }),
      };
    }

    const url =
      'https://app.c.nf.migu.cn/MIGUM3.0/v1.0/template/rank-list/release?dataVersion=1616469593718&templateVersion=9';
    return {
      success: (fn) => {
        axios.get(url).then((response) => {
          const migu_board = response.data.data.contentItemList[4].itemList.map(
            (item) => ({
              cover_img_url: item.imageUrl,
              title: item.displayLogId.param.rankName,
              id: `mgtoplist_${item.displayLogId.param.rankId}`,
              source_url: '',
            })
          );
          migu_board.splice(0, 2);
          const global_board = response.data.data.contentItemList[7].itemList.map(
            (item) => ({
              cover_img_url: item.imageUrl,
              title: item.displayLogId.param.rankName,
              id: `mgtoplist_${item.displayLogId.param.rankId}`,
              source_url: '',
            })
          );
          const chart_board = [
            {
              cover_img_url:
                'https://cdnmusic.migu.cn/tycms_picture/20/02/36/20020512065402_360x360_2997.png',
              title: '尖叫新歌榜',
              id: 'mgtoplist_27553319',
              source: '',
            },
            {
              cover_img_url:
                'https://cdnmusic.migu.cn/tycms_picture/20/04/99/200408163640868_360x360_6587.png',
              title: '尖叫热歌榜',
              id: 'mgtoplist_27186466',
              source: '',
            },
            {
              cover_img_url:
                'https://cdnmusic.migu.cn/tycms_picture/20/04/99/200408163702795_360x360_1614.png',
              title: '尖叫原创榜',
              id: 'mgtoplist_27553408',
              source: '',
            },
            {
              cover_img_url:
                'https://cdnmusic.migu.cn/tycms_picture/20/05/136/200515161733982_360x360_1523.png',
              title: '音乐榜',
              id: 'mgtoplist_1',
              source: '',
            },
            {
              cover_img_url:
                'https://cdnmusic.migu.cn/tycms_picture/20/05/136/200515161848938_360x360_673.png',
              title: '影视榜',
              id: 'mgtoplist_2',
              source: '',
            },
          ];
          const result = chart_board.concat(migu_board, global_board);
          return fn({ result });
        });
      },
    };
  }

  static show_playlist(url) {
    const offset = Number(getParameterByName('offset', url));
    const filterId = getParameterByName('filter_id', url);
    if (filterId === 'toplist') {
      return this.mg_show_toplist(offset);
    }
    const pageSize = 30;
    let target_url = '';
    if (!filterId) {
      target_url = `https://app.c.nf.migu.cn/MIGUM2.0/v2.0/content/getMusicData.do?count=${pageSize}&start=${
        offset / pageSize + 1
      }&templateVersion=5&type=1`;
    } else {
      target_url = `https://app.c.nf.migu.cn/MIGUM3.0/v1.0/template/musiclistplaza-listbytag?pageNumber=${
        offset / pageSize + 1
      }&tagId=${filterId}&templateVersion=1`;
      // const target_url = `https://m.music.migu.cn/migu/remoting/playlist_bycolumnid_tag?playListType=2&type=1&columnId=15127315&tagId=&startIndex=${offset}`;
      // columnId=15127315为推荐，15127272为最新
    }
    return {
      success: (fn) => {
        axios.get(target_url).then((response) => {
          const data = !filterId
            ? response.data.data.contentItemList[0].itemList
            : response.data.data.contentItemList.itemList;
          const result = data.map((item) => {
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

  static mg_toplist(url) {
    const list_id = Number(getParameterByName('list_id', url).split('_').pop());
    return {
      success: (fn) => {
        const board_list = {
          27553319: {
            name: '尖叫新歌榜',
            url: 'jianjiao_newsong',
            img: '/20/02/36/20020512065402_360x360_2997.png',
          },
          27186466: {
            name: '尖叫热歌榜',
            url: 'jianjiao_hotsong',
            img: '/20/04/99/200408163640868_360x360_6587.png',
          },
          27553408: {
            name: '尖叫原创榜',
            url: 'jianjiao_original',
            img: '/20/04/99/200408163702795_360x360_1614.png',
          },
          1: {
            name: '音乐榜',
            url: 'migumusic',
            img: '/20/05/136/200515161733982_360x360_1523.png',
          },
          2: {
            name: '影视榜',
            url: 'movies',
            img: '/20/05/136/200515161848938_360x360_673.png',
          },
          23189399: {
            name: '内地榜',
            url: 'mainland',
            img: '/20/08/231/200818095104122_327x327_4971.png',
          },
          23189800: {
            name: '港台榜',
            url: 'hktw',
            img: '/20/08/231/200818095125191_327x327_2382.png',
          },
          19190036: {
            name: '欧美榜',
            url: 'eur_usa',
            img: '/20/08/231/200818095229556_327x327_1383.png',
          },
          23189813: {
            name: '日韩榜',
            url: 'jpn_kor',
            img: '/20/08/231/200818095259569_327x327_4628.png',
          },
          23190126: {
            name: '彩铃榜',
            url: 'coloring',
            img: '/20/08/231/200818095356693_327x327_7955.png',
          },
          15140045: {
            name: 'KTV榜',
            url: 'ktv',
            img: '/20/08/231/200818095414420_327x327_4992.png',
          },
          15140034: {
            name: '网络榜',
            url: 'network',
            img: '/20/08/231/200818095442606_327x327_1298.png',
          },
          23218151: {
            name: '新专辑榜',
            url: 'newalbum',
            img: '/20/08/231/200818095603246_327x327_7480.png',
          },
          33683712: {
            name: '数字专辑畅销榜',
            url: '',
            img:
              'https://d.musicapp.migu.cn/prod/file-service/file-down/bcb5ddaf77828caee4eddc172edaa105/2297b53efa678bbc8a5b83064622c4c8/ebfe5bff9fd9981b5ae1c043f743bfb3',
          },
          23217754: {
            name: 'MV榜',
            url: 'mv',
            img: '/20/08/231/200818095656365_327x327_8344.png',
          },
          21958042: {
            name: '美国iTunes榜',
            url: 'itunes',
            img: '/20/08/231/200818095755771_327x327_9250.png',
          },
          21975570: {
            name: '美国billboard榜',
            url: 'billboard',
            img: '/20/08/231/20081809581365_327x327_4636.png',
          },
          22272815: {
            name: 'Hito中文榜',
            url: 'hito',
            img: '/20/08/231/200818095834912_327x327_5042.png',
          },
          22272943: {
            name: '韩国Melon榜',
            url: 'mnet',
            img: '/20/08/231/200818095926828_327x327_3277.png',
          },
          22273437: {
            name: '英国UK榜',
            url: 'uk',
            img: '/20/08/231/200818095950791_327x327_8293.png',
          },
        };
        let target_url = '';
        if (list_id === 1 || list_id === 2) {
          target_url = `https://music.migu.cn/v3/music/top/${board_list[list_id].url}`;
        } else {
          target_url = `https://app.c.nf.migu.cn/MIGUM3.0/v1.0/template/rank-detail/release?columnId=${list_id}&needAll=0&resourceType=2009`;
        }

        axios.get(target_url).then((response) => {
          const { data } = response;
          const info = {
            id: `mgtoplist_${list_id}`,
            cover_img_url:
              list_id === 33683712
                ? board_list[list_id].img
                : `https://cdnmusic.migu.cn/tycms_picture${board_list[list_id].img}`,
            title: data.data
              ? data.data.columnInfo.title
              : board_list[list_id].name,
            source_url: `https://music.migu.cn/v3/music/top/${board_list[list_id].url}`,
          };
          let tracks = {};
          if (list_id === 1 || list_id === 2) {
            // 音乐榜及影视榜
            const list_elements = new DOMParser()
              .parseFromString(data, 'text/html')
              .getElementsByTagName('script');
            const result = JSON.parse(
              list_elements[1].innerText.split('=').pop()
            );
            tracks = result.songs.items.map((song) => {
              const track = {
                id: `mgtrack_${song.copyrightId}`,
                title: song.name,
                artist: song.singers[0].name,
                artist_id: `mgartist_${song.singers[0].id}`,
                album: song.album.albumId !== 1 ? song.album.albumName : '',
                album_id:
                  song.album.albumId !== 1
                    ? `mgalbum_${song.album.albumId}`
                    : 'mgalbum_',
                source: 'migu',
                source_url: `https://music.migu.cn/v3/music/song/${song.copyrightId}`,
                img_url: `https:${song.mediumPic}`,
                // url: `mgtrack_${song.copyrightId}`,
                lyric_url: 'null',
                tlyric_url: '',
                song_id: song.id,
                url: undefined,
              };
              if (song.bit24) {
                track.quality = '111111';
              } else if (song.sq) {
                track.quality = '111100';
              } else {
                track.quality = '110000';
              }
              return track;
            });
          } else if (list_id === 23217754) {
            //  MV榜
            tracks = data.data.columnInfo.dataList.map((song) => ({
              id: `mgtrack_${song.copyrightId}`,
              title: song.songName,
              artist: song.singer,
              artist_id: `mgartist_${song.singerId}`,
              album: '',
              album_id: 'mgalbum_',
              source: 'migu',
              source_url: `https://music.migu.cn/v3/music/song/${song.copyrightId}`,
              img_url: song.imgs[1].img,
              // url: `mgtrack_${song.copyrightId}`,
              lyric_url: null,
              tlyric_url: '',
              song_id: song.songId,
              url: song.copyright === 0 ? '' : undefined,
            }));
          } else if (list_id === 23218151 || list_id === 33683712) {
            //  新专辑榜及数字专辑畅销榜
            tracks = data.data.columnInfo.dataList.map((item) => ({
              id: `mgtrack_`,
              title: '',
              artist: item.singer,
              artist_id: `mgartist_${item.singerId}`,
              album: item.title,
              album_id: item.albumId ? `mgalbum_${item.albumId}` : 'mgalbum_',
              source: 'migu',
              source_url: `https://music.migu.cn/v3/music/album/${
                item.albumId || ''
              }`,
              img_url: item.imgItems[1].img,
              // url: `mgtrack_${song.copyrightId}`,
              lyric_url: '',
              tlyric_url: '',
              url: '',
            }));
          } else {
            tracks = data.data.columnInfo.dataList.map((item) =>
              this.mg_convert_song(item)
            );
          }
          return fn({
            tracks,
            info,
          });
        });
      },
    };
  }

  static mg_get_playlist(url) {
    const list_id = getParameterByName('list_id', url).split('_').pop();
    return {
      success: (fn) => {
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
          async.concat(
            page_array,
            (item, callback) => this.mg_render_tracks(url, item, callback),
            (err, tracks) => {
              fn({
                tracks,
                info,
              });
            }
          );
        });
      },
    };
  }

  static mg_album(url) {
    const album_id = getParameterByName('list_id', url).split('_').pop();
    return {
      success: (fn) => {
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
          async.concat(
            page_array,
            (item, callback) => this.mg_render_tracks(url, item, callback),
            (err, tracks) => {
              fn({
                tracks,
                info,
              });
            }
          );
        });
      },
    };
  }

  static mg_artist(url) {
    const artist_id = getParameterByName('list_id', url).split('_').pop();
    const offset = Number(getParameterByName('offset', url));
    const pageSize = 50;
    const page = offset / pageSize + 1;
    const target_url = `https://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/singer_songs.do?pageNo=${page}&pageSize=${pageSize}&resourceType=2&singerId=${artist_id}`;

    return {
      success: (fn) => {
        axios.get(target_url).then((response) => {
          const { data } = response;
          const info = {
            id: `mgartist_${artist_id}`,
            cover_img_url: data.singer.imgs[1].img,
            title: data.singer.singer,
            source_url: `https://music.migu.cn/v3/music/artist/${artist_id}/song`,
          };

          const tracks = data.songlist.map((item) =>
            this.mg_convert_song(item)
          );
          return fn({
            tracks,
            info,
          });
        });
      },
    };
  }

  static bootstrap_track(track, success, failure) {
    const sound = {};
    const songId = track.song_id;
    /*
    const copyrightId = track.id.slice('mgtrack_'.length);
    const type = 1;
    // NOTICE：howler flac support is not ready for production.
    // Sometimes network keep pending forever and block later music.
    // So use normal quality.

    // switch (track.quality) {
    //   case '110000':
    //     type = 2;
    //     break;
    //   case '111100':
    //     type = 3;
    //     break;
    //   case '111111':
    //     type = 4;
    //     break;
    //   default:
    //     type = 1;
    // }
    const k =
      '4ea5c508a6566e76240543f8feb06fd457777be39549c4016436afda65d2330e';
    // type parameter for music quality: 1: normal, 2: hq, 3: sq, 4: zq, 5: z3d
    const plain = forge.util.createBuffer(
      `{"copyrightId":"${copyrightId}","type":${type},"auditionsFlag":0}`
    );
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

    const publicKey =
      '-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC8asrfSaoOb4je+DSmKdriQJKW\nVJ2oDZrs3wi5W67m3LwTB9QVR+cE3XWU21Nx+YBxS0yun8wDcjgQvYt625ZCcgin\n2ro/eOkNyUOTBIbuj9CvMnhUYiR61lC1f1IGbrSYYimqBVSjpifVufxtx/I3exRe\nZosTByYp4Xwpb1+WAQIDAQAB\n-----END PUBLIC KEY-----';
    const secKey = forge.util.encode64(
      forge.pki.publicKeyFromPem(publicKey).encrypt(k)
    );

    const target_url = `https://music.migu.cn/v3/api/music/audioPlayer/getPlayInfo?dataType=2&data=${encodeURIComponent(
      aesResult
    )}&secKey=${encodeURIComponent(secKey)}`;
    */
    let toneFlag;
    switch (track.quality) {
      case '110000':
        toneFlag = 'HQ';
        break;
      case '111100':
        toneFlag = 'SQ';
        break;
      case '111111':
        toneFlag = 'ZQ';
        break;
      default:
        toneFlag = 'PQ';
    }
    const target_url = `https://app.c.nf.migu.cn/MIGUM2.0/strategy/listen-url/v2.2?netType=01&resourceType=E&songId=${songId}&toneFlag=${toneFlag}`;
    axios
      .get(target_url, {
        headers: {
          channel: '0146951',
          uid: 1234,
        },
      })
      .then((response) => {
        // const { data } = response.data;
        // let playUrl = response.data.data ? response.data.data.playUrl : null;
        let playUrl = response.data.data ? response.data.data.url : null;
        if (playUrl) {
          if (playUrl.startsWith('//')) {
            playUrl = `https:${playUrl}`;
          }
          sound.url = playUrl.replace(/\+/g, '%2B'); // eslint-disable-line no-param-reassign
          sound.platform = 'migu';
          switch (toneFlag) {
            case 'HQ':
              sound.bitrate = '320kbps';
              break;
            case 'SQ':
              sound.bitrate = '999kbps';
              break;
            case 'ZQ':
              sound.bitrate = '999kbps';
              break;
            default:
              sound.bitrate = '128kbps';
          }
          success(sound);
        } else {
          failure(sound);
        }
      });
  }

  static search(url) {
    const keyword = getParameterByName('keywords', url);
    const curpage = getParameterByName('curpage', url);
    const searchType = getParameterByName('type', url);
    const sid = (this.uuid() + this.uuid()).replace(/-/g, '');
    // let type ='';
    let searchSwitch = '';
    let target_url =
      'https://jadeite.migu.cn/music_search/v2/search/searchAll?';
    switch (searchType) {
      case '0':
        searchSwitch = '{"song":1}'; // {"song":1,"album":0,"singer":0,"tagSong":1,"mvSong":0,"bestShow":1,"songlist":0,"lyricSong":0}
        // type = 2;
        target_url =
          `${target_url}sid=${sid}&isCorrect=1&isCopyright=1` +
          `&searchSwitch=${encodeURIComponent(searchSwitch)}&pageSize=20` +
          `&text=${encodeURIComponent(keyword)}&pageNo=${curpage}` +
          '&feature=1000000000&sort=1';
        break;
      case '1':
        searchSwitch = '{"songlist":1}';
        // type = 6;
        target_url =
          `${target_url}sid=${sid}&isCorrect=1&isCopyright=1` +
          `&searchSwitch=${encodeURIComponent(searchSwitch)}` +
          '&userFilter=%7B%22songlisttag%22%3A%5B%5D%7D&pageSize=20' +
          `&text=${encodeURIComponent(keyword)}&pageNo=${curpage}` +
          // + `&sort=1&userSort=%7B%22songlist%22%3A%22default%22%7D`;
          '&feature=0000000010&sort=1';
        break;
      default:
        break;
    }
    // const target_url = `https://pd.musicapp.migu.cn/MIGUM3.0/v1.0/content/search_all.do?&isCopyright=0&isCorrect=0&text=${keyword}&pageNo=${curpage}&searchSwitch=${searchSwitch}`;
    // const target_url = `https://m.music.migu.cn/migu/remoting/scr_search_tag?rows=20&type=${type}&keyword=${keyword}'&pgc=${curpage}`;

    const deviceId = forge.md5
      .create()
      .update(this.uuid().replace(/-/g, ''))
      .digest()
      .toHex()
      .toLocaleUpperCase(); // 设备的UUID
    const timestamp = new Date().getTime();
    const signature_md5 = '6cdc72a439cef99a3418d2a78aa28c73'; // app签名证书的md5
    const text = `${
      keyword + signature_md5
    }yyapp2d16148780a1dcc7408e06336b98cfd50${deviceId}${timestamp}`;
    const sign = forge.md5
      .create(text)
      .update(forge.util.encodeUtf8(text))
      .digest()
      .toHex();
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
      success: (fn) => {
        axios
          .get(target_url, {
            headers,
          })
          .then((response) => {
            const { data } = response;
            let result = [];
            let total = 0;
            if (searchType === '0') {
              if (data.songResultData.result) {
                result = data.songResultData.result.map((item) =>
                  this.mg_convert_song(item)
                );
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
  static uuid() {
    const temp_url = URL.createObjectURL(new Blob());
    const strTemp = temp_url.toString();
    URL.revokeObjectURL(temp_url);
    return strTemp.substr(strTemp.lastIndexOf('/') + 1); // remove prefix (e.g. blob:null/, blob:www.test.com/, ...)
  }

  static lyric(url) {
    const lyric_url = getParameterByName('lyric_url', url);
    const tlyric_url = getParameterByName('tlyric_url', url);
    return {
      success: (fn) => {
        if (lyric_url !== 'null') {
          async.parallel(
            [
              (callback) => {
                if (lyric_url) {
                  axios
                    .get(lyric_url)
                    .then((response) => callback(null, response.data));
                } else {
                  return callback(null, '[00:00.00]暂无歌词\r\n[00:02.00]\r\n');
                }
              },
              (callback) => {
                if (tlyric_url) {
                  axios
                    .get(tlyric_url)
                    .then((response) => callback(null, response.data));
                } else {
                  return callback(null, '');
                }
              },
            ],
            (err, results) => {
              const data = this.mg_generate_translation(results[0], results[1]);
              return fn({
                lyric: data.lrc,
                tlyric: data.tlrc,
              });
            }
          );
        } else {
          const song_id = getParameterByName('track_id', url).split('_').pop();
          const target_url = `https://music.migu.cn/v3/api/music/audioPlayer/getLyric?copyrightId=${song_id}`;
          axios.get(target_url).then((response) => {
            const data = this.mg_generate_translation(
              response.data.lyric,
              response.data.translatedLyric
            );
            return fn({
              lyric: data.lrc,
              tlyric: data.tlrc,
            });
          });
        }
      },
    };
  }

  static mg_generate_translation(plain, translation) {
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

  static parse_url(url) {
    let result;
    // eslint-disable-next-line no-param-reassign
    url = url.replace(
      'music.migu.cn/v3/my/playlist/',
      'music.migu.cn/v3/music/playlist/'
    );
    const regex = /\/\/music.migu.cn\/v3\/music\/playlist\/([0-9]+)/g;
    const regex_result = regex.exec(url);
    if (regex_result) {
      result = {
        type: 'playlist',
        id: `mgplaylist_${regex_result[1]}`,
      };
    }
    return {
      success: (fn) => {
        fn(result);
      },
    };
  }

  static get_playlist(url) {
    const list_id = getParameterByName('list_id', url).split('_')[0];
    switch (list_id) {
      case 'mgplaylist':
        return this.mg_get_playlist(url);
      case 'mgalbum':
        return this.mg_album(url);
      case 'mgartist':
        return this.mg_artist(url);
      case 'mgtoplist':
        return this.mg_toplist(url);
      default:
        return null;
    }
  }

  static get_playlist_filters() {
    return {
      success: (fn) => {
        let target_url =
          'https://app.c.nf.migu.cn/MIGUM3.0/v1.0/template/musiclistplaza-hottaglist/release';
        axios.get(target_url).then((response) => {
          const recommend = response.data.data.contentItemList.map((item) => ({
            id: item.tagId,
            name: item.tagName,
          }));
          recommend.unshift(
            { id: '', name: '推荐' },
            { id: 'toplist', name: '排行榜' }
          );
          target_url =
            'https://app.c.nf.migu.cn/MIGUM3.0/v1.0/template/musiclistplaza-taglist/release?templateVersion=1';
          axios.get(target_url).then((res) => {
            const all = res.data.data.map((cate) => {
              const result = { category: cate.header.title };
              result.filters = cate.content.map((item) => ({
                id: item.texts[1],
                name: item.texts[0],
              }));
              return result;
            });
            return fn({
              recommend,
              all,
            });
          });
        });
      },
    };
  }

  static get_user() {
    const ts = +new Date();
    const url = `https://music.migu.cn/v3/api/user/getUserInfo?_=${ts}`;
    return {
      success: (fn) => {
        axios.get(url).then((res) => {
          let result = { is_login: false };
          let status = 'fail';

          if (res.data.success) {
            status = 'success';
            const { data } = res;
            result = {
              is_login: true,
              user_id: data.user.uid,
              user_name: data.user.mobile,
              nickname: data.user.nickname,
              avatar: data.user.avatar.midAvatar,
              platform: 'migu',
              data,
            };
          }

          return fn({
            status,
            data: result,
          });
        });
      },
    };
  }

  static get_login_url() {
    return `https://music.migu.cn`;
  }

  static logout() {
    const removeFn = (url, name) =>
      cookieRemove(
        {
          url,
          name,
        },
        () => {}
      );
    const musicCookieList = [
      'migu_music_sid',
      'migu_music_platinum',
      'migu_music_level',
      'migu_music_nickname',
      'migu_music_avatar',
      'migu_music_uid',
      'migu_music_credit_level',
      'migu_music_passid',
      'migu_music_email',
      'migu_music_msisdn',
      'migu_music_status',
    ];
    const passportCookieList = ['USessionID', 'LTToken'];
    musicCookieList.map((name) => removeFn('https://music.migu.cn', name));
    passportCookieList.map((name) =>
      removeFn('https://passport.migu.cn', name)
    );
  }

  // return {
  //   show_playlist: mg_show_playlist,
  //   get_playlist_filters,
  //   get_playlist,
  //   parse_url: mg_parse_url,
  //   bootstrap_track: mg_bootstrap_track,
  //   search: mg_search,
  //   lyric: mg_lyric,
  //   get_user: migu_get_user,
  //   get_login_url: migu_get_login_url,
  //   logout: mg_logout,
  // };
}
