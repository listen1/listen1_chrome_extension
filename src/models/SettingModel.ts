import iDB from '../services/DBService';
import { settingsKey, settingsType, settingEntries } from '../composition/settings';
export default class SettingModel {
  key!: string;
  value!: unknown;

  static readonly INDEX_STRING = '&key';
  static prepare() {
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

  static async getArrayByKey(key: string) {
    return iDB.Settings.where('key').equals(key).toArray();
  }

  static async flushSettings(settings: settingsType) {
    await iDB.Settings.bulkPut(
      (Object.keys(settings) as settingsKey[]).map((key) => ({
        key,
        value: settings[key]
      }))
    );
  }
  static setSettings(newValue: Partial<Record<settingsKey, unknown>>) {
    for (const [key, value] of Object.entries(newValue) as settingEntries) {
      iDB.Settings.put({ key, value });
    }
  }
  static saveSettingsToDB(newValue: Partial<Record<settingsKey, unknown>>) {
    for (const [key, value] of Object.entries(newValue) as settingEntries) {
      iDB.Settings.put({ key, value });
    }
  }
  static async loadSettings() {
    const dbRes: Record<string, unknown> = (await iDB.Settings.toArray()).reduce((ret: Record<string, unknown>, cur) => {
      ret[cur.key] = cur.value;
      return ret;
    }, {});
    return dbRes;
  }
  static getByKey(key: string) {
    return iDB.Settings.get({ key });
  }
  static async updateByKey(key: string, updateFn: any) {
    await iDB.Settings.where('key').equals(key).modify(updateFn);
  }
}
