/* eslint-disable radix */
/* eslint-disable no-use-before-define */
/* global getParameterByName */
/* eslint-disable no-param-reassign */
function build_xiami() {
  function xm_show_playlist() {
    return {
      success(fn) {
        return fn({
          result: [],
        });
      },
    };
  }

  // eslint-disable-next-line no-unused-vars
  function xm_bootstrap_track(track, success, failure) {
    const sound = {};
    failure(sound);
  }

  function xm_get_playlist(url) {
    // eslint-disable-line no-unused-vars
    const list_id = getParameterByName('list_id', url).split('_').pop();
    return {
      success(fn) {
        return fn({
          tracks: [],
          info: {
            cover_img_url: '',
            title: '',
            id: `xmplaylist_${list_id}`,
            source_url: `https://www.xiami.com/collect/${list_id}`,
          },
        });
      },
    };
  }

  function xm_search(url) {
    const searchType = getParameterByName('type', url);

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

  function xm_album(url) {
    // eslint-disable-line no-unused-vars
    return {
      success(fn) {
        const album_id = getParameterByName('list_id', url).split('_').pop();

        return fn({
          tracks: [],
          info: {
            cover_img_url: '',
            title: album_id,
            id: `xmalbum_${album_id}`,
            source_url: `https://www.xiami.com/album/${album_id}`,
          },
        });
      },
    };
  }

  function xm_artist(url) {
    // eslint-disable-line no-unused-vars
    return {
      success(fn) {
        const artist_id = getParameterByName('list_id', url).split('_').pop();

        return fn({
          tracks: [],
          info: {
            cover_img_url: '',
            title: artist_id,
            id: `xmartist_${artist_id}`,
            source_url: `https://www.xiami.com/artist/${artist_id}`,
          },
        });
      },
    };
  }

  function xm_lyric() {
    return {
      // eslint-disable-next-line consistent-return
      success(fn) {
        return fn({
          lyric: '',
          tlyric: '',
        });
      },
    };
  }

  function xm_parse_url() {
    let result;
    return result;
  }

  function get_playlist(url) {
    const list_id = getParameterByName('list_id', url).split('_')[0];
    switch (list_id) {
      case 'xmplaylist':
        return xm_get_playlist(url);
      case 'xmalbum':
        return xm_album(url);
      case 'xmartist':
        return xm_artist(url);
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
    show_playlist: xm_show_playlist,
    get_playlist_filters,
    get_playlist,
    parse_url: xm_parse_url,
    bootstrap_track: xm_bootstrap_track,
    search: xm_search,
    lyric: xm_lyric,
  };
}

const xiami = build_xiami(); // eslint-disable-line no-unused-vars
