export const defaultPlaylists: { [key: string]: any } = {
  current: {
    id: 'current',
    title: 'current',
    cover_img_url: 'images/mycover.jpg',
    type: 'current',
    order: []
  },
  lmplaylist_reserve: {
    id: 'lmplaylist_reserve',
    title: '本地音乐',
    cover_img_url: 'images/mycover.jpg',
    type: 'local',
    order: []
  },
  myplaylist_redheart: {
    id: 'myplaylist_redheart',
    title: '我喜欢的音乐',
    cover_img_url: 'images/mycover.jpg',
    type: 'my',
    order: []
  }
};

export default class PlaylistModel {
  id!: string;
  title!: string;
  cover_img_url!: string;
  source_url?: string;
  type!: 'current' | 'favorite' | 'my' | 'local';
  order!: string[];

  static readonly INDEX_STRING = '&id, type';
}
