/* global getParameterByName */
function build_bilibili() {
  function bi_convert_song(song_info) {
    const track = {
      id: `bitrack_${song_info.id}`,
      title: song_info.title,
      artist: song_info.uname,
      artist_id: `biartist_${song_info.uid}`,
      source: 'bilibili',
      source_url: `https://www.bilibili.com/audio/au${song_info.id}`,
      img_url: song_info.cover,
      url: song_info.id,
      lyric_url: song_info.lyric,
    };
    return track;
  }

  function bi_show_playlist(url, hm) {
    let offset = getParameterByName('offset', url);
    if (offset === undefined) {
      offset = 0;
    }
    const page = offset / 20 + 1;
    const target_url = `https://www.bilibili.com/audio/music-service-c/web/menu/hit?ps=20&pn=${page}`;
    return {
      success(fn) {
        hm.get(target_url).then((response) => {
          const { data } = response.data.data;
          const result = data.map(item => ({
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

  function bi_get_playlist(url, hm, se) { // eslint-disable-line no-unused-vars
    const list_id = getParameterByName('list_id', url).split('_').pop();
    const target_url = `https://www.bilibili.com/audio/music-service-c/web/menu/info?sid=${list_id}`;
    return {
      success: (fn) => {
        hm.get(target_url).then((response) => {
          const { data } = response.data;
          const info = {
            cover_img_url: data.cover,
            title: data.title,
            id: `biplaylist_${list_id}`,
            source_url: `https://www.bilibili.com/audio/am${list_id}`,
          };
          const target = `https://www.bilibili.com/audio/music-service-c/web/song/of-menu?pn=1&ps=100&sid=${list_id}`;
          hm.get(target).then((res) => {
            const tracks = res.data.data.data.map(item => bi_convert_song(item));
            return fn({
              info,
              tracks,
            });
          });
        });
      },
    };
  }
  function bi_album(url, hm, se) { // eslint-disable-line no-unused-vars
    return {
      success: fn => fn({
        tracks: [],
        info: {},
      }),
      // bilibili havn't album
      // const album_id = getParameterByName('list_id', url).split('_').pop();
      // const target_url = '';
      // hm.get(target_url).then((response) => {
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
  function bi_artist(url, hm, se) { // eslint-disable-line no-unused-vars
    return {
      success: (fn) => {
        const artist_id = getParameterByName('list_id', url).split('_').pop();
        let target_url = 'https://space.bilibili.com/ajax/member/GetInfo';
        hm.post(target_url, new URLSearchParams({
          mid: artist_id,
        }).toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
          .then((response) => {
            const { data } = response.data;
            const info = {
              cover_img_url: data.face,
              title: data.name,
              id: `biartist_${artist_id}`,
              source_url: `https://space.bilibili.com/${artist_id}/#/audio`,
            };
            target_url = `https://api.bilibili.com/audio/music-service-c/web/song/upper?pn=1&ps=0&order=2&uid=${artist_id}`;
            hm.get(target_url).then((res) => {
              const tracks = res.data.data.data.map(item => bi_convert_song(item));
              return fn({
                tracks,
                info,
              });
            });
          });
      },
    };
  }
  function bi_parse_url(url) {
    let result;
    const match = /\/\/www.bilibili.com\/audio\/am([0-9]+)/.exec(url);
    if (match != null) {
      const playlist_id = match[1];
      result = {
        type: 'playlist',
        id: `biplaylist_${playlist_id}`,
      };
    }
    return result;
  }
  // eslint-disable-next-line no-unused-vars
  function bi_bootstrap_track(sound, track, success, failure, hm, se) {
    const song_id = track.id.slice('bitrack_'.length);
    const target_url = `https://www.bilibili.com/audio/music-service-c/web/url?sid=${song_id}`;
    hm.get(target_url).then((response) => {
      const { data } = response;
      if (data.code === 0) {
        [sound.url] = data.data.cdns; // eslint-disable-line no-param-reassign
        success();
      } else {
        failure();
      }
    });
  }
  function bi_search(url, hm, se) { // eslint-disable-line no-unused-vars
    return {
      success: (fn) => {
        const keyword = getParameterByName('keywords', url);
        const curpage = getParameterByName('curpage', url);
        const au = /\d+$/.exec(keyword);
        if (au != null) {
          const target_url = `https://www.bilibili.com/audio/music-service-c/web/song/info?sid=${au}`;
          hm.get(target_url).then((response) => {
            const { data } = response.data;
            const tracks = [bi_convert_song(data)];
            return fn({
              result: tracks,
              total: 1,
            });
          });
        } else {
          return fn({
            result: [],
            total: 0,
          });
        }
        // inferred, not implemented yet
        const target_url = `https://api.bilibili.com/x/web-interface/search/type?search_type=audio&keyword=${keyword}&page=${curpage}`;
        hm.get(target_url).then((response) => {
          const { data } = response.data;
          const tracks = data.result.map(item => bi_convert_song(item));
          return fn({
            result: tracks,
            total: data.numResults,
          });
        });
        return null;
      },
    };
  }
  function bi_lyric(url, hm, se) { // eslint-disable-line no-unused-vars
    // const track_id = getParameterByName('track_id', url).split('_').pop();
    const lyric_url = getParameterByName('lyric_url', url);
    return {
      success(fn) {
        hm.get(lyric_url).then((response) => {
          const { data } = response;
          return fn({
            lyric: data,
          });
        });
      },
    };
  }

  function get_playlist(url, hm, se) {
    const list_id = getParameterByName('list_id', url).split('_')[0];
    switch (list_id) {
      case 'biplaylist':
        return bi_get_playlist(url, hm, se);
      case 'bialbum':
        return bi_album(url, hm, se);
      case 'biartist':
        return bi_artist(url, hm, se);
      default:
        return null;
    }
  }

  return {
    show_playlist: bi_show_playlist,
    get_playlist,
    parse_url: bi_parse_url,
    bootstrap_track: bi_bootstrap_track,
    search: bi_search,
    lyric: bi_lyric,
  };
}

const bilibili = build_bilibili(); // eslint-disable-line no-unused-vars
