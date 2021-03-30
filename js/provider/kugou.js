/* eslint-disable no-unused-vars */
/* global async getParameterByName */
function build_kugou() {
  function kg_convert_song(song) {
    const track = {
      id: `kgtrack_${song.FileHash}`,
      title: song.SongName,
      artist: '',
      artist_id: '',
      album: song.AlbumName,
      album_id: `kgalbum_${song.AlbumID}`,
      source: 'kugou',
      source_url: `http://www.kugou.com/song/#hash=${song.FileHash}&album_id=${song.AlbumID}`,
      img_url: '',
      // url: `kgtrack_${song.FileHash}`,
      lyric_url: song.FileHash,
    };
    let singer_id = song.SingerId;
    let singer_name = song.SingerName;
    if (song.SingerId instanceof Array) {
      [singer_id] = singer_id;
      [singer_name] = singer_name.split('、');
    }
    track.artist = singer_name;
    track.artist_id = `kgartist_${singer_id}`;
    return track;
  }

  function async_process_list(
    data_list,
    handler,
    handler_extra_param_list,
    callback
  ) {
    const fnDict = {};
    data_list.forEach((item, index) => {
      fnDict[index] = (cb) =>
        handler(index, item, handler_extra_param_list, cb);
    });
    async.parallel(fnDict, (err, results) =>
      callback(
        null,
        data_list.map((item, index) => results[index])
      )
    );
  }

  function kg_render_search_result_item(index, item, params, callback) {
    const track = kg_convert_song(item);
    // Add singer img
    const url = `${'http://www.kugou.com/yy/index.php?r=play/getdata&hash='}${
      track.lyric_url
    }`;
    axios.get(url).then((response) => {
      const { data } = response;
      track.img_url = data.data.img;
      callback(null, track);
    });
  }

  function kg_search(url) {
    // eslint-disable-line no-unused-vars
    const keyword = getParameterByName('keywords', url);
    const curpage = getParameterByName('curpage', url);
    const searchType = getParameterByName('type', url);
    if (searchType === '1') {
      return {
        success(fn) {
          return fn({
            result: [],
            total: 0,
            type: searchType,
          });
        },
      };
    }
    return {
      success(fn) {
        const target_url = `${'http://songsearch.kugou.com/song_search_v2?keyword='}${keyword}&page=${curpage}`;
        axios
          .get(target_url)
          .then((response) => {
            const { data } = response;
            async_process_list(
              data.data.lists,
              kg_render_search_result_item,
              [],
              (err, tracks) =>
                fn({
                  result: tracks,
                  total: data.data.total,
                  type: searchType,
                })
            );
          })
          .catch(() =>
            fn({
              result: [],
              total: 0,
              type: searchType,
            })
          );
      },
    };
  }

  function kg_render_playlist_result_item(index, item, params, callback) {
    const { hash } = item;

    let target_url = `${'http://m.kugou.com/app/i/getSongInfo.php?cmd=playInfo&hash='}${hash}`;
    const track = {
      id: `kgtrack_${hash}`,
      title: '',
      artist: '',
      artist_id: '',
      album: '',
      album_id: `kgalbum_${item.album_id}`,
      source: 'kugou',
      source_url: `http://www.kugou.com/song/#hash=${hash}&album_id=${item.album_id}`,
      img_url: '',
      lyric_url: hash,
    };
    // Fix song info
    axios.get(target_url).then((response) => {
      const { data } = response;
      track.title = data.songName;
      track.artist = data.singerId === 0 ? '未知' : data.singerName;
      track.artist_id = `kgartist_${data.singerId}`;
      if (data.album_img !== undefined) {
        track.img_url = data.album_img.replace('{size}', '400');
      } else {
        // track['img_url'] = data.imgUrl.replace('{size}', '400');
      }
      // Fix album
      target_url = `http://mobilecdnbj.kugou.com/api/v3/album/info?albumid=${item.album_id}`;
      axios.get(target_url).then((res) => {
        const { data: res_data } = res;
        if (
          res_data.status &&
          res_data.data !== undefined &&
          res_data.data !== null
        ) {
          track.album = res_data.data.albumname;
        } else {
          track.album = '';
        }
        return callback(null, track);
      });
    });
  }

  function kg_get_playlist(url) {
    // eslint-disable-line no-unused-vars
    return {
      success(fn) {
        const list_id = getParameterByName('list_id', url).split('_').pop();
        const target_url = `http://m.kugou.com/plist/list/${list_id}?json=true`;

        axios.get(target_url).then((response) => {
          const { data } = response;

          const info = {
            cover_img_url: data.info.list.imgurl
              ? data.info.list.imgurl.replace('{size}', '400')
              : '',
            title: data.info.list.specialname,
            id: `kgplaylist_${data.info.list.specialid}`,
            source_url: 'http://www.kugou.com/yy/special/single/{size}.html'.replace(
              '{size}',
              data.info.list.specialid
            ),
          };

          async_process_list(
            data.list.list.info,
            kg_render_playlist_result_item,
            [],
            (err, tracks) =>
              fn({
                tracks,
                info,
              })
          );
        });
      },
    };
  }

  function kg_render_artist_result_item(index, item, params, callback) {
    const info = params[0];
    const track = {
      id: `kgtrack_${item.hash}`,
      title: '',
      artist: '',
      artist_id: info.id,
      album: '',
      album_id: `kgalbum_${item.album_id}`,
      source: 'kugou',
      source_url: `http://www.kugou.com/song/#hash=${item.hash}&album_id=${item.album_id}`,
      img_url: '',
      // url: `kgtrack_${item.hash}`,
      lyric_url: item.hash,
    };
    const one = item.filename.split('-');
    track.title = one[1].trim();
    track.artist = one[0].trim();
    // Fix album name and img
    const target_url = `${'http://www.kugou.com/yy/index.php?r=play/getdata&hash='}${
      item.hash
    }`;
    axios
      .get(
        `http://mobilecdnbj.kugou.com/api/v3/album/info?albumid=${item.album_id}`
      )
      .then((response) => {
        const { data } = response;
        if (data.status && data.data !== undefined) {
          track.album = data.data.albumname;
        } else {
          track.album = '';
        }
        axios.get(target_url).then((res) => {
          track.img_url = res.data.data.img;
          callback(null, track);
        });
      });
  }

  function kg_artist(url) {
    // eslint-disable-line no-unused-vars
    return {
      success(fn) {
        const artist_id = getParameterByName('list_id', url).split('_').pop();
        let target_url = `http://mobilecdnbj.kugou.com/api/v3/singer/info?singerid=${artist_id}`;
        axios.get(target_url).then((response) => {
          const { data } = response;
          const info = {
            cover_img_url: data.data.imgurl.replace('{size}', '400'),
            title: data.data.singername,
            id: `kgartist_${artist_id}`,
            source_url: 'http://www.kugou.com/singer/{id}.html'.replace(
              '{id}',
              artist_id
            ),
          };
          target_url = `http://mobilecdnbj.kugou.com/api/v3/singer/song?singerid=${artist_id}&page=1&pagesize=30`;
          axios.get(target_url).then((res) => {
            async_process_list(
              res.data.data.info,
              kg_render_artist_result_item,
              [info],
              (err, tracks) =>
                fn({
                  tracks,
                  info,
                })
            );
          });
        });
      },
    };
  }

  function getTimestampString() {
    return new Date().getTime().toString();
  }

  function getRandomIntString() {
    return (Math.random() * 100).toString().replace(/\D/g, '');
  }

  function getRandomHexString() {
    let result = '';
    const letters = '0123456789abcdef';
    for (let i = 0; i < 16; i += 1) {
      result += letters[Math.floor(Math.random() * 16)];
    }
    return result;
  }

  function kg_bootstrap_track(track, success, failure) {
    const track_id = track.id.slice('kgtrack_'.length);
    const album_id = track.album_id.slice('kgalbum_'.length);
    const target_url = `https://wwwapi.kugou.com/yy/index.php?r=play/getdata&callback=jQuery&hash=${track_id}&dfid=dfid&mid=mid&platid=4&album_id=${album_id}`;

    axios.get(target_url).then((response) => {
      const { data } = response;
      const jsonString = data.slice('jQuery('.length, data.length - 1 - 1);
      const info = JSON.parse(jsonString);
      const { play_url } = info.data;

      if (play_url === '') {
        return failure({});
      }

      return success({
        url: play_url,
        bitrate: `${info.data.bitrate}kbps`,
        platform: 'kugou',
      });
    });
  }

  function kg_lyric(url) {
    // eslint-disable-line no-unused-vars
    const track_id = getParameterByName('track_id', url).split('_').pop();
    const album_id = getParameterByName('album_id', url).split('_').pop();
    const lyric_url = `https://wwwapi.kugou.com/yy/index.php?r=play/getdata&callback=jQuery&hash=${track_id}&dfid=dfid&mid=mid&platid=4&album_id=${album_id}`;

    return {
      success(fn) {
        axios.get(lyric_url).then((response) => {
          const { data } = response;
          const jsonString = data.slice('jQuery('.length, data.length - 1 - 1);
          const info = JSON.parse(jsonString);
          return fn({
            lyric: info.data.lyrics,
          });
        });
      },
    };
  }

  function kg_render_album_result_item(index, item, params, callback) {
    const info = params[0];
    const album_id = params[1];
    const track = {
      id: `kgtrack_${item.hash}`,
      title: '',
      artist: '',
      artist_id: '',
      album: info.title,
      album_id: `kgalbum_${album_id}`,
      source: 'kugou',
      source_url: `http://www.kugou.com/song/#hash=${item.hash}&album_id=${album_id}`,
      img_url: '',
      // url: `xmtrack_${item.hash}`,
      lyric_url: item.hash,
    };
    // Fix other data
    const target_url = `${'http://m.kugou.com/app/i/getSongInfo.php?cmd=playInfo&hash='}${
      item.hash
    }`;
    axios.get(target_url).then((response) => {
      const { data } = response;
      track.title = data.songName;
      track.artist = data.singerId === 0 ? '未知' : data.singerName;
      track.artist_id = `kgartist_${data.singerId}`;
      track.img_url = data.imgUrl.replace('{size}', '400');
      callback(null, track);
    });
  }

  function kg_album(url) {
    // eslint-disable-line no-unused-vars
    return {
      success(fn) {
        const album_id = getParameterByName('list_id', url).split('_').pop();
        let target_url = `${'http://mobilecdnbj.kugou.com/api/v3/album/info?albumid='}${album_id}`;

        let info;
        // info
        axios.get(target_url).then((response) => {
          const { data } = response;

          info = {
            cover_img_url: data.data.imgurl.replace('{size}', '400'),
            title: data.data.albumname,
            id: `kgalbum_${data.data.albumid}`,
            source_url: 'http://www.kugou.com/album/{id}.html'.replace(
              '{id}',
              data.data.albumid
            ),
          };

          target_url = `${'http://mobilecdnbj.kugou.com/api/v3/album/song?albumid='}${album_id}&page=1&pagesize=-1`;
          axios.get(target_url).then((res) => {
            async_process_list(
              res.data.data.info,
              kg_render_album_result_item,
              [info, album_id],
              (err, tracks) =>
                fn({
                  tracks,
                  info,
                })
            );
          });
        });
      },
    };
  }

  function kg_show_playlist(url) {
    let offset = getParameterByName('offset', url);
    if (offset === undefined) {
      offset = 0;
    }
    // const page = offset / 30 + 1;
    const target_url = `${'http://m.kugou.com/plist/index&json=true&page='}${offset}`;
    return {
      success(fn) {
        axios.get(target_url).then((response) => {
          const { data } = response;
          // const total = data.plist.total;
          const result = data.plist.list.info.map((item) => ({
            cover_img_url: item.imgurl
              ? item.imgurl.replace('{size}', '400')
              : '',
            title: item.specialname,
            id: `kgplaylist_${item.specialid}`,
            source_url: 'http://www.kugou.com/yy/special/single/{size}.html'.replace(
              '{size}',
              item.specialid
            ),
          }));
          return fn({
            result,
          });
        });
      },
    };
  }

  function kg_parse_url(url) {
    let result;
    const match = /\/\/www.kugou.com\/yy\/special\/single\/([0-9]+).html/.exec(
      url
    );
    if (match != null) {
      const playlist_id = match[1];
      result = {
        type: 'playlist',
        id: `kgplaylist_${playlist_id}`,
      };
    }
    return result;
  }

  function get_playlist(url) {
    // eslint-disable-line no-unused-vars
    const list_id = getParameterByName('list_id', url).split('_')[0];
    switch (list_id) {
      case 'kgplaylist':
        return kg_get_playlist(url);
      case 'kgalbum':
        return kg_album(url);
      case 'kgartist':
        return kg_artist(url);
      default:
        return null;
    }
  }

  function get_playlist_filters() {
    return {
      success(fn) {
        return fn({ recommend: [], all: [] });
      },
    };
  }

  return {
    show_playlist: kg_show_playlist,
    get_playlist_filters,
    get_playlist,
    parse_url: kg_parse_url,
    bootstrap_track: kg_bootstrap_track,
    search: kg_search,
    lyric: kg_lyric,
  };
}

const kugou = build_kugou(); // eslint-disable-line no-unused-vars
