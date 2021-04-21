/* eslint-disable no-unused-vars */
/* global async getParameterByName forge */
const axiosTH = axios.create({
  baseURL: 'https://music.taihe.com/v1',
});
axiosTH.interceptors.request.use(
  (config) => {
    const params = { ...config.params };
    params.timestamp = Math.round(Date.now() / 1000);
    params.appid = '16073360';
    const q = new URLSearchParams(params);
    q.sort();
    const signStr = decodeURIComponent(
      `${q.toString()}0b50b02fd0d73a9c4c8c3a781c30845f`
    );
    params.sign = forge.md5
      .create()
      .update(forge.util.encodeUtf8(signStr))
      .digest()
      .toHex();

    return { ...config, params };
  },
  null,
  { synchronous: true }
);

class taihe {
  static th_convert_song(song) {
    const track = {
      id: `thtrack_${song.id}`,
      title: song.title,
      album: song.albumTitle,
      album_id: `thalbum_${song.albumAssetCode}`,
      source: 'taihe',
      source_url: `https://music.taihe.com/song/${song.id}`,
      img_url: song.pic,
      lyric_url: song.lyric || '',
    };
    if (song.artist && song.artist.length) {
      track.artist = song.artist[0].name;
      track.artist_id = `thartist_${song.artist[0].artistCode}`;
    }
    return track;
  }

  static th_render_tracks(url, page, callback) {
    const list_id = getParameterByName('list_id', url).split('_').pop();
    axiosTH
      .get('/tracklist/info', {
        params: {
          id: list_id,
          pageNo: page,
          pageSize: 100,
        },
      })
      .then((response) => {
        const data = response.data.data.trackList;
        const tracks = data.map(this.th_convert_song);
        return callback(null, tracks);
      });
  }

  static search(url) {
    const keyword = getParameterByName('keywords', url);
    const curpage = getParameterByName('curpage', url);
    const searchType = getParameterByName('type', url);
    if (searchType === '1') {
      return {
        success: (fn) =>
          fn({
            result: [],
            total: 0,
            type: searchType,
          }),
      };
    }
    return {
      success: (fn) => {
        axiosTH
          .get('/search', {
            params: {
              word: keyword,
              pageNo: curpage || 1,
              type: 1,
            },
          })
          .then((res) => {
            const { data } = res;
            const tracks = data.data.typeTrack.map(this.th_convert_song);
            return fn({
              result: tracks,
              total: data.data.total,
              type: searchType,
            });
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

  static th_get_playlist(url) {
    const list_id = getParameterByName('list_id', url).split('_').pop();

    return {
      success: (fn) => {
        axiosTH
          .get('/tracklist/info', {
            params: {
              id: list_id,
            },
          })
          .then((response) => {
            const { data } = response.data;

            const info = {
              cover_img_url: data.pic,
              title: data.title,
              id: `thplaylist_${list_id}`,
              source_url: `https://music.taihe.com/songlist/${list_id}`,
            };

            const total = data.trackCount;
            const page = Math.ceil(total / 100);
            const page_array = Array.from({ length: page }, (v, k) => k + 1);
            async.concat(
              page_array,
              (item, callback) => this.th_render_tracks(url, item, callback),
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

  static th_artist(url) {
    return {
      success: (fn) => {
        const artist_id = getParameterByName('list_id', url).split('_').pop();
        axiosTH
          .get('/artist/info', {
            params: {
              artistCode: artist_id,
            },
          })
          .then((response) => {
            const info = {
              cover_img_url: response.data.data.pic,
              title: response.data.data.name,
              id: `thartist_${artist_id}`,
              source_url: `https://music.taihe.com/artist/${artist_id}`,
            };
            axiosTH
              .get('/artist/song', {
                params: {
                  artistCode: artist_id,
                  pageNo: 1,
                  pageSize: 50,
                },
              })
              .then((res) => {
                const tracks = res.data.data.result.map(this.th_convert_song);
                return fn({
                  tracks,
                  info,
                });
              });
          });
      },
    };
  }

  static bootstrap_track(track, success, failure) {
    const sound = {};
    const song_id = track.id.slice('thtrack_'.length);
    axiosTH
      .get('/song/tracklink', {
        params: {
          TSID: song_id,
        },
      })
      .then((response) => {
        const { data } = response;
        if (data.data && data.data.path) {
          sound.url = data.data.path;
          sound.platform = 'taihe';
          sound.bitrate = `${data.data.rate}kbps`;

          success(sound);
        } else {
          failure(sound);
        }
      });
  }

  static lyric(url) {
    // eslint-disable-line no-unused-vars
    const lyric_url = getParameterByName('lyric_url', url);

    return {
      success: (fn) => {
        if (lyric_url) {
          axios.get(lyric_url).then((response) =>
            fn({
              lyric: response.data,
            })
          );
        } else {
          const track_id = getParameterByName('track_id', url).split('_').pop();
          axiosTH
            .get('/song/tracklink', {
              params: {
                TSID: track_id,
              },
            })
            .then((response) => {
              axios.get(response.data.data.lyric).then((res) =>
                fn({
                  lyric: res.data,
                })
              );
            });
        }
      },
    };
  }

  static th_album(url) {
    return {
      success: (fn) => {
        const album_id = getParameterByName('list_id', url).split('_').pop();

        axiosTH
          .get('/album/info', {
            params: {
              albumAssetCode: album_id,
            },
          })
          .then((response) => {
            const { data } = response.data;
            const info = {
              cover_img_url: data.pic,
              title: data.title,
              id: `thalbum_${album_id}`,
              source_url: `https://music.taihe.com/album/${album_id}`,
            };

            const tracks = data.trackList.map((song) => ({
              id: `thtrack_${song.assetId}`,
              title: song.title,
              artist: song.artist ? song.artist[0].name : '',
              artist_id: song.artist
                ? `thartist_${song.artist[0].artistCode}`
                : 'thartist_',
              album: info.title,
              album_id: `thalbum_${album_id}`,
              source: 'taihe',
              source_url: `https://music.taihe.com/song/${song.assetId}`,
              img_url: info.cover_img_url,
              lyric_url: '',
            }));
            return fn({
              tracks,
              info,
            });
          });
      },
    };
  }

  static show_playlist(url) {
    const offset = Number(getParameterByName('offset', url));
    const subCate = getParameterByName('filter_id', url);
    return {
      success: (fn) => {
        axiosTH
          .get('/tracklist/list', {
            params: {
              pageNo: offset / 25 + 1,
              pageSize: 25,
              subCateId: subCate,
            },
          })
          .then((response) => {
            const { data } = response.data;
            const result = data.result.map((item) => ({
              cover_img_url: item.pic,
              title: item.title,
              id: `thplaylist_${item.id}`,
              source_url: `https://music.taihe.com/songlist/${item.id}`,
            }));

            return fn({
              result,
            });
          });
      },
    };
  }

  static parse_url(url) {
    let result;
    let id = '';
    let match = /\/\/music.taihe.com\/([a-z]+)\//.exec(url);
    if (match) {
      switch (match[1]) {
        case 'songlist':
          match = /\/\/music.taihe.com\/songlist\/([0-9]+)/.exec(url);
          id = match ? `thplaylist_${match[1]}` : '';
          break;
        case 'artist':
          match = /\/\/music.taihe.com\/artist\/(A[0-9]+)/.exec(url);
          id = match ? `thartist_${match[1]}` : '';
          break;
        case 'album':
          match = /\/\/music.taihe.com\/album\/(P[0-9]+)/.exec(url);
          id = match ? `thalbum_${match[1]}` : '';
          break;
        default:
          break;
      }
      result = {
        type: 'playlist',
        id,
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
      case 'thplaylist':
        return this.th_get_playlist(url);
      case 'thalbum':
        return this.th_album(url);
      case 'thartist':
        return this.th_artist(url);
      default:
        return null;
    }
  }

  static get_playlist_filters() {
    return {
      success: (fn) => {
        axiosTH.get('/tracklist/category').then((res) =>
          fn({
            recommend: [{ id: '', name: '推荐歌单' }],
            all: res.data.data.map((sub) => ({
              category: sub.categoryName,
              filters: sub.subCate.map((i) => ({
                id: i.id,
                name: i.categoryName,
              })),
            })),
          })
        );
      },
    };
  }

  static get_user() {
    return {
      success: (fn) => {
        fn({ status: 'fail', data: {} });
      },
    };
  }

  static get_login_url() {
    return `https://music.taihe.com`;
  }

  static logout() {}
}
