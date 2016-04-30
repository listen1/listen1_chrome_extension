var ngloWebManager = angular.module('loWebManager', []);

ngloWebManager.factory('loWeb', ['$rootScope', '$log', '$http', '$httpParamSerializerJQLike',
function($rootScope, $log, $http, $httpParamSerializerJQLike) {
    var response = null;
    return {
        foo: function(){
            console.log('foo');
        },
        get: function(url) {
            if (url.search('/show_playlist') != -1) {
                var source = getParameterByName('source', url);
                if (source == '0') {
                    return ne_show_playlist(url, $http);
                }
                if (source == '1') {
                    return xm_show_playlist(url, $http);
                }
                if (source == '2') {
                    return qq_show_playlist(url, $http);
                }
            }
            if (url.search('/playlist') != -1) {
                var list_id = getParameterByName('list_id', url);
                if (list_id.search('xmplaylist')!= -1) {
                    return xm_get_playlist(url, $http);
                }
                if (list_id.search('neplaylist')!= -1) {
                    return ne_get_playlist(url, $http);
                }
                 if (list_id.search('qqplaylist')!= -1) {
                    return qq_get_playlist(url, $http);
                }

            }
            if (url.search('/search') != -1) {
                var source = getParameterByName('source', url);
                if (source == '0') {
                    return ne_search(url, $http, $httpParamSerializerJQLike);
                }
                if (source == '1') {
                    return xm_search(url, $http, $httpParamSerializerJQLike);
                }
                if (source == '2') {
                    return qq_search(url, $http, $httpParamSerializerJQLike);
                }
            }
            if (url.search('/album') != -1) {
                var album_id = getParameterByName('album_id', url);
                if (album_id.search('xmalbum')!= -1) {
                    return xm_album(url, $http, $httpParamSerializerJQLike);
                }
                if (album_id.search('nealbum')!= -1) {
                    return ne_album(url, $http, $httpParamSerializerJQLike);
                }
                if (album_id.search('qqalbum')!= -1) {
                    return qq_album(url, $http, $httpParamSerializerJQLike);
                }
            }
            if (url.search('/artist') != -1) {
                var artist_id = getParameterByName('artist_id', url);
                if (artist_id.search('xmartist')!= -1) {
                    return xm_artist(url, $http, $httpParamSerializerJQLike);
                }
                if (artist_id.search('neartist')!= -1) {
                    return ne_artist(url, $http, $httpParamSerializerJQLike);
                }
                if (artist_id.search('qqartist')!= -1) {
                    return qq_artist(url, $http, $httpParamSerializerJQLike);
                }
            }

        },
        bootstrapTrack: function(sound, track, callback){
            if (sound.url.search('http') != -1){
                callback();
                return;
            }
            if(track.source == 'xiami') {
                xm_bootstrap_track(sound, track, callback, $http, $httpParamSerializerJQLike);
            }
            if(track.source == 'netease') {
                ne_bootstrap_track(sound, track, callback, $http, $httpParamSerializerJQLike);
            }
            if(track.source == 'qq') {
                qq_bootstrap_track(sound, track, callback, $http, $httpParamSerializerJQLike);
            }
        }
    };
}]);
