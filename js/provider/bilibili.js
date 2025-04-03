let wbi_key = null;
/* global getParameterByName */
// eslint-disable-next-line no-unused-vars
/* global cookieSet cookieGet */
// eslint-disable-next-line no-unused-vars
class bilibili {
  static htmlDecode(value) {
    const parser = new DOMParser();
    return parser.parseFromString(value, 'text/html').body.textContent;
  }

  static fetch_wbi_key() {
    return axios({
      url: 'https://api.bilibili.com/x/web-interface/nav',
      method: 'get',
      responseType: 'json',
    }).then((resp) => {
      const json_content = resp.data;
      const { img_url } = json_content.data.wbi_img;
      const { sub_url } = json_content.data.wbi_img;
      return {
        img_key: img_url.slice(
          img_url.lastIndexOf('/') + 1,
          img_url.lastIndexOf('.')
        ),
        sub_key: sub_url.slice(
          sub_url.lastIndexOf('/') + 1,
          sub_url.lastIndexOf('.')
        ),
      };
    });
  }

  static clear_wbi_key() {
    wbi_key = null;
  }

  static get_wbi_key() {
    if (wbi_key) {
      return Promise.resolve(wbi_key);
    }
    return bilibili.fetch_wbi_key().then((key) => {
      wbi_key = key;
      return key;
    });
  }

  static enc_wbi(params) {
    return bilibili.get_wbi_key().then(({ img_key, sub_key }) => {
      const mixinKeyEncTab = [
        46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5,
        49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24,
        55, 40, 61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63,
        57, 62, 11, 36, 20, 34, 44, 52,
      ];

      // 对 imgKey 和 subKey 进行字符顺序打乱编码
      function get_mixin_key(original) {
        let temp = '';
        mixinKeyEncTab.forEach((n) => {
          temp += original[n];
        });
        return temp.slice(0, 32);
      }

      const mixin_key = get_mixin_key(img_key + sub_key);
      const curr_time = Math.round(Date.now() / 1000);
      const chr_filter = /[!'()*]/g;
      const query = [];
      Object.assign(params, { wts: curr_time }); // 添加 wts 字段
      // 按照 key 重排参数
      Object.keys(params)
        .sort()
        .forEach((key) => {
          query.push(
            `${encodeURIComponent(key)}=${encodeURIComponent(
              // 过滤 value 中的 "!'()*" 字符
              params[key].toString().replace(chr_filter, '')
            )}`
          );
        });
      const query_string = query.join('&');
      const wbi_sign = window.forge.md5
        .create()
        .update(window.forge.util.encodeUtf8(query_string + mixin_key))
        .digest()
        .toHex();
      return `${query_string}&w_rid=${wbi_sign}`;
    });
  }

  static wrap_wbi_request(url, params) {
    return bilibili
      .enc_wbi(params)
      .then((query_string) => {
        const target_url = `${url}?${query_string}`;
        return axios.get(target_url);
      })
      .catch(() => {
        // 失败时进行一次清空 wbi_key 后的重试，避免因为 wbi_key 过期导致的错误
        bilibili.clear_wbi_key();
        return bilibili
          .enc_wbi(params)
          .then((query_string) => {
            const target_url = `${url}?${query_string}`;
            return axios.get(target_url);
          })
          .catch(() => undefined);
      });
  }

  static bi_convert_song(song_info) {
    const track = {
      id: `bitrack_${song_info.id}`,
      title: song_info.title,
      artist: song_info.uname,
      artist_id: `biartist_${song_info.uid}`,
      source: 'bilibili',
      source_url: `https://www.bilibili.com/audio/au${song_info.id}`,
      img_url: song_info.cover,
      // url: song_info.id,
      lyric_url: song_info.lyric,
    };
    return track;
  }

  static bi_convert_song2(song_info) {
    let imgUrl = song_info.pic;
    if (imgUrl.startsWith('//')) {
      imgUrl = `https:${imgUrl}`;
    }
    const track = {
      id: `bitrack_v_${song_info.bvid}`,
      title: this.htmlDecode(song_info.title),
      artist: this.htmlDecode(song_info.author),
      artist_id: `biartist_v_${song_info.mid}`,
      source: 'bilibili',
      source_url: `https://www.bilibili.com/${song_info.bvid}`,
      img_url: imgUrl,
    };
    return track;
  }

  static show_playlist(url) {
    let offset = getParameterByName('offset', url);
    if (offset === undefined) {
      offset = 0;
    }
    const page = offset / 20 + 1;
    const target_url = `https://www.bilibili.com/audio/music-service-c/web/menu/hit?ps=20&pn=${page}`;
    return {
      success: (fn) => {
        axios.get(target_url).then((response) => {
          const { data } = response.data.data;
          const result = data.map((item) => ({
            cover_img_url: item.cover,
            title: item.title,
            id: `biplaylist_${item.menuId}`,
            source_url: `https://www.bilibili.com/audio/am${item.menuId}`,
          }));
          return fn({
            result,
          });
        });
      },
    };
  }

  static bi_get_playlist(url) {
    const list_id = getParameterByName('list_id', url).split('_').pop();
    const target_url = `https://www.bilibili.com/audio/music-service-c/web/menu/info?sid=${list_id}`;
    return {
      success: (fn) => {
        axios.get(target_url).then((response) => {
          const { data } = response.data;
          const info = {
            cover_img_url: data.cover,
            title: data.title,
            id: `biplaylist_${list_id}`,
            source_url: `https://www.bilibili.com/audio/am${list_id}`,
          };
          const target = `https://www.bilibili.com/audio/music-service-c/web/song/of-menu?pn=1&ps=100&sid=${list_id}`;
          axios.get(target).then((res) => {
            const tracks = res.data.data.data.map((item) =>
              this.bi_convert_song(item)
            );
            return fn({
              info,
              tracks,
            });
          });
        });
      },
    };
  }

  // eslint-disable-next-line no-unused-vars
  static bi_album(url) {
    return {
      success: (fn) =>
        fn({
          tracks: [],
          info: {},
        }),
      // bilibili havn't album
      // const album_id = getParameterByName('list_id', url).split('_').pop();
      // const target_url = '';
      // axios.get(target_url).then((response) => {
      //   const data = response.data;
      //   const info = {};
      //   const tracks = [];
      //   return fn({
      //     tracks,
      //     info,
      //   });
      // });
    };
  }

  static bi_track(url) {
    const track_id = getParameterByName('list_id', url).split('_').pop();
    return {
      success: (fn) => {
        const target_url = `https://api.bilibili.com/x/web-interface/view?bvid=${track_id}`;
        axios.get(target_url).then((response) => {
          const info = {
            cover_img_url: response.data.data.pic,
            title: response.data.data.title,
            id: `bitrack_v_${track_id}`,
            source_url: `https://www.bilibili.com/${track_id}`,
          };
          const author = response.data.data.owner;
          const default_img = response.data.data.pic;
          const tracks = response.data.data.pages.map((item) =>
            this.bi_convert_song3(item, track_id, author, default_img)
          );
          return fn({
            tracks,
            info,
          });
        });
      },
    };
  }

  static bi_convert_song3(song_info, bvid, author, default_img) {
    let imgUrl = song_info.first_frame;
    if (imgUrl === undefined) {
      imgUrl = default_img;
    } else if (imgUrl.startsWith('//')) {
      imgUrl = `https:${imgUrl}`;
    }
    const track = {
      id: `bitrack_v_${bvid}-${song_info.cid}`,
      title: this.htmlDecode(song_info.part),
      artist: this.htmlDecode(author.name),
      artist_id: `biartist_v_${author.mid}`,
      source: 'bilibili',
      source_url: `https://www.bilibili.com/${bvid}/?p=${song_info.page}`,
      img_url: imgUrl,
    };
    return track;
  }

  static bi_artist(url) {
    const artist_id = getParameterByName('list_id', url).split('_').pop();

    return {
      success: (fn) => {
        let target_url;
        bilibili
          .wrap_wbi_request('https://api.bilibili.com/x/space/wbi/acc/info', {
            mid: artist_id,
          })
          .then((response) => {
            const info = {
              cover_img_url: response.data.data.face,
              title: response.data.data.name,
              id: `biartist_${artist_id}`,
              source_url: `https://space.bilibili.com/${artist_id}/#/audio`,
            };
            if (getParameterByName('list_id', url).split('_').length === 3) {
              return bilibili
                .wrap_wbi_request(
                  'https://api.bilibili.com/x/space/wbi/arc/search',
                  {
                    mid: artist_id,
                    pn: 1,
                    ps: 25,
                    order: 'click',
                    index: 1,
                  }
                )
                .then((res) => {
                  const tracks = res.data.data.list.vlist.map((item) =>
                    this.bi_convert_song2(item)
                  );
                  return fn({
                    tracks,
                    info,
                  });
                });
            }
            target_url = `https://api.bilibili.com/audio/music-service-c/web/song/upper?pn=1&ps=0&order=2&uid=${artist_id}`;
            return axios.get(target_url).then((res) => {
              const tracks = res.data.data.data.map((item) =>
                this.bi_convert_song(item)
              );
              return fn({
                tracks,
                info,
              });
            });
          });
      },
    };
  }

  static parse_url(url) {
    let result;
    const match = /\/\/www.bilibili.com\/audio\/am([0-9]+)/.exec(url);
    if (match != null) {
      const playlist_id = match[1];
      result = {
        type: 'playlist',
        id: `biplaylist_${playlist_id}`,
      };
    }
    return {
      success: (fn) => {
        fn(result);
      },
    };
  }

  static bootstrap_track(track, success, failure) {
    const trackId = track.id;
    if (trackId.startsWith('bitrack_v_')) {
      const sound = {};
      let bvid = track.id.slice('bitrack_v_'.length);

      const trackIdCheck = trackId.split('-');
      if (trackIdCheck.length > 1) {
        bvid = trackIdCheck[0].slice('bitrack_v_'.length);
      }
      const target_url = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
      return axios.get(target_url).then((response) => {
        let { cid } = response.data.data.pages[0];
        if (trackIdCheck.length > 1) {
          [, cid] = trackIdCheck;
        }
        const target_url2 = `http://api.bilibili.com/x/player/playurl?fnval=16&bvid=${bvid}&cid=${cid}`;
        axios.get(target_url2).then((response2) => {
          if (response2.data.data.dash.audio.length > 0) {
            const url = response2.data.data.dash.audio[0].baseUrl;
            sound.url = url;
            sound.platform = 'bilibili';
            success(sound);
          } else {
            failure(sound);
          }
        });
      });
    }
    const sound = {};
    const song_id = track.id.slice('bitrack_'.length);
    const target_url = `https://www.bilibili.com/audio/music-service-c/web/url?sid=${song_id}`;
    return axios.get(target_url).then((response) => {
      const { data } = response;
      if (data.code === 0) {
        [sound.url] = data.data.cdns;
        sound.platform = 'bilibili';

        success(sound);
      } else {
        failure(sound);
      }
    });
  }

  static search(url) {
    return {
      success: (fn) => {
        const keyword = getParameterByName('keywords', url);
        const curpage = getParameterByName('curpage', url);

        const target_url = `https://api.bilibili.com/x/web-interface/search/type?__refresh__=true&_extra=&context=&page=${curpage}&page_size=42&platform=pc&highlight=1&single_column=0&keyword=${encodeURIComponent(
          keyword
        )}&category_id=&search_type=video&dynamic_offset=0&preload=true&com2co=true`;

        const domain = `https://api.bilibili.com`;
        const cookieName = 'buvid3';
        const expire =
          (new Date().getTime() + 1e3 * 60 * 60 * 24 * 365 * 100) / 1000;

        cookieSet(
          {
            url: domain,
            name: cookieName,
            value: '0',
            expirationDate: expire,
            sameSite: 'no_restriction',
          },
          () => {
            axios
              .get(target_url, { withCredentials: true })
              .then((response) => {
                const result = response.data.data.result.map((song) =>
                  this.bi_convert_song2(song)
                );
                const total = response.data.data.numResults;
                return fn({
                  result,
                  total,
                });
              });
          }
        );
      },
    };
  }

  static lyric() {
    return {
      success: (fn) => {
        fn({
          lyric: '',
        });
      },
    };
  }

  static get_playlist(url) {
    const list_id = getParameterByName('list_id', url).split('_')[0];
    switch (list_id) {
      case 'biplaylist':
        return this.bi_get_playlist(url);
      case 'bialbum':
        return this.bi_album(url);
      case 'biartist':
        return this.bi_artist(url);
      case 'bitrack':
        return this.bi_track(url);
      default:
        return null;
    }
  }

  static get_playlist_filters() {
    return {
      success: (fn) => fn({ recommend: [], all: [] }),
    };
  }

  static get_user() {
    return {
      success: (fn) => fn({ status: 'fail', data: {} }),
    };
  }

  static get_login_url() {
    return `https://www.bilibili.com`;
  }

  static logout() {}

  // return {
  //   show_playlist: bi_show_playlist,
  //   get_playlist_filters,
  //   get_playlist,
  //   parse_url: bi_parse_url,
  //   bootstrap_track: bi_bootstrap_track,
  //   search: bi_search,
  //   lyric: bi_lyric,
  //   get_user: bi_get_user,
  //   get_login_url: bi_get_login_url,
  //   logout: bi_logout,
  // };
}
