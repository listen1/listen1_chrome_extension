/* global localStorage angular getParameterByName */
/* global netease xiami qq kugou kuwo bilibili myplaylist */
const ngloWebManager = angular.module('loWebManager', []);

function getProviderByName(sourceName) {
  if (sourceName === 'netease') {
    return netease;
  }
  if (sourceName === 'xiami') {
    return xiami;
  }
  if (sourceName === 'qq') {
    return qq;
  }
  if (sourceName === 'kugou') {
    return kugou;
  }
  if (sourceName === 'kuwo') {
    return kuwo;
  }
  if (sourceName === 'bilibili') {
    return bilibili;
  }
  return null;
}

function getAllProviders() {
  return [netease, xiami, qq, kugou, kuwo, bilibili];
}

function getProviderByItemId(itemId) {
  const prefix = itemId.slice(0, 2);
  if (prefix === 'ne') {
    return netease;
  }
  if (prefix === 'xm') {
    return xiami;
  }
  if (prefix === 'qq') {
    return qq;
  }
  if (prefix === 'kg') {
    return kugou;
  }
  if (prefix === 'kw') {
    return kuwo;
  }
  if (prefix === 'bi') {
    return bilibili;
  }
  if (prefix === 'my') {
    return myplaylist;
  }
  return null;
}

ngloWebManager.factory('loWeb', ['$rootScope', '$log', '$http', '$httpParamSerializerJQLike',
  ($rootScope, $log, $http, $httpParamSerializerJQLike) => ({
    get(url) {
      if (url.search('/show_playlist') !== -1) {
        const source = getParameterByName('source', url);
        const provider = getProviderByName(source);
        return provider.show_playlist(url, $http);
      }
      if (url.search('/playlist') !== -1) {
        const list_id = getParameterByName('list_id', url);
        const provider = getProviderByItemId(list_id);
        return provider.get_playlist(url, $http, $httpParamSerializerJQLike);
      }
      if (url.search('/search') !== -1) {
        const source = getParameterByName('source', url);
        const provider = getProviderByName(source);
        return provider.search(url, $http, $httpParamSerializerJQLike);
      }
      if (url.search('/lyric') !== -1) {
        const track_id = getParameterByName('track_id', url);
        const provider = getProviderByItemId(track_id);
        return provider.lyric(url, $http, $httpParamSerializerJQLike);
      }
      if (url.search('/show_myplaylist') !== -1) {
        return myplaylist.show_myplaylist();
      }
      return null;
    },
    post(request) {
      if (request.url.search('/clone_playlist') !== -1) {
        const list_id = getParameterByName('list_id', `${request.url}?${request.data}`);
        const provider = getProviderByItemId(list_id);
        let url = `/playlist?list_id=${list_id}`;
        return {
          success: (fn) => {
            provider.get_playlist(url, $http, $httpParamSerializerJQLike).success((data) => {
              myplaylist.save_myplaylist(data);
              fn();
            });
          },
        };
      }
      if (request.url.search('/remove_myplaylist') !== -1) {
        const list_id = getParameterByName('list_id', `${request.url}?${request.data}`);
        myplaylist.remove_myplaylist(list_id);
        return {
          success: (fn) => {
            fn();
          },
        };
      }
      if (request.url.search('/add_myplaylist') !== -1) {
        const list_id = getParameterByName('list_id', `${request.url}?${request.data}`);
        const track_json = getParameterByName('track', `${request.url}?${request.data}`);
        const track = JSON.parse(track_json);
        myplaylist.add_myplaylist(list_id, track);
        return {
          success: (fn) => {
            fn();
          },
        };
      }
      if (request.url.search('/remove_track_from_myplaylist') !== -1) {
        const list_id = getParameterByName('list_id', `${request.url}?${request.data}`);
        const track_id = getParameterByName('track_id', `${request.url}?${request.data}`);
        myplaylist.remove_from_myplaylist(list_id, track_id);
        return {
          success: (fn) => {
            fn();
          },
        };
      }
      if (request.url.search('/create_myplaylist') !== -1) {
        const list_title = getParameterByName('list_title', `${request.url}?${request.data}`);
        const track_json = getParameterByName('track', `${request.url}?${request.data}`);
        const track = JSON.parse(track_json);
        myplaylist.create_myplaylist(list_title, track);
        return {
          success: (fn) => {
            fn();
          },
        };
      }
      if (request.url.search('/edit_myplaylist') !== -1) {
        const list_id = getParameterByName('list_id', `${request.url}?${request.data}`);
        const title = getParameterByName('title', `${request.url}?${request.data}`);
        const cover_img_url = getParameterByName('cover_img_url', `${request.url}?${request.data}`);
        myplaylist.edit_myplaylist(list_id, title, cover_img_url);
        return {
          success: fn => fn(),
        };
      }
      if (request.url.search('/parse_url') !== -1) {
        const url = getParameterByName('url', `${request.url}?${request.data}`);
        const providers = getAllProviders();
        let result;
        for (let i = 0; i < providers.length; i += 1) {
          const r = providers[i].parse_url(url);
          if (r !== undefined) {
            result = r;
            break;
          }
        }
        return {
          success: fn => fn({ result }),
        };
      }
      if (request.url.search('/merge_playlist') !== -1) {
        const source = getParameterByName('source', `${request.url}?${request.data}`);
        const target = getParameterByName('target', `${request.url}?${request.data}`);
        const tarData = (localStorage.getObject(target)).tracks;
        const srcData = (localStorage.getObject(source)).tracks;
        tarData.forEach((tarTrack) => {
          if (!srcData.find(srcTrack => srcTrack.id === tarTrack.id)) {
            myplaylist.add_myplaylist(source, tarTrack);
          }
        });
        return {
          success: fn => fn(),
        };
      }
      return null;
    },
    bootstrapTrack(success, failure) {
      return (sound, track, playerSuccessCallback, playerFailCallback) => {
        // always refresh url, becaues url will expires
        // if (sound.url.search('http') !== -1){
        //     callback();
        //     return;
        // }
        function successCallback() {
          playerSuccessCallback();
          success();
        }

        function failureCallback() {
          playerFailCallback();
          failure();
        }
        const { source } = track;
        const provider = getProviderByName(source);

        provider.bootstrap_track(sound, track, successCallback,
          failureCallback, $http, $httpParamSerializerJQLike);
      };
    },
  }),
]);
