import Dexie from 'dexie';
import TrackModel from '../models/TrackModel';
import SettingkModel from '../models/SettingModel';
import PlaylistModel, { defaultPlaylists } from '../models/PlaylistModel';

interface MODEL {
  new (): unknown;
  INDEX_STRING: string;
}

const models: { [key: string]: MODEL } = {
  Tracks: TrackModel,
  Settings: SettingkModel,
  Playlists: PlaylistModel
};

export class L1DB extends Dexie {
  Tracks!: Dexie.Table<TrackModel, [string, string]>;
  Settings!: Dexie.Table<SettingkModel, [string]>;
  Playlists!: Dexie.Table<PlaylistModel, [string]>;

  constructor() {
    super('Listen1');
    const schema = Object.entries(models).reduce((ret: { [key: string]: string }, cur) => {
      ret[cur[0]] = cur[1].INDEX_STRING;
      return ret;
    }, {});
    this.version(1).stores(schema);
    this.Tracks.mapToClass(TrackModel);
  }
}

const iDB = new L1DB();

export function initDBService() {
  iDB.open();

  iDB.tables.forEach((table) => {
    const keys = [...Object.getOwnPropertyNames(new models[table.name]())];
    function createHook(primKey: unknown, originalObj: Record<string, unknown>) {
      const formattedObj = { ...originalObj };
      Object.keys(formattedObj).forEach((key) => (keys.includes(key) ? null : delete formattedObj[key]));
      originalObj = formattedObj;
    }
    function updateHook(mod: any) {
      const formattedObj = { ...mod };
      Object.keys(formattedObj).forEach((key) => (keys.includes(key) ? null : delete formattedObj[key]));
      mod = formattedObj;
    }
    table.hook('creating', createHook);
    table.hook('updating', updateHook);
  });

  for (const key in defaultPlaylists) {
    const value = defaultPlaylists[key];
    iDB.Playlists.get({ id: key }).then((playlist) => {
      if (!playlist) {
        iDB.Playlists.put(value);
      }
    });
  }

  iDB.Settings.bulkAdd([
    {
      key: 'favorite_playlist_order',
      value: []
    },
    {
      key: 'my_playlist_order',
      value: ['myplaylist_redheart']
    }
  ]);

  // migrate my playlist without redheart entry
  iDB.Settings.get({ key: 'my_playlist_order' }).then((order: any) => {
    if (!order) {
      iDB.Settings.put({
        key: 'my_playlist_order',
        value: ['myplaylist_redheart']
      });
    } else {
      if (order.value.findIndex((id: string) => id == 'myplaylist_redheart') == -1) {
        iDB.Settings.put({
          key: 'my_playlist_order',
          value: ['myplaylist_redheart', ...order.value]
        });
      }
    }
  });
}

function migratePlaylist(tracks: any, newId: string, newTitle: string, newType: 'current' | 'favorite' | 'my' | 'local') {
  iDB.Playlists.put({
    id: newId,
    title: newTitle,
    cover_img_url: 'images/mycover.jpg',
    type: newType,
    order: tracks.map((i: Record<string, unknown>) => i.id)
  });
  tracks.forEach((track: Record<string, unknown>) => (track.playlist = newId));
  iDB.Tracks.bulkPut(tracks);
}

export function dbMigrate() {
  let tracks = JSON.parse(localStorage.getItem('current-playing') || '[]');
  migratePlaylist(tracks, 'current', 'current', 'current');
  const localmusicPlaylist = JSON.parse(localStorage.getItem('lmplaylist_reserve') || '{}');
  tracks = localmusicPlaylist['tracks'] || [];
  migratePlaylist(tracks, 'lmplaylist_reserve', '本地音乐', 'local');
  localStorage.setItem('V3_MIGRATED', 'true');
}

export default iDB;
