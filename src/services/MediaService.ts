import netease from '../provider/netease';
// import xiami from "@/provider/xiami";
import qq from '../provider/qq';
import kugou from '../provider/kugou';
import kuwo from '../provider/kuwo';
import bilibili from '../provider/bilibili';
import migu from '../provider/migu';
import taihe from '../provider/taihe';
import { getLocalStorageValue } from '../provider/lowebutil';
// import localmusic from "@/provider/localmusic";
import myplaylist from '../provider/myplaylist';

interface Provider {
  getPlaylist: (url: string) => any;
  search: (url: string) => any;
  lyric: (url: string) => any;
}

const sourceList: {
  name: string;
  displayId: string;
  searchable?: boolean;
}[] = [
  {
    name: 'netease',
    displayId: '_NETEASE_MUSIC'
  },
  {
    name: 'qq',
    displayId: '_QQ_MUSIC'
  },
  {
    name: 'kugou',
    displayId: '_KUGOU_MUSIC'
  },
  {
    name: 'kuwo',
    displayId: '_KUWO_MUSIC'
  },
  {
    name: 'bilibili',
    displayId: '_BILIBILI_MUSIC',
    searchable: false
  },
  {
    name: 'migu',
    displayId: '_MIGU_MUSIC'
  },
  {
    name: 'taihe',
    displayId: '_TAIHE_MUSIC'
  }
];
const PROVIDERS: {
  id: string;
  name: string;
  instance: any;
  searchable: boolean;
  support_login: boolean;
  hidden?: boolean;
}[] = [
  {
    name: 'netease',
    instance: netease,
    searchable: true,
    support_login: true,
    id: 'ne'
  },
  //   {
  //     name: "xiami",
  //     instance: xiami,
  //     searchable: false,
  //     hidden: true,
  //     support_login: false,
  //     id: "xm",
  //   },
  {
    name: 'qq',
    instance: qq,
    searchable: true,
    support_login: true,
    id: 'qq'
  },
  {
    name: 'kugou',
    instance: kugou,
    searchable: true,
    support_login: false,
    id: 'kg'
  },
  {
    name: 'kuwo',
    instance: kuwo,
    searchable: true,
    support_login: false,
    id: 'kw'
  },
  {
    name: 'bilibili',
    instance: bilibili,
    searchable: false,
    support_login: false,
    id: 'bi'
  },
  {
    name: 'migu',
    instance: migu,
    searchable: true,
    support_login: true,
    id: 'mg'
  },
  {
    name: 'taihe',
    instance: taihe,
    searchable: true,
    support_login: false,
    id: 'th'
  },
  //   {
  //     name: "localmusic",
  //     instance: localmusic,
  //     searchable: false,
  //     hidden: true,
  //     support_login: false,
  //     id: "lm",
  //   },
  {
    name: 'myplaylist',
    instance: myplaylist,
    searchable: false,
    hidden: true,
    support_login: false,
    id: 'my'
  }
];

function getProviderByName(sourceName: string) {
  const provider = PROVIDERS.find((i) => i.name === sourceName)?.instance;
  if (!provider) {
    throw Error('Unknown Provider');
  }
  return provider;
}

// function getAllProviders() {
//   return PROVIDERS.filter((i) => !i.hidden).map((i) => i.instance);
// }

function getAllSearchProviders() {
  return PROVIDERS.filter((i) => i.searchable).map((i) => i.instance);
}

function getProviderNameByItemId(itemId: string) {
  const prefix = itemId.slice(0, 2);
  const name = PROVIDERS.find((i) => i.id === prefix)?.name;
  if (!name) {
    throw Error('Unknown Provider');
  }
  return name;
}

function getProviderByItemId(itemId: string) {
  const prefix = itemId.slice(0, 2);
  const provider: Provider | undefined = PROVIDERS.find((i) => i.id === prefix)?.instance;
  if (!provider) {
    throw Error('Unknown Provider');
  }
  return provider;
}

// // /* cache for all playlist request except myplaylist and localmusic */
// // const playlistCache = new LRUCache({
// //   max: 100,
// //   maxAge: 60 * 60 * 1000, // 1 hour cache expire
// // });

function queryStringify(options: unknown) {
  const query = JSON.parse(JSON.stringify(options));
  return new URLSearchParams(query).toString();
}

const MediaService = {
  getSourceList() {
    return sourceList;
  },
  //   getLoginProviders() {
  //     return PROVIDERS.filter((i) => !i.hidden && i.support_login);
  //   },
  async search(source: string, options: unknown) {
    const url = `/search?${queryStringify(options)}`;
    if (source === 'allmusic') {
      // search all platform and merge result
      const platformResultArray = await Promise.all(getAllSearchProviders().map((p) => p.search(url)));
      const result: {
        result: any[];
        total: number;
        type: string;
      } = {
        result: [],
        total: 1000,
        type: platformResultArray[0].type
      };
      const maxLength = Math.max(...platformResultArray.map((elem) => elem.result.length));
      for (let i = 0; i < maxLength; i += 1) {
        platformResultArray.forEach((elem) => {
          if (i < elem.result.length) {
            result.result.push(elem.result[i]);
          }
        });
      }
      return result;
    } else {
      const provider = getProviderByName(source);
      return provider.search(url);
    }
  },

  showMyPlaylist() {
    return myplaylist.getMyplaylistsList('my');
  },

  showPlaylistArray(source: string, offset: string, filter_id: string) {
    const provider = getProviderByName(source);
    const url = `/show_playlist?${queryStringify({ offset, filter_id })}`;
    return provider.showPlaylist(url);
  },

  getPlaylistFilters(source: string) {
    const provider = getProviderByName(source);
    return provider.getPlaylistFilters();
  },

  getLyric(track_id: string, album_id: string, lyric_url: string, tlyric_url: string) {
    const provider = getProviderByItemId(track_id);
    const url = `/lyric?${queryStringify({
      track_id,
      album_id,
      lyric_url,
      tlyric_url
    })}`;
    return provider.lyric(url);
  },

  showFavPlaylist() {
    return myplaylist.getMyplaylistsList('favorite');
  },

  async isMyPlaylist(listId: string) {
    const url = `/playlist?list_id=${listId}`;
    const playlist = await myplaylist.getPlaylist(url);
    return !!playlist;
  },

  getPlaylist(listId: string) {
    const provider = getProviderByItemId(listId);
    const url = `/playlist?list_id=${listId}`;
    // let hit = null;
    // if (useCache) {
    //   hit = playlistCache.get(listId);
    // }

    // if (hit) {
    //   return {
    //     success: (fn) => fn(hit),
    //   };
    // }
    return provider.getPlaylist(url);
  },

  async clonePlaylist(id: string, type: string) {
    const provider = getProviderByItemId(id);
    const url = `/playlist?list_id=${id}`;
    return myplaylist.saveMyplaylist(type, await provider.getPlaylist(url));
  },

  removeMyPlaylist(id: string, type: string) {
    return myplaylist.removeMyplaylist(type, id);
  },

  async addMyPlaylist(id: string, tracks: string) {
    return myplaylist.addTrackToMyplaylist(id, tracks);
  },
  //   insertTrackToMyPlaylist(id, track, to_track, direction) {
  //     const newPlaylist = myplaylist.insertTrackToMyplaylist(
  //       id,
  //       track,
  //       to_track,
  //       direction
  //     );
  //     return {
  //       success: (fn) => fn(newPlaylist),
  //     };
  //   },
  //   addPlaylist(id, tracks) {
  //     const provider = getProviderByItemId(id);
  //     return provider.add_playlist(id, tracks);
  //   },

  //   removeTrackFromMyPlaylist(id, track) {
  //     myplaylist.removeTrackFromMyplaylist(id, track);
  //     return {
  //       success: (fn) => fn(),
  //     };
  //   },

  //   removeTrackFromPlaylist(id, track) {
  //     const provider = getProviderByItemId(id);
  //     return provider.remove_from_playlist(id, track);
  //   },

  createMyPlaylist(title: string, track: string) {
    myplaylist.createMyplaylist(title, track);
  },
  //   insertMyplaylistToMyplaylists(
  //     playlistType,
  //     playlistId,
  //     toPlaylistId,
  //     direction
  //   ) {
  //     const newPlaylists = myplaylist.insertMyplaylistToMyplaylists(
  //       playlistType,
  //       playlistId,
  //       toPlaylistId,
  //       direction
  //     );
  //     return {
  //       success: (fn) => fn(newPlaylists),
  //     };
  //   },
  //   editMyPlaylist(id, title, coverImgUrl) {
  //     myplaylist.editMyplaylist(id, title, coverImgUrl);
  //     return {
  //       success: (fn) => fn(),
  //     };
  //   },

  //   parseURL(url) {
  //     return {
  //       success: (fn) => {
  //         const providers = getAllProviders();
  //         Promise.all(
  //           providers.map(
  //             (provider) =>
  //               new Promise((res, rej) =>
  //                 provider.parseUrl(url).success((r) => {
  //                   if (r !== undefined) {
  //                     return rej(r);
  //                   }
  //                   return res(r);
  //                 })
  //               )
  //           )
  //         )
  //           .then(() => fn({}))
  //           .catch((result) => fn({ result }));
  //       },
  //     };
  //   },

  //   mergePlaylist(source, target) {
  //     const tarData = localStorage.getObject(target).tracks;
  //     const srcData = localStorage.getObject(source).tracks;
  //     tarData.forEach((tarTrack) => {
  //       if (!srcData.find((srcTrack) => srcTrack.id === tarTrack.id)) {
  //         myplaylist.addTrackToMyplaylist(source, tarTrack);
  //       }
  //     });
  //     return {
  //       success: (fn) => fn(),
  //     };
  //   },

  bootstrapTrack(track: any, playerSuccessCallback: (res?: unknown) => unknown, playerFailCallback: (res?: unknown) => unknown) {
    const successCallback = playerSuccessCallback;
    const sound: Record<string, unknown> = {};
    function failureCallback() {
      if (localStorage.getObject('enable_auto_choose_source') === false) {
        playerFailCallback();
        return;
      }
      const trackPlatform = getProviderNameByItemId(track.id);
      /** @type{Array} */
      const failover_source_list = getLocalStorageValue('auto_choose_source_list', ['kuwo', 'qq', 'migu']).filter((i: string) => i !== trackPlatform);

      const getUrlAsync = failover_source_list.map(async (source: string) => {
        if (track.source === source) {
          return;
        }
        const keyword = `${track.title} ${track.artist}`;
        const curpage = 1;
        const url = `/search?keywords=${keyword}&curpage=${curpage}&type=0`;
        const provider = getProviderByName(source);
        provider.search(url).then((data: any) => {
          for (let i = 0; i < data.result.length; i += 1) {
            const searchTrack = data.result[i];
            // compare search track and track to check if they are same
            // TODO: better similar compare method (duration, md5)
            if (!searchTrack.disable && searchTrack.title === track.title && searchTrack.artist === track.artist) {
              provider.bootstrapTrack(
                searchTrack,
                (response: Record<string, unknown>) => {
                  sound.url = response.url;
                  sound.bitrate = response.bitrate;
                  sound.platform = response.platform;
                  Promise.reject(sound); // Use Reject to return immediately
                },
                Promise.resolve
              );
              return;
            }
          }
          return sound;
        });
      });
      // TODO: Use Promise.any() in ES2021 replace the tricky workaround
      Promise.all(getUrlAsync)
        .then(playerFailCallback)
        .catch((response) => {
          playerSuccessCallback(response);
        });
    }

    const provider = getProviderByName(track.source);

    provider.bootstrapTrack(track, successCallback, failureCallback);
  }

  //   login(source, options) {
  //     const url = `/login?${queryStringify(options)}`;
  //     const provider = getProviderByName(source);

  //     return provider.login(url);
  //   },
  //   getUser(source) {
  //     const provider = getProviderByName(source);
  //     return provider.getUser();
  //   },
  //   getLoginUrl(source) {
  //     const provider = getProviderByName(source);
  //     return provider.getLoginUrl();
  //   },
  //   getUserCreatedPlaylist(source, options) {
  //     const provider = getProviderByName(source);
  //     const url = `/get_user_create_playlist?${queryStringify(options)}`;

  //     return provider.getUserCreatedPlaylist(url);
  //   },
  //   getUserFavoritePlaylist(source, options) {
  //     const provider = getProviderByName(source);
  //     const url = `/get_user_favorite_playlist?${queryStringify(options)}`;

  //     return provider.getUserFavoritePlaylist(url);
  //   },
  //   getRecommendPlaylist(source) {
  //     const provider = getProviderByName(source);

  //     return provider.getRecommendPlaylist();
  //   },
  //   logout(source) {
  //     const provider = getProviderByName(source);

  //     return provider.logout();
  //   },
};

// eslint-disable-next-line no-unused-vars
export default MediaService;
