import Dexie from 'dexie';
import { migrateSettings } from '../composition/settings';

interface MODEL {
  new(): unknown;
  INDEX_STRING: string;
}

class Track {
  id!: string;
  playlist!: string;
  title?: string;
  artist?: string;
  artist_id?: string;
  album?: string;
  album_id?: string;
  img_url?: string;
  source?: string;
  // source_url: String,
  // lyric_url: String,
  disabled?: string;

  static readonly INDEX_STRING = '&[playlist+id], playlist, id, title, artist, artist_id, album, album_id, source, disabled';

  [key: string]: unknown;
}

class Setting {
  key!: string;
  value!: unknown;

  static readonly INDEX_STRING = '&key';
}

export class Playlist {
  id!: string;
  title!: string;
  cover_img_url!: string;
  source_url?: string;
  type!: 'current' | 'favorite' | 'my';
  order!: string[];

  static readonly INDEX_STRING = '&id, type';
}

const models: { [key: string]: MODEL } = {
  Tracks: Track,
  Settings: Setting,
  Playlists: Playlist,
};

export class L1DB extends Dexie {
  Tracks!: Dexie.Table<Track, [string, string]>;
  Settings!: Dexie.Table<Setting, [string]>;
  Playlists!: Dexie.Table<Playlist, [string]>;

  constructor() {
    super("Listen1");
    const schema =
      Object.entries(models).reduce((ret: { [key: string]: string }, cur) => {
        ret[cur[0]] = cur[1].INDEX_STRING;
        return ret;
      }, {});
    this.version(1).stores(schema);
    this.Tracks.mapToClass(Track);
  }
}

const iDB = new L1DB();
iDB.open();

iDB.tables.forEach((table) => {
  const keys = [...Object.getOwnPropertyNames(new models[table.name]())];
  function createHook(primKey: unknown, originalObj: Record<string, unknown>) {
    const formattedObj = { ...originalObj };
    Object.keys(formattedObj).forEach(key => keys.includes(key) ? null : delete formattedObj[key]);
    originalObj = formattedObj;
  }
  function updateHook(mod: any) {
    const formattedObj = { ...mod };
    Object.keys(formattedObj).forEach(key => keys.includes(key) ? null : delete formattedObj[key]);
    mod = formattedObj;
  }
  table.hook('creating', createHook);
  table.hook('updating', updateHook);
});

// default items
iDB.Playlists.get({ id: 'current' }).then((playlist)=>{
  if(!playlist) {
    iDB.Playlists.put({
      id: 'current', title: 'current', cover_img_url: '', type: 'current',
      order: [],
    });
  }
});
iDB.Settings.bulkAdd([{
  key: 'favorite_playlist_order',
  value: [],
}, {
  key: 'my_playlist_order',
  value: [],
}]);

export function dbMigrate() {
  const localCurrentPlaying = JSON.parse(localStorage.getItem('current-playing') || '[]');
  iDB.Playlists.put({
    id: 'current', title: 'current', cover_img_url: '', type: 'current',
    order: localCurrentPlaying.map((i: Record<string, unknown>) => i.id),
  });
  localCurrentPlaying.forEach((track: Record<string, unknown>) => track.playlist = 'current');
  iDB.Tracks.bulkPut(localCurrentPlaying);
  migrateSettings();
  localStorage.setItem('V3_MIGRATED', 'true');
}

export default iDB;
