/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-vars */
/* global getParameterByName */
const defaultLocalMusicPlaylist = {
  tracks: [],
  info: {
    id: 'lmplaylist_reserve',
    cover_img_url: 'images/mycover.jpg',
    title: '本地音乐',
    source_url: '',
  },
};

class localmusic {
  static show_playlist(url, hm) {
    return {
      success: (fn) =>
        fn({
          result: [],
        }),
    };
  }

  static lm_get_playlist(url) {
    const list_id = getParameterByName('list_id', url);
    return {
      success: (fn) => {
        let playlist = localStorage.getObject(list_id);

        if (playlist === null || playlist === undefined) {
          playlist = defaultLocalMusicPlaylist;
        }
        fn(playlist);
      },
    };
  }

  static lm_album(url) {
    const album = getParameterByName('list_id', url).split('_').pop();
    return {
      success: (fn) => {
        const list_id = 'lmplaylist_reserve';
        let playlist = localStorage.getObject(list_id);

        if (playlist === null || playlist === undefined) {
          playlist = JSON.parse(JSON.stringify(defaultLocalMusicPlaylist));
          playlist.info.title = album;
        } else {
          playlist.info.title = album;
          playlist.tracks = playlist.tracks.filter((tr) => tr.album === album);
        }
        fn(playlist);
      },
    };
  }

  static lm_artist(url) {
    const artist = getParameterByName('list_id', url).split('_').pop();
    return {
      success: (fn) => {
        const list_id = 'lmplaylist_reserve';
        let playlist = localStorage.getObject(list_id);

        if (playlist === null || playlist === undefined) {
          playlist = JSON.parse(JSON.stringify(defaultLocalMusicPlaylist));
          playlist.info.title = artist;
        } else {
          playlist.info.title = artist;
          playlist.tracks = playlist.tracks.filter(
            (tr) => tr.artist === artist
          );
        }
        fn(playlist);
      },
    };
  }

  static bootstrap_track(track, success, failure) {
    const sound = {};
    sound.url = track.sound_url;
    sound.platform = 'localmusic';

    success(sound);
  }

  static lyric(url) {
    const track_id = getParameterByName('track_id', url);
    const playlist = localStorage.getObject('lmplaylist_reserve');
    const track = playlist.tracks.find((item) => item.id === track_id);
    let lyric = '';
    if (track.lyrics !== undefined) {
      [lyric] = track.lyrics;
    }
    return {
      success: (fn) =>
        fn({
          lyric,
          tlyric: '',
        }),
    };
  }

  static add_playlist(list_id, tracks) {
    if (typeof tracks === 'string') {
      tracks = JSON.parse(tracks);
    }
    let playlist = localStorage.getObject(list_id);
    if (playlist === null) {
      playlist = JSON.parse(JSON.stringify(defaultLocalMusicPlaylist));
    }
    const tracksIdSet = {};
    tracks.forEach((tr) => {
      tracksIdSet[tr.id] = true;
    });
    playlist.tracks = tracks.concat(
      playlist.tracks.filter((tr) => tracksIdSet[tr.id] !== true)
    );
    localStorage.setObject(list_id, playlist);

    return {
      success: (fn) => fn({ list_id, playlist }),
    };
  }

  static parse_url(url) {
    let result;
    return {
      success: (fn) => {
        fn(result);
      },
    };
  }

  static get_playlist(url) {
    const list_id = getParameterByName('list_id', url).split('_')[0];
    switch (list_id) {
      case 'lmplaylist':
        return this.lm_get_playlist(url);
      case 'lmartist':
        return this.lm_artist(url);
      case 'lmalbum':
        return this.lm_album(url);
      default:
        return null;
    }
  }

  static remove_from_playlist(list_id, track_id) {
    const playlist = localStorage.getObject(list_id);
    if (playlist == null) {
      return;
    }
    const newtracks = playlist.tracks.filter((item) => item.id !== track_id);
    playlist.tracks = newtracks;
    localStorage.setObject(list_id, playlist);

    // eslint-disable-next-line consistent-return
    return {
      success: (fn) => fn(),
    };
  }

  static get_playlist_filters() {
    return {
      success: (fn) => fn({ recommend: [], all: [] }),
    };
  }

  // return {
  //   show_playlist: lm_show_playlist,
  //   get_playlist_filters,
  //   get_playlist,
  //   parse_url: lm_parse_url,
  //   bootstrap_track: lm_bootstrap_track,
  //   search: lm_search,
  //   lyric: lm_lyric,
  //   add_playlist: lm_add_playlist,
  //   remove_from_playlist: lm_remove_from_playlist,
  // };
}
