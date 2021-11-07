import Dexie from 'dexie';

interface model {
  new(): any;
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

class Playlist {
  id!: string;
  title!: string;
  cover_img_url!: string;
  source_url?: string;
  is_mine!: boolean;

  static readonly INDEX_STRING = '&id, is_mine';
}

const models: { [key: string]: model } = {
  Tracks: Track,
  Settings: Setting,
  Playlists: Playlist,
};

export class L1DB extends Dexie {
  Tracks!: Dexie.Table<Track, [string, string]>;
  Settings!: Dexie.Table<Setting, [string]>;
  Playlistsettings!: Dexie.Table<Playlist, [string]>;

  constructor() {
    super("Listen1");
    const schema =
      Object.entries(models).reduce((ret: any, cur) => {
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
  function defHook(primKey: unknown, originalObj: any) {
    const formattedObj = { ...originalObj };
    Object.keys(formattedObj).forEach(key => keys.includes(key) ? null : delete formattedObj[key]);
    originalObj = formattedObj;
  }
  table.hook('creating', defHook);
  table.hook('updating', defHook);
});

export default iDB;
