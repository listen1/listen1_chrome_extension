import { getParameterByName } from "../utils";
import MusicResource from './music_resource';
import iDB from '../services/DBService';

export default class localmusic extends MusicResource {
  static async getPlaylistById(list_id) {
    const playlistInfo = await iDB.Playlists.get(list_id);
    let playlist = {
      info: playlistInfo,
      tracks: []
    };
    // clear url field when load old playlist
    if (playlistInfo) {
      playlist.tracks = await iDB.Tracks.where('playlist')
        .equals(list_id)
        .toArray()
        .then((tracks) => (playlistInfo.order ? playlistInfo.order.map((id) => tracks.find((track) => track.id === id)) : tracks));
    } else {
      playlist = null;
    }
    return playlist;
  }
  static async lm_get_playlist(url) {
    const list_id = getParameterByName('list_id', url);
    return await this.getPlaylistById(list_id);
  }

  static async lm_album(url) {
    const album = getParameterByName('list_id', url).split('_').pop();

    const list_id = 'lmplaylist_reserve';
    const playlist = await this.getPlaylistById(list_id);

    playlist.info.title = album;
    playlist.tracks = playlist.tracks.filter((tr) => tr.album === album);

    return playlist;
  }

  static async lm_artist(url) {
    const artist = getParameterByName('list_id', url).split('_').pop();
    const list_id = 'lmplaylist_reserve';
    const playlist = await this.getPlaylistById(list_id);

    playlist.info.title = artist;
    playlist.tracks = playlist.tracks.filter((tr) => tr.artist === artist);

    return playlist;
  }

  static bootstrapTrack(track, success) {
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
    const track_id = getParameterByName('track_id', url);
    const list_id = 'lmplaylist_reserve';
    const playlist = await this.getPlaylistById(list_id);

    const track = playlist.tracks.find((item) => item.id === track_id);
    let lyric = '';
    if (track.lyrics !== undefined) {
      [lyric] = track.lyrics;
    }
    return {
      lyric,
      tlyric: ''
    };
  }

  static async parseUrl() {
    let result;
    return result;
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

  static async getPlaylistFilters() {
    return {
      recommend: [],
      all: []
    };
  }
}
