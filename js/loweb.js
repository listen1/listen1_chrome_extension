/* global angular getParameterByName async */
/* global netease xiami qq kugou kuwo bilibili migu localmusic myplaylist */
const ngloWebManager = angular.module('loWebManager', []);

function getProviderByName(sourceName) {
  switch (sourceName) {
    case 'netease':
      return netease;
    case 'xiami':
      return xiami;
    case 'qq':
      return qq;
    case 'kugou':
      return kugou;
    case 'kuwo':
      return kuwo;
    case 'bilibili':
      return bilibili;
    case 'migu':
      return migu;
    case 'localmusic':
      return localmusic;
    default:
      return null;
  }
}

function getAllProviders() {
  return [netease, xiami, qq, kugou, kuwo, bilibili, migu];
}

function getAllSearchProviders() {
  return [netease, xiami, qq, kugou, kuwo, migu];
}

function getProviderByItemId(itemId) {
  const prefix = itemId.slice(0, 2);
  switch (prefix) {
    case 'ne':
      return netease;
    case 'xm':
      return xiami;
    case 'qq':
      return qq;
    case 'kg':
      return kugou;
    case 'kw':
      return kuwo;
    case 'bi':
      return bilibili;
    case 'mg':
      return migu;
    case 'lm':
      return localmusic;
    case 'my':
      return myplaylist;
    default:
      return null;
  }
}

/* cache for all playlist request except myplaylist and localmusic */
const CACHE_SIZE = 100;
const maxAge = 60 * 60 * 1000; // 1 hour cache expire;
const playlistCache = new Cache(CACHE_SIZE);

function cached(key, instance) {
  const nowts = +new Date();
  const hit = playlistCache.getItem(key);
  const list_id = getParameterByName('list_id', key);
  const provider = getProviderByItemId(list_id);
  const shouldUseCache = (provider !== myplaylist) && (provider !== localmusic);
  if (shouldUseCache && (hit !== null) && (nowts - hit.ts <= maxAge)) {
    return {
      success: (fn) => fn(hit.playlist),
    };
  }
  return {
    success: (fn) => instance.success((playlist) => {
      playlistCache.setItem(key, { playlist, ts: nowts });
      fn(playlist);
    }),
  };
}

ngloWebManager.factory('loWeb', ['$rootScope', '$log',
  () => ({
    get(url) {
      const path = url.split('?')[0];
      if (path === '/show_playlist') {
        const source = getParameterByName('source', url);
        const provider = getProviderByName(source);
        return provider.show_playlist(url);
      }
      if (path === '/playlist') {
        const list_id = getParameterByName('list_id', url);
        const useCache = getParameterByName('use_cache', url) || '1';

        const provider = getProviderByItemId(list_id);
        if (useCache === '0') {
          return provider.get_playlist(url);
        }
        return cached(url, provider.get_playlist(url));
      }
      if (path === '/search') {
        const source = getParameterByName('source', url);
        if (source === 'allmusic') {
          // search all platform and merge result
          const callbackArray = getAllSearchProviders().map((p) => (fn) => {
            p.search(url).success((r) => {
              fn(null, r);
            });
          });
          return {
            success: (fn) => async.parallel(callbackArray, (err, platformResultArray) => {
              // TODO: nicer pager, playlist support
              const result = { result: [], total: 1000, type: platformResultArray[0].type };
              const maxLength = Math.max(...platformResultArray.map((elem) => elem.result.length));
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
      }
      if (path === '/lyric') {
        const track_id = getParameterByName('track_id', url);
        const provider = getProviderByItemId(track_id);
        return provider.lyric(url);
      }
      if (path === '/show_myplaylist') {
        return myplaylist.show_myplaylist('my');
      }
      if (path === '/show_favoriteplaylist') {
        return myplaylist.show_myplaylist('favorite');
      }

      if (path === '/playlist_contains') {
        const list_id = getParameterByName('list_id', url);
        const playlist_type = getParameterByName('type', url);
        const result = myplaylist.myplaylist_containers(playlist_type, list_id);
        return {
          success: (fn) => fn({ result }),
        };
      }
      return null;
    },
    post(request) {
      const path = request.url.split('?')[0];
      if (path === '/clone_playlist') {
        const { playlist_type, list_id } = request.data;
        const provider = getProviderByItemId(list_id);
        const url = `/playlist?list_id=${list_id}`;
        return {
          success: (fn) => {
            provider.get_playlist(url).success((data) => {
              myplaylist.save_myplaylist(playlist_type, data);
              fn();
            });
          },
        };
      }
      if (path === '/remove_myplaylist') {
        myplaylist.remove_myplaylist(request.data.playlist_type, request.data.list_id);
        return {
          success: (fn) => fn(),
        };
      }
      if (path === '/add_myplaylist') {
        const newPlaylist = myplaylist.add_myplaylist(request.data.list_id, request.data.track);
        return {
          success: (fn) => fn(newPlaylist),
        };
      }
      if (path === '/add_playlist') {
        const provider = getProviderByItemId(request.data.list_id);
        return provider.add_playlist(request.data.list_id, request.data.tracks);
      }
      if (path === '/remove_track_from_myplaylist') {
        myplaylist.remove_from_myplaylist(request.data.list_id, request.data.track_id);
        return {
          success: (fn) => fn(),
        };
      }
      if (path === '/remove_track_from_playlist') {
        const provider = getProviderByItemId(request.data.list_id);
        return provider.remove_from_playlist(request.data.list_id, request.data.track_id);
      }
      if (path === '/create_myplaylist') {
        myplaylist.create_myplaylist(request.data.list_title, request.data.track);
        return {
          success: (fn) => {
            fn();
          },
        };
      }
      if (path === '/edit_myplaylist') {
        myplaylist.edit_myplaylist(request.data.list_id,
          request.data.title, request.data.cover_img_url);
        return {
          success: (fn) => fn(),
        };
      }
      if (path === '/parse_url') {
        const providers = getAllProviders();
        let result;
        providers.forEach((provider) => {
          const r = provider.parse_url(request.data.url);
          if (r !== undefined) {
            result = r;
          }
        });
        return {
          success: (fn) => fn({ result }),
        };
      }
      if (path === '/merge_playlist') {
        const { source, target } = request.data;

        const tarData = (localStorage.getObject(target)).tracks;
        const srcData = (localStorage.getObject(source)).tracks;
        tarData.forEach((tarTrack) => {
          if (!srcData.find((srcTrack) => srcTrack.id === tarTrack.id)) {
            myplaylist.add_myplaylist(source, tarTrack);
          }
        });
        return {
          success: (fn) => fn(),
        };
      }
      return null;
    },
    bootstrapTrack(success, failure, getAutoChooseSource) {
      // eslint-disable-next-line consistent-return
      function getTrackFromSame(track, source, callback) {
        if (track.source === source) {
          // come from same source, no need to check
          return callback(null);
        }
        // TODO: better query method
        const keyword = `${track.title} ${track.artist}`;
        const curpage = 1;
        const url = `/search?source=${source}&keywords=${keyword}&curpage=${curpage}&type=0`;
        const provider = getProviderByName(source);
        provider.search(url).success((data) => {
          for (let i = 0; i < data.result.length; i += 1) {
            const searchTrack = data.result[i];
            // compare search track and track to check if they are same
            // TODO: better similar compare method (duration, md5)
            if (!searchTrack.disable) {
              if ((searchTrack.title === track.title) && (searchTrack.artist === track.artist)) {
                return callback(searchTrack);
              }
            }
          }
          return callback(null);
        });
      }

      function getUrlFromTrack(track, source, callback) {
        const provider = getProviderByName(source);
        const soundInfo = {};
        provider.bootstrap_track(soundInfo, track, () => {
          callback(soundInfo.url);
        },
        () => {
          callback(null);
        });
      }

      function getUrlFromSame(track, source, callback) {
        getTrackFromSame(track, source, (sameTrack) => {
          if (sameTrack === null) {
            return callback(null);
          }
          return getUrlFromTrack(sameTrack, source, callback);
        });
      }

      return (sound, track, playerSuccessCallback, playerFailCallback) => {
        function successCallback() {
          playerSuccessCallback();
          success();
        }

        function failureCallback() {
          if (!getAutoChooseSource()) {
            playerFailCallback();
            failure();
            return;
          }
          const failover_source_list = ['kuwo', 'qq', 'migu'];

          function makeFn(_track, source) {
            return (cb) => {
              getUrlFromSame(_track, source, (url) => cb(url));
              // pass url as error to return instant when any of source available
            };
          }
          const getUrlFnList = [];
          for (let i = 0; i < failover_source_list.length; i += 1) {
            getUrlFnList.push(makeFn(track, failover_source_list[i]));
          }

          async.parallel(
            getUrlFnList,
            (err) => {
              if (err) {
                // use error to make instant return, error contains url
                // eslint-disable-next-line no-param-reassign
                sound.url = err;
                playerSuccessCallback();
                success();
                return;
              }

              playerFailCallback();
              failure();
            },
          );
        }

        const { source } = track;
        const provider = getProviderByName(source);

        provider.bootstrap_track(sound, track, successCallback,
          failureCallback);
      };
    },
  }),
]);
