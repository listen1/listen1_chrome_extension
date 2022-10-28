import useSettings from '../composition/settings';
import providers from '../provider';
import myplaylist from '../provider/myplaylist';
import { MusicProvider } from '../provider/types';

function getProviderByName(sourceName: string) {
  const provider = providers.find((i) => i.Name === sourceName);
  if (!provider) {
    throw Error('Unknown Provider');
  }
  return provider;
}

function getAllProviders() {
  return providers.filter((i) => !i.hidden);
}

function getAllSearchProviders() {
  return providers.filter((i) => i.searchable);
}

function getProviderNameByItemId(itemId: string) {
  const prefix = itemId.slice(0, 2);
  const name = providers.find((i) => i.id === prefix)?.Name;
  if (!name) {
    throw Error('Unknown Provider');
  }
  return name;
}

function getProviderByItemId(itemId: string) {
  const prefix = itemId.slice(0, 2);
  const provider: MusicProvider | undefined = providers.find((i) => i.id === prefix);
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
    return getAllProviders().map((p) => ({
      id: p.id,
      name: p.Name,
      searchable: p.searchable,
      displayId: p.displayId
    }));
  },
  getLoginProviders() {
    const result = providers.filter((i) => !i.hidden && i.support_login);
    return result;
  },
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
        //@ts-ignore no null
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

  showPlaylistArray(source: string, offset: number, filter_id: string) {
    const provider = getProviderByName(source);
    const url = `/show_playlist?${queryStringify({ offset, filter_id })}`;
    console.log("url", url, provider);
    return provider.showPlaylist(url);
  },

  getPlaylistFilters(source: string) {
    const provider = getProviderByName(source);
    return provider.getPlaylistFilters();
  },

  async getLyric(track_id: string, album_id: string, lyric_url: string, tlyric_url: string) {
    const provider = getProviderByItemId(track_id);
    const url = `/lyric?${queryStringify({
      track_id,
      album_id,
      lyric_url,
      tlyric_url
    })}`;
    try {
      return provider.lyric(url);
    } catch {
      return { lyric: '', tlyric: '' };
    }
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

  async addMyPlaylist(id: string, tracks: unknown[]) {
    return myplaylist.addTracksToMyplaylist(id, tracks);
  },
  async insertTrackToMyPlaylist(id: string, track: any, to_track: any, direction: string) {
    return myplaylist.insertTrackToMyplaylist(id, track, to_track, direction);
  },
  // addPlaylist(id, tracks) {
  //   const provider = getProviderByItemId(id);
  //   return provider.add_playlist(id, tracks);
  // },

  async removeTrackFromMyPlaylist(track_id: string, list_id: string) {
    myplaylist.removeTrackFromMyplaylist(track_id, list_id);
  },

  //   removeTrackFromPlaylist(id, track) {
  //     const provider = getProviderByItemId(id);
  //     return provider.remove_from_playlist(id, track);
  //   },

  createMyPlaylist(title: string, track: unknown[]) {
    myplaylist.createMyplaylist(title, track);
  },
  async reorderMyplaylist(playlistType: string, playlistId: string, toPlaylistId: string, direction: string) {
    return myplaylist.reorderMyplaylist(playlistType, playlistId, toPlaylistId, direction);
  },
  editMyPlaylist(id: string, title: string, coverImgUrl: string) {
    myplaylist.editMyplaylist(id, title, coverImgUrl);
  },

  async parseURL(url: string) {
    const providers = getAllProviders();
    for (const provider of providers) {
      const result = await provider.parseUrl(url);
      if (result != null) {
        return result;
      }
    }
    return null;
  },

  async mergePlaylist(masterPlaylistId: string, branchPlaylistId: string) {
    const branchPlaylist = await myplaylist.getPlaylistById(branchPlaylistId);
    await myplaylist.addTracksToMyplaylist(masterPlaylistId, branchPlaylist.tracks);
  },
  async init(track: any) {
    const { settings } = useSettings();
    const trackPlatform = getProviderNameByItemId(track.id);
    const failover_source_list = settings.autoChooseSourceList.filter((i) => i !== trackPlatform);
    const getUrlAsync = failover_source_list.map(
      (source: string) =>
        new Promise((res, rej) => {
          if (track.source === source) {
            return;
          }
          const keyword = `${track.title} ${track.artist}`;
          const curpage = 1;
          const url = `/search?keywords=${keyword}&curpage=${curpage}&type=0`;
          const provider = getProviderByName(source);
          //@ts-ignore TODO: use await to work with awaitable function
          provider.search(url).then((data: any) => {
            for (const searchTrack of data.result) {
              // compare search track and track to check if they are same
              // TODO: better similar compare method (duration, md5)
              if (
                !searchTrack.disable &&
                searchTrack.title.toLowerCase() === track.title.toLowerCase() &&
                searchTrack.artist.toLowerCase() === track.artist.toLowerCase()
              ) {
                res(provider.init(searchTrack));
              }
            }
            rej('');
          });
        })
    );
    return Promise.any(getUrlAsync);
  },
  async bootstrapTrackAsync(track: any) {
    return new Promise((res, rej) => this.bootstrapTrack(track, res, rej));
  },

  bootstrapTrack(track: any, playerSuccessCallback: (res?: unknown) => unknown, playerFailCallback: (res?: unknown) => unknown) {
    const successCallback = playerSuccessCallback;
    const sound: Record<string, unknown> = {};
    function failureCallback() {
      const { settings } = useSettings();
      if (!settings.enableAutoChooseSource) {
        playerFailCallback();
        return;
      }
      const trackPlatform = getProviderNameByItemId(track.id);

      const failover_source_list = settings.autoChooseSourceList.filter((i: string) => i !== trackPlatform);

      const getUrlAsync = failover_source_list.map(
        (source: string) =>
          new Promise((res, rej) => {
            if (track.source === source) {
              return;
            }
            const keyword = `${track.title} ${track.artist}`;
            const curpage = 1;
            const url = `/search?keywords=${keyword}&curpage=${curpage}&type=0`;
            const provider = getProviderByName(source);
            //@ts-ignore TODO: use await to work with awaitable function
            provider.search(url).then((data: any) => {
              for (let i = 0; i < data.result.length; i += 1) {
                const searchTrack = data.result[i];
                // compare search track and track to check if they are same
                // TODO: better similar compare method (duration, md5)
                if (
                  !searchTrack.disable &&
                  searchTrack.title.toLowerCase() === track.title.toLowerCase() &&
                  searchTrack.artist.toLowerCase() === track.artist.toLowerCase()
                ) {
                  return provider.bootstrapTrack(
                    searchTrack,
                    (response: Record<string, unknown>) => {
                      sound.url = response.url;
                      sound.bitrate = response.bitrate;
                      sound.platform = response.platform;
                      rej(sound); // Use Reject to return immediately
                    },
                    res
                  );
                }
              }
              res('');
            });
          })
      );
      // TODO: Use Promise.any() in ES2021 replace the tricky workaround
      Promise.all(getUrlAsync)
        .then(playerFailCallback)
        .catch((response) => {
          playerSuccessCallback(response);
        });
    }

    const provider = getProviderByName(track.source);

    provider.bootstrapTrack(track, successCallback, failureCallback);
  },

  async login(source: string, options: any) {
    const url = `/login?${queryStringify(options)}`;
    const provider = getProviderByName(source);

    return provider.login(url);
  },
  async getUser(source: string) {
    const provider = getProviderByName(source);
    return provider.getUser();
  },
  getLoginUrl(source: string) {
    const provider = getProviderByName(source);
    return provider.getLoginUrl();
  },
  async getUserCreatedPlaylist(source: string, options: any) {
    const provider = getProviderByName(source);
    const url = `/get_user_create_playlist?${queryStringify(options)}`;
    return provider.getUserCreatedPlaylist(url);
  },
  async getUserFavoritePlaylist(source: string, options: any) {
    const provider = getProviderByName(source);
    const url = `/get_user_favorite_playlist?${queryStringify(options)}`;
    return provider.getUserFavoritePlaylist(url);
  },
  async getRecommendPlaylist(source: string) {
    const provider = getProviderByName(source);
    return provider.getRecommendPlaylist();
  },
  async logout(source: string) {
    const provider = getProviderByName(source);
    return provider.logout();
  },
  async getCommentList(track: any, offset: number, limit: number) {
    const id2PlatformNames = ['qq', 'migu'];

    let trackId = track.id;
    const providerName = getProviderNameByItemId(track.id);
    const provider = getProviderByName(providerName);
    if (id2PlatformNames.includes(providerName)) {
      trackId = track.id2;
    }
    return provider.getCommentList(trackId, offset, limit);
  }
};

export default MediaService;
