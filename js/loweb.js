/* global localStorage angular getParameterByName */
/* global netease xiami qq kugou kuwo bilibili myplaylist */
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
    default:
      return null;
  }
}

function getAllProviders() {
  return [netease, xiami, qq, kugou, kuwo, bilibili, migu];
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
    case 'my':
      return myplaylist;
    default:
      return null;
  }
}

ngloWebManager.factory('loWeb', ['$rootScope', '$log', '$http', '$httpParamSerializerJQLike',
  ($rootScope, $log, $http, $httpParamSerializerJQLike) => ({
    get(url) {
      const path = url.split('?')[0];
      if (path === '/show_playlist') {
        const source = getParameterByName('source', url);
        const provider = getProviderByName(source);
        return provider.show_playlist(url, $http);
      }
      if (path === '/playlist') {
        const list_id = getParameterByName('list_id', url);
        const provider = getProviderByItemId(list_id);
        return provider.get_playlist(url, $http, $httpParamSerializerJQLike);
      }
      if (path === '/search') {
        const source = getParameterByName('source', url);
        const provider = getProviderByName(source);
        return provider.search(url, $http, $httpParamSerializerJQLike);
      }
      if (path === '/lyric') {
        const track_id = getParameterByName('track_id', url);
        const provider = getProviderByItemId(track_id);
        return provider.lyric(url, $http, $httpParamSerializerJQLike);
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
          success: fn => fn({result})
        };
      }
      return null;
    },
    post(request) {
      const path = request.url.split('?')[0];
      if (path === '/clone_playlist') {
        const playlist_type = getParameterByName('playlist_type', `${request.url}?${request.data}`);
        const list_id = getParameterByName('list_id', `${request.url}?${request.data}`);
        const provider = getProviderByItemId(list_id);
        const url = `/playlist?list_id=${list_id}`;
        return {
          success: (fn) => {
            provider.get_playlist(url, $http, $httpParamSerializerJQLike).success((data) => {
              myplaylist.save_myplaylist(playlist_type, data);
              fn();
            });
          },
        };
      }
      if (path === '/remove_myplaylist') {
        const playlist_type = getParameterByName('playlist_type', `${request.url}?${request.data}`);
        const list_id = getParameterByName('list_id', `${request.url}?${request.data}`);
        myplaylist.remove_myplaylist(playlist_type, list_id);
        return {
          success: fn => fn(),
        };
      }
      if (path === '/add_myplaylist') {
        const list_id = getParameterByName('list_id', `${request.url}?${request.data}`);
        const track_json = getParameterByName('track', `${request.url}?${request.data}`);
        const track = JSON.parse(track_json);
        myplaylist.add_myplaylist(list_id, track);
        return {
          success: fn => fn(),
        };
      }

      if (path === '/remove_track_from_myplaylist') {
        const list_id = getParameterByName('list_id', `${request.url}?${request.data}`);
        const track_id = getParameterByName('track_id', `${request.url}?${request.data}`);
        myplaylist.remove_from_myplaylist(list_id, track_id);
        return {
          success: fn => fn(),
        };
      }
      if (path === '/create_myplaylist') {
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
      if (path === '/edit_myplaylist') {
        const list_id = getParameterByName('list_id', `${request.url}?${request.data}`);
        const title = getParameterByName('title', `${request.url}?${request.data}`);
        const cover_img_url = getParameterByName('cover_img_url', `${request.url}?${request.data}`);
        myplaylist.edit_myplaylist(list_id, title, cover_img_url);
        return {
          success: fn => fn(),
        };
      }
      if (path === '/parse_url') {
        const url = getParameterByName('url', `${request.url}?${request.data}`);
        const providers = getAllProviders();
        let result = undefined;
        providers.forEach((provider)=>{
          let r = provider.parse_url(url);
          if (r !== undefined) {
            result = r;
          }
        });
        return {
          success: fn => fn({ result }),
        };
      }
      if (path === '/merge_playlist') {
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
