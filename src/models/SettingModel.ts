import iDB from '../services/DBService';

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
}
