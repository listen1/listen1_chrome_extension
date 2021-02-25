/* global async LRUCache */
/* global netease xiami qq kugou kuwo bilibili migu localmusic myplaylist */
const PROVIDERS = [
  {
    name: 'netease',
    instance: netease,
    searchable: true,
    id: 'ne',
  },
  {
    name: 'xiami',
    instance: xiami,
    searchable: true,
    id: 'xm',
  },
  {
    name: 'qq',
    instance: qq,
    searchable: true,
    id: 'qq',
  },
  {
    name: 'kugou',
    instance: kugou,
    searchable: true,
    id: 'kg',
  },
  {
    name: 'kuwo',
    instance: kuwo,
    searchable: true,
    id: 'kw',
  },
  {
    name: 'bilibili',
    instance: bilibili,
    searchable: false,
    id: 'bi',
  },
  {
    name: 'migu',
    instance: migu,
    searchable: true,
    id: 'mg',
  },
  {
    name: 'localmusic',
    instance: localmusic,
    searchable: false,
    hidden: true,
    id: 'lm',
  },
  {
    name: 'myplaylist',
    instance: myplaylist,
    searchable: false,
    hidden: true,
    id: 'my',
  },
];

function getProviderByName(sourceName) {
  return (PROVIDERS.find((i) => i.name === sourceName) || {}).instance;
}

function getAllProviders() {
  return PROVIDERS.filter((i) => !i.hidden).map((i) => i.instance);
}

function getAllSearchProviders() {
  return PROVIDERS.filter((i) => i.searchable).map((i) => i.instance);
}

function getProviderByItemId(itemId) {
  const prefix = itemId.slice(0, 2);
  return (PROVIDERS.find((i) => i.id === prefix) || {}).instance;
}

/* cache for all playlist request except myplaylist and localmusic */
const playlistCache = new LRUCache({
  max: 100,
  maxAge: 60 * 60 * 1000, // 1 hour cache expire
});

function queryStringify(options) {
  const query = JSON.parse(JSON.stringify(options));
  return new URLSearchParams(query).toString();
}

// eslint-disable-next-line no-unused-vars
const MediaService = {
  search(source, options) {
    const url = `/search?${queryStringify(options)}`;
    if (source === 'allmusic') {
      // search all platform and merge result
      const callbackArray = getAllSearchProviders().map((p) => (fn) => {
        p.search(url).success((r) => {
          fn(null, r);
        });
      });
      return {
        success: (fn) =>
          async.parallel(callbackArray, (err, platformResultArray) => {
            // TODO: nicer pager, playlist support
            const result = {
              result: [],
              total: 1000,
              type: platformResultArray[0].type,
            };
            const maxLength = Math.max(
              ...platformResultArray.map((elem) => elem.result.length)
            );
            for (let i = 0; i < maxLength; i += 1) {
              platformResultArray.forEach((elem) => {
                if (i < elem.result.length) {
                  result.result.push(elem.result[i]);
                }
              });
            }
            return fn(result);
          }),
      };
    }
    const provider = getProviderByName(source);
    return provider.search(url);
  },

  showMyPlaylist() {
    return myplaylist.show_myplaylist('my');
  },

  showPlaylist(source, offset) {
    const provider = getProviderByName(source);
    const url = `/show_playlist?${queryStringify({ offset })}`;
    return provider.show_playlist(url);
  },

  getLyric(track_id, album_id, lyric_url, tlyric_url) {
    const provider = getProviderByItemId(track_id);
    const url = `/lyric?${queryStringify({
      track_id,
      album_id,
      lyric_url,
      tlyric_url,
    })}`;
    return provider.lyric(url);
  },

  showFavPlaylist() {
    return myplaylist.show_myplaylist('favorite');
  },

  queryPlaylist(listId, type) {
    const result = myplaylist.myplaylist_containers(type, listId);
    return {
      success: (fn) => fn({ result }),
    };
  },

  getPlaylist(listId, useCache = true) {
    const provider = getProviderByItemId(listId);
    const url = `/playlist?list_id=${listId}`;
    let hit = null;
    if (useCache) {
      hit = playlistCache.get(listId);
    }

    if (hit) {
      return {
        success: (fn) => fn(hit),
      };
    }
    return {
      success: (fn) =>
        provider.get_playlist(url).success((playlist) => {
          if (provider !== myplaylist && provider !== localmusic) {
            playlistCache.set(listId, playlist);
          }
          fn(playlist);
        }),
    };
  },

  clonePlaylist(id, type) {
    const provider = getProviderByItemId(id);
    const url = `/playlist?list_id=${id}`;
    return {
      success: (fn) => {
        provider.get_playlist(url).success((data) => {
          myplaylist.save_myplaylist(type, data);
          fn();
        });
      },
    };
  },

  removeMyPlaylist(id, type) {
    myplaylist.remove_myplaylist(type, id);
    return {
      success: (fn) => fn(),
    };
  },

  addMyPlaylist(id, track) {
    const newPlaylist = myplaylist.add_myplaylist(id, track);
    return {
      success: (fn) => fn(newPlaylist),
    };
  },

  addPlaylist(id, tracks) {
    const provider = getProviderByItemId(id);
    return provider.add_playlist(id, tracks);
  },

  removeTrackFromMyPlaylist(id, track) {
    myplaylist.remove_from_myplaylist(id, track);
    return {
      success: (fn) => fn(),
    };
  },

  removeTrackFromPlaylist(id, track) {
    const provider = getProviderByItemId(id);
    return provider.remove_from_playlist(id, track);
  },

  createMyPlaylist(title, track) {
    myplaylist.create_myplaylist(title, track);
    return {
      success: (fn) => {
        fn();
      },
    };
  },

  editMyPlaylist(id, title, coverImgUrl) {
    myplaylist.edit_myplaylist(id, title, coverImgUrl);
    return {
      success: (fn) => fn(),
    };
  },

  parseURL(url) {
    const providers = getAllProviders();
    const result = providers
      .find((provider) => provider.parse_url(url))
      .parse_url(url);
    return {
      success: (fn) => fn({ result }),
    };
  },

  mergePlaylist(source, target) {
    const tarData = localStorage.getObject(target).tracks;
    const srcData = localStorage.getObject(source).tracks;
    tarData.forEach((tarTrack) => {
      if (!srcData.find((srcTrack) => srcTrack.id === tarTrack.id)) {
        myplaylist.add_myplaylist(source, tarTrack);
      }
    });
    return {
      success: (fn) => fn(),
    };
  },

  bootstrapTrack(sound, track, playerSuccessCallback, playerFailCallback) {
    const successCallback = playerSuccessCallback;

    function failureCallback() {
      if (localStorage.getObject('enable_auto_choose_source') === false) {
        playerFailCallback();
        return;
      }
      const failover_source_list = ['kuwo', 'qq', 'migu'];

      const getUrlPromises = failover_source_list.map(
        (source) =>
          new Promise((resolve, reject) => {
            if (track.source === source) {
              // come from same source, no need to check
              resolve();
              return;
            }
            // TODO: better query method
            const keyword = `${track.title} ${track.artist}`;
            const curpage = 1;
            const url = `/search?keywords=${keyword}&curpage=${curpage}&type=0`;
            const provider = getProviderByName(source);
            provider.search(url).success((data) => {
              for (let i = 0; i < data.result.length; i += 1) {
                const searchTrack = data.result[i];
                // compare search track and track to check if they are same
                // TODO: better similar compare method (duration, md5)
                if (
                  !searchTrack.disable &&
                  searchTrack.title === track.title &&
                  searchTrack.artist === track.artist
                ) {
                  const soundInfo = {};
                  provider.bootstrap_track(
                    soundInfo,
                    searchTrack,
                    () => {
                      reject(soundInfo.url); // Use Reject to return immediately
                    },
                    resolve
                  );
                  return;
                }
              }
              resolve();
            });
          })
      );
      // TODO: Use Promise.any() in ES2021 replace the tricky workaround
      Promise.all(getUrlPromises)
        .then(playerFailCallback)
        .catch((url) => {
          // eslint-disable-next-line no-param-reassign
          sound.url = url;
          playerSuccessCallback();
        });
    }

    const provider = getProviderByName(track.source);

    provider.bootstrap_track(sound, track, successCallback, failureCallback);
  },
};

// eslint-disable-next-line no-unused-vars
const loWeb = MediaService;
