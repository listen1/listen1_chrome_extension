import { getParameterByName } from '../utils';
import { MusicResource, MusicProvider } from './types';
import iDB from '../services/DBService';

const provider: MusicProvider = class localmusic extends MusicResource {
  static Name = 'localmusic';
  static id = 'lm';
  static searchable = false;
  static support_login = false;
  static hidden = true;
  static displayId = '_LOCAL_MUSIC';
  static async getPlaylistById(list_id: string) {
    const playlistInfo = await iDB.Playlists.get({ id: list_id });
    let playlist = {
      info: playlistInfo,
      tracks: <any>[]
    } as any;
    // clear url field when load old playlist
    if (playlistInfo) {
      playlist.tracks = await iDB.Tracks.where('playlist')
        .equals(list_id)
        .toArray()
        .then((tracks) => (playlistInfo.order ? playlistInfo.order.map((id) => tracks.find((track) => track.id === id)) : tracks))
        .then((tracks) => {
          tracks.map(async (track) => {
            if (!track) {
              return;
            }
            // @ts-ignore add ts dec later
            const md = await window.api.readTag(track.source_url);
            track.img_url = md.common.img_url;
            return track;
          });
          return tracks;
        });
    } else {
      playlist = null;
    }
    return playlist;
  }
  static async lm_get_playlist(url: string) {
    const list_id = getParameterByName('list_id', url) || '';
    return this.getPlaylistById(list_id);
  }

  static async lm_album(url: string) {
    const album = getParameterByName('list_id', url)?.split('_').pop();

    const list_id = 'lmplaylist_reserve';
    const playlist = await this.getPlaylistById(list_id);

    playlist.info.title = album;
    playlist.tracks = playlist.tracks.filter((tr: any) => tr.album === album);

    return playlist;
  }

  static async lm_artist(url: string) {
    const artist = getParameterByName('list_id', url)?.split('_').pop();
    const list_id = 'lmplaylist_reserve';
    const playlist = await this.getPlaylistById(list_id);

    playlist.info.title = artist;
    playlist.tracks = playlist.tracks.filter((tr: any) => tr.artist === artist);

    return playlist;
  }
  static init(track: any) {
    return { url: track.sound_url, platform: 'localmusic', bitrate: track.bitrate };
  }

  static async search(url: string) {
    const searchType = getParameterByName('type', url);
    return {
      result: [],
      total: 0,
      type: searchType
    };
  }

  static async lyric(url: string) {
    const track_id = getParameterByName('track_id', url);
    const list_id = 'lmplaylist_reserve';
    const playlist = await this.getPlaylistById(list_id);

    const track = playlist.tracks.find((item: any) => item.id === track_id);
    const md = await window.api.readTag(track.source_url);
    return {
      lyric: md.common.lyrics?.[0] || '',
      tlyric: md.common.lyrics?.[1] || ''
    };
  }

  static async parseUrl() {
    let result;
    return result;
  }

  static getPlaylist(url: string) {
    const list_id = getParameterByName('list_id', url)?.split('_')[0];
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
};

export default provider;
