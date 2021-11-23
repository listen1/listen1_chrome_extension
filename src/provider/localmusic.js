import { getParameterByName } from './lowebutil';
import MusicResource from './music_resource';

/* global getParameterByName */

const defaultLocalMusicPlaylist = {
  tracks: [],
  info: {
    id: 'lmplaylist_reserve',
    cover_img_url: 'images/mycover.jpg',
    title: '本地音乐',
    source_url: ''
  }
};

export default class localmusic extends MusicResource {
  static showPlaylist(url, hm) {
    return {
      success: (fn) =>
        fn({
          result: []
        })
    };
  }

  static async lm_get_playlist(url) {
    const list_id = getParameterByName('list_id', url);

    let playlist = localStorage.getObject(list_id);

    if (playlist === null || playlist === undefined) {
      playlist = defaultLocalMusicPlaylist;
    }
    return playlist;
  }

  static async lm_album(url) {
    const album = getParameterByName('list_id', url).split('_').pop();

    const list_id = 'lmplaylist_reserve';
    let playlist = localStorage.getObject(list_id);

    if (playlist === null || playlist === undefined) {
      playlist = JSON.parse(JSON.stringify(defaultLocalMusicPlaylist));
      playlist.info.title = album;
    } else {
      playlist.info.title = album;
      playlist.tracks = playlist.tracks.filter((tr) => tr.album === album);
    }
    return playlist;
  }

  static async lm_artist(url) {
    const artist = getParameterByName('list_id', url).split('_').pop();

    const list_id = 'lmplaylist_reserve';
    let playlist = localStorage.getObject(list_id);

    if (playlist === null || playlist === undefined) {
      playlist = JSON.parse(JSON.stringify(defaultLocalMusicPlaylist));
      playlist.info.title = artist;
    } else {
      playlist.info.title = artist;
      playlist.tracks = playlist.tracks.filter((tr) => tr.artist === artist);
    }
    return playlist;
  }

  static bootstrapTrack(track, success, failure) {
    const sound = {};
    sound.url = track.sound_url;
    sound.platform = 'localmusic';

    success(sound);
  }

  static async search(url) {
    const searchType = getParameterByName('type', url);
    return {
      result: [],
      total: 0,
      type: searchType
    };
  }

  static async lyric(url) {
    return {
      lyric: '',
      tlyric: ''
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
    playlist.tracks = tracks.concat(playlist.tracks.filter((tr) => tracksIdSet[tr.id] !== true));
    localStorage.setObject(list_id, playlist);

    return {
      success: (fn) => fn({ list_id, playlist })
    };
  }

  static parseUrl(url) {
    let result;
    return {
      success: (fn) => {
        fn(result);
      }
    };
  }

  static getPlaylist(url) {
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
      success: (fn) => fn()
    };
  }

  static async getPlaylistFilters() {
    return {
      recommend: [],
      all: []
    };
  }
}
