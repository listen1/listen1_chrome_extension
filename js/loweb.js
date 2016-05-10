var ngloWebManager = angular.module('loWebManager', []);

function getProviderByName(sourceName) {
    if (sourceName == 'netease') {
        return netease;
    }
    if (sourceName == 'xiami') {
        return xiami;
    }
    if (sourceName == 'qq') {
        return qq;
    }
}

function getProviderByItemId(itemId) {
    var prefix = itemId.slice(0,2);
    if (prefix == 'ne') {
        return netease;
    }
    if (prefix == 'xm') {
        return xiami;
    }
    if (prefix == 'qq') {
        return qq;
    }
}

ngloWebManager.factory('loWeb', ['$rootScope', '$log', '$http', '$httpParamSerializerJQLike',
function($rootScope, $log, $http, $httpParamSerializerJQLike) {
    return {
        get: function(url) {
            if (url.search('/show_playlist') != -1) {
                var source = getParameterByName('source', url);
                var provider = getProviderByName(source);
                return provider.show_playlist(url, $http);
            }
            if (url.search('/playlist') != -1) {
                var list_id = getParameterByName('list_id', url);
                var provider = getProviderByItemId(list_id);
                return provider.get_playlist(url, $http);
            }
            if (url.search('/search') != -1) {
                var source = getParameterByName('source', url);
                var provider = getProviderByName(source);
                return provider.search(url, $http, $httpParamSerializerJQLike);
            }
            if (url.search('/album') != -1) {
                var album_id = getParameterByName('album_id', url);
                var provider = getProviderByItemId(album_id);
                return provider.album(url, $http, $httpParamSerializerJQLike);
            }
            if (url.search('/artist') != -1) {
                var artist_id = getParameterByName('artist_id', url);
                var provider = getProviderByItemId(artist_id);
                return provider.artist(url, $http, $httpParamSerializerJQLike);
            }
            if (url.search('/lyric') != -1) {
                var track_id = getParameterByName('track_id', url);
                var provider = getProviderByItemId(track_id);
                return provider.lyric(url, $http, $httpParamSerializerJQLike);
            }

        },
        bootstrapTrack: function(success, failure) {
            return function(sound, track, callback){
                // always refresh url, becaues url will expires
                // if (sound.url.search('http') != -1){
                //     callback();
                //     return;
                // }
                function successCallback() {
                    callback();
                    success();
                }

                function failureCallback() {
                    failure();
                }
                var source = track.source;
                var provider = getProviderByName(source);

                provider.bootstrap_track(sound, track, successCallback, failureCallback, $http, $httpParamSerializerJQLike);

            };
        }
    };
}]);
