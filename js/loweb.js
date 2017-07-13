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
    if (prefix == 'my') {
        return myplaylist;
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
                return provider.get_playlist(url, $http, $httpParamSerializerJQLike);
            }
            if (url.search('/search') != -1) {
                var source = getParameterByName('source', url);
                var provider = getProviderByName(source);
                return provider.search(url, $http, $httpParamSerializerJQLike);
            }
            if (url.search('/lyric') != -1) {
                var track_id = getParameterByName('track_id', url);
                var provider = getProviderByItemId(track_id);
                return provider.lyric(url, $http, $httpParamSerializerJQLike);
            }
            if (url.search('/show_myplaylist') != -1) {
                return myplaylist.show_myplaylist();
            }
        },
        post: function(request) {
            if (request.url.search('/clone_playlist') != -1) {
                var list_id = getParameterByName('list_id', url+'?'+request.data);
                var provider = getProviderByItemId(list_id);
                var url = '/playlist?list_id=' + list_id;
                return {
                    success: function(fn) {
                        provider.get_playlist(url, $http).success(function(data){
                            myplaylist.save_myplaylist(data);
                            fn();
                        });
                    }
                };
            }
            if (request.url.search('/remove_myplaylist') != -1) {
                var list_id = getParameterByName('list_id', url+'?'+request.data);
                myplaylist.remove_myplaylist(list_id);
                return {
                    success: function(fn) {
                        fn();
                    }
                };
            }
            if (request.url.search('/add_myplaylist') != -1) {
                var list_id = getParameterByName('list_id', url+'?'+request.data);
                var track_json = getParameterByName('track', url+'?'+request.data);
                var track = JSON.parse(track_json);
                myplaylist.add_myplaylist(list_id, track);
                return {
                    success: function(fn) {
                        fn();
                    }
                };
            }
            if (request.url.search('/remove_track_from_myplaylist') != -1) {
                var list_id = getParameterByName('list_id', url+'?'+request.data);
                var track_id = getParameterByName('track_id', url+'?'+request.data);
                myplaylist.remove_from_myplaylist(list_id, track_id);
                return {
                    success: function(fn) {
                        fn();
                    }
                };
            }
            if (request.url.search('/create_myplaylist') != -1) {
                var list_title = getParameterByName('list_title', url+'?'+request.data);
                var track_json = getParameterByName('track', url+'?'+request.data);
                var track = JSON.parse(track_json);
                myplaylist.create_myplaylist(list_title, track);
                return {
                    success: function(fn) {
                        fn();
                    }
                };
            }
            if (request.url.search('/edit_myplaylist') != -1) {
                var list_id = getParameterByName('list_id', url+'?'+request.data);
                var title = getParameterByName('title', url+'?'+request.data);
                var cover_img_url = getParameterByName('cover_img_url', url+'?'+request.data);
                myplaylist.edit_myplaylist(list_id, title, cover_img_url);
                return {
                    success: function(fn) {
                        fn();
                    }
                };
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
