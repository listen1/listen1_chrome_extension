/* eslint-disable no-unused-vars */
/* global async getParameterByName forge */
function build_taihe() {
  const axiosTH = axios.create({
    baseURL: 'https://music.taihe.com/v1',
  });
  axiosTH.interceptors.request.use((config) => {
    const params = {...config.params};
    params.timestamp = Math.round(Date.now() / 1000);
    params.appid = '16073360';
    const q = new URLSearchParams(params);
    q.sort();
    const signStr = decodeURIComponent(`${q.toString()}0b50b02fd0d73a9c4c8c3a781c30845f`);
    params.sign = forge.md5.create().update(forge.util.encodeUtf8(signStr)).digest().toHex();
    
    return {...config, params};
  }, null, { synchronous: true });


  function th_convert_song(song) {
    const track = {
      id: `thtrack_${song.id}`,
      title: song.title,
      album: song.albumTitle,
      album_id: `thalbum_${song.albumAssetCode}`,
      source: 'taihe',
      source_url: `https://music.taihe.com/song/${song.id}`,
      img_url: song.pic,
      lyric_url: song.lyric,
    };
    if (song.artist && song.artist.length) {
      track.artist = song.artist[0].name;
      track.artist_id = song.artist[0].artistCode;
    }
    return track;
  }

  function th_search(url) {
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
        axiosTH.get('/search', {
          params: {
            word: keyword,
            pageNo: curpage || 1,
            type: 1,
          },
        }).then((res) => {
          const { data } = res;
          const tracks = data.data.typeTrack.map(th_convert_song);
          return fn({
            result: tracks,
            total: data.data.total,
            type: searchType,
          })
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

  function th_get_playlist(url) {
    const list_id = getParameterByName('list_id', url).split('_').pop();

    return {
      success: (fn) => {
        axiosTH.get('/tracklist/info', {
          params: {
            id: list_id,
          },
        }).then((response) => {
          const { data } = response.data;
    
          const info = {
            cover_img_url: data.pic,
            title: data.title,
            id: `thplaylist_${list_id}`,
            source_url: `https://music.taihe.com/songlist/${list_id}`,
          };
    
          const tracks = data.trackList.map(th_convert_song);
          return fn({
            tracks,
            info,
          });
        });
      }
    };
  }

  function th_artist(url) {
    // eslint-disable-line no-unused-vars
    return {
      success(fn) {
        const artist_id = getParameterByName('list_id', url).split('_').pop();
        Promise.all([
          axiosTH.get('/artist/info', {
            params: {
              artistCode: artist_id,
            },
          }),
          axiosTH.get('/artist/song', {
            params: {
              artistCode: artist_id,
              pageSize: 50,
            },
          }),
        ]).then((infoRes, songsRes) => {
          const infoData = infoRes.data.data;
          const songData = songsRes.data.data;
          const info = {
            cover_img_url: infoData.pic,
            title: infoData.name,
            id: `thartist_${artist_id}`,
            source_url: `https://music.taihe.com/artist/${artist_id}`,
          };

          const tracks = songData.result.map(th_convert_song);
          return fn({
            tracks,
            info,
          });
        });
      },
    };
  }

  function th_bootstrap_track(sound, track, success, failure) {
    const song_id = track.id.slice('thtrack_'.length);

    axiosTH.get('/song/tracklink', {
      params: {
        TSID: song_id
      }
    }).then((response) => {
      axios.get(response.data.data.lyric).then((res) => {
        const { data } = res;
        if (data.path) {
          sound.url = data.path; // eslint-disable-line no-param-reassign
          success();
        } else {
          failure();
        }
      });
    });
  }

  function th_lyric(url) {
    // eslint-disable-line no-unused-vars
    const track_id = getParameterByName('track_id', url).split('_').pop();

    return {
      success(fn) {
        axiosTH.get('/song/tracklink', {
          params: {
            TSID: track_id
          }
        }).then((response) => {
          axios.get(response.data.data.lyric).then((res) => fn({
            lyric: res.data,
          }));
        });
      },
    };
  }

  function th_album(url) {
    // eslint-disable-line no-unused-vars
    return {
      success(fn) {
        const album_id = getParameterByName('list_id', url).split('_').pop();

        Promise.all([axiosTH.get('/album/info', {
          params: {
            albumAssetCode: album_id,
          }
        }),
        axiosTH.get('/album/song', {
          params: {
            albumAssetCode: album_id,
            pageNo: 50,
          }
        })]).then(([infoRes, songRes]) => {

          const infoData = infoRes.data.data;
          const songData = songRes.data.data;
          const info = {
            cover_img_url: infoData.pic,
            title: infoData.title,
            id: `thalbum_${album_id}`,
            source_url: `https://music.taihe.com/ablum/${album_id}`,
          };

          const tracks = songData.result.map(th_convert_song);
          return fn({
            tracks,
            info,
          });
        });
      },
    };
  }

  function th_show_playlist(url) {
    const offset = Number(getParameterByName('offset', url));
    const subCate = getParameterByName('filter_id', url);

    return {
      success(fn) {

        axiosTH.get('/tracklist/list', {
          params: {
            pageNo: offset,
            pageSize: 50,
            subCateId: subCate,
          }
        }).then((response) => {
          const { data } = response;

          const playlists = data.data.result.map((item) => ({
            cover_img_url: item.pic,
            title: item.title,
            id: `thplaylist_${item.id}`,
            source_url: `https://music.taihe.com/songlist/${item.id}`,
          }));

          return fn({
            result: playlists,
          });
        });
      },
    };
  }

  function th_parse_url(url) {
    return undefined;
  }

  function get_playlist(url) {
    // eslint-disable-line no-unused-vars
    const list_id = getParameterByName('list_id', url).split('_')[0];
    switch (list_id) {
      case 'thplaylist':
        return th_get_playlist(url);
      case 'thalbum':
        return th_album(url);
      case 'thartist':
        return th_artist(url);
      default:
        return null;
    }
  }

  function get_playlist_filters() {
    return {
      success(fn) {
        axiosTH.get('/tracklist/category').then((res) => fn({
          recommend: [{ id: '', name: '推荐歌单' }],
          all: res.data.data.map((sub) => ({
            category: sub.categoryName,
            filters: sub.subCate.map(i => ({
              id: i.id,
              name: i.categoryName,
            })),
          })),
        }));
      },
    };
  }

  return {
    show_playlist: th_show_playlist,
    get_playlist_filters,
    get_playlist,
    parse_url: th_parse_url,
    bootstrap_track: th_bootstrap_track,
    search: th_search,
    lyric: th_lyric,
  };
}

const taihe = build_taihe(); // eslint-disable-line no-unused-vars
