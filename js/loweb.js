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
    case 'localmusic':
      return localmusic;
    default:
      return null;
  }
}

function getAllProviders() {
  return [netease, xiami, qq, kugou, kuwo, bilibili, migu];
}

function getAllSearchProviders(){
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
        if (source === 'allmusic'){
          // search all platform and merge result
          const callbackArray = getAllSearchProviders().map(function(p){
            return fn =>{
              p.search(url, $http, $httpParamSerializerJQLike).success(r=>{
                fn(null, r);
              });
            };
          });
          return {
            success: fn => {
              return async.parallel(callbackArray, function(err, platformResultArray){
                // TODO: nicer pager, playlist support
                let result = {result: [], total: 1000, type: '0'};
                const maxLength = Math.max.apply(Math, platformResultArray.map(elem=>elem.result.length));
                for(let i=0; i<maxLength; i++){
                  platformResultArray.forEach(function(elem){
                    if (i<elem.result.length){
                      result.result.push(elem.result[i]);
                    }
                  });
                }
                return fn(result);
              });
            }
          };
        }
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
      if (path === '/add_playlist') {
        const list_id = getParameterByName('list_id', `${request.url}?${request.data}`);
        const provider = getProviderByItemId(list_id);
        const tracks_json = getParameterByName('tracks', `${request.url}?${request.data}`);
        const tracks = JSON.parse(tracks_json);
        return provider.add_playlist(list_id, tracks);
      }
      if (path === '/remove_track_from_myplaylist') {
        const list_id = getParameterByName('list_id', `${request.url}?${request.data}`);
        const track_id = getParameterByName('track_id', `${request.url}?${request.data}`);
        myplaylist.remove_from_myplaylist(list_id, track_id);
        return {
          success: fn => fn(),
        };
      }
      if (path === '/remove_track_from_playlist') {
        const list_id = getParameterByName('list_id', `${request.url}?${request.data}`);
        const track_id = getParameterByName('track_id', `${request.url}?${request.data}`);
        const provider = getProviderByItemId(list_id);
        return provider.remove_from_playlist(list_id, track_id);
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
    bootstrapTrack(success, failure, getAutoChooseSource) {
      function getTrackFromSame(track, source, callback){
        if (track.source === source){
          // come from same source, no need to check
          return callback(null);
        }
        //TODO: better query method
        const keyword = track.title + ' ' + track.artist;
        const curpage = 1;
        const url = `/search?source=${source}&keywords=${keyword}&curpage=${curpage}`;
        const provider = getProviderByName(source);
        provider.search(url, $http, $httpParamSerializerJQLike).success((data)=>{
          for(var i = 0; i < data.result.length; i++) {
            const searchTrack = data.result[i];
            // compare search track and track to check if they are same
            // TODO: better similar compare method (duration, md5)
            if (!searchTrack.disable){
              if ((searchTrack.title === track.title) && (searchTrack.artist === track.artist)){
                return callback(searchTrack);
              }
            }
          };
          return callback(null);
        });
      }

      function getUrlFromTrack(track, source, callback) {
        const provider = getProviderByName(source);
        const soundInfo = {}
        provider.bootstrap_track(soundInfo, track, () => {
          callback(soundInfo.url);
        },
        ()=>{
          callback(null);
        }, $http, $httpParamSerializerJQLike);
      }

      function getUrlFromSame(track, source, callback){
        getTrackFromSame(track, source, (sameTrack)=>{
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
          if(!getAutoChooseSource()){
            playerFailCallback();
            failure();
            return 
          }
          const failover_source_list = ['kuwo', 'qq', 'migu'];

          function makeFn(track, source){
            return function(cb){
              getUrlFromSame(track, source, function(url){
                // pass url as error to return instant when any of source available
                return cb(url);
              });
            }
          }
          const getUrlFnList = [];
          for (var i=0; i<failover_source_list.length; i++){
            getUrlFnList.push(makeFn(track, failover_source_list[i]));
          }

          async.parallel(
            getUrlFnList,
            function(err) {
              if(err){
                // use error to make instant return, error contains url
                sound.url = err;
                playerSuccessCallback();
                success();
                return;
              }

              playerFailCallback();
              failure();
            });
        }

        const { source } = track;
        const provider = getProviderByName(source);

        provider.bootstrap_track(sound, track, successCallback,
          failureCallback, $http, $httpParamSerializerJQLike);
      };
    },
  }),
]);
