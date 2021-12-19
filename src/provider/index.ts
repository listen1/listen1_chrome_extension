import netease from './netease';
import qq from './qq';
import kugou from './kugou';
import kuwo from './kuwo';
import bilibili from './bilibili';
import migu from './migu';
import taihe from './taihe';
import localmusic from './localmusic';
import myplaylist from './myplaylist';
import { MusicProvider } from './types'

const providers = [
  netease,
  qq,
  kugou,
  kuwo,
  bilibili,
  migu,
  taihe,
  localmusic,
  myplaylist,
]

const PROVIDERS: {
  id: string;
  name: string;
  instance: MusicProvider;
  searchable: boolean;
  support_login: boolean;
  hidden?: boolean;
  displayId?: string;
}[] = [
    {
      name: 'netease',
      instance: netease,
      searchable: true,
      support_login: true,
      id: 'ne',
      displayId: '_NETEASE_MUSIC'
    },
    {
      name: 'qq',
      instance: qq,
      searchable: true,
      support_login: true,
      id: 'qq',
      displayId: '_QQ_MUSIC'
    },
    {
      name: 'kugou',
      instance: kugou,
      searchable: true,
      support_login: false,
      id: 'kg',
      displayId: '_KUGOU_MUSIC'
    },
    {
      name: 'kuwo',
      instance: kuwo,
      searchable: true,
      support_login: false,
      id: 'kw',
      displayId: '_KUWO_MUSIC'
    },
    {
      name: 'bilibili',
      instance: bilibili,
      searchable: false,
      support_login: false,
      id: 'bi',
      displayId: '_BILIBILI_MUSIC',
    },
    {
      name: 'migu',
      instance: migu,
      searchable: true,
      support_login: true,
      id: 'mg',
      displayId: '_MIGU_MUSIC'
    },
    {
      name: 'taihe',
      instance: taihe,
      searchable: true,
      support_login: false,
      id: 'th',
      displayId: '_TAIHE_MUSIC'
    },
    {
      name: 'localmusic',
      instance: localmusic,
      searchable: false,
      hidden: true,
      support_login: false,
      id: 'lm'
    },
    {
      name: 'myplaylist',
      instance: myplaylist,
      searchable: false,
      hidden: true,
      support_login: false,
      id: 'my'
    }
  ];
export default PROVIDERS;