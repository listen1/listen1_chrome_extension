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
    if (sourceName == 'kugou') {
        return kugou;
    }
    if (sourceName == 'kuwo') {
        return kuwo;
    }
}

function getAllProviders(){
    return [netease, xiami, qq, kugou, kuwo];
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
    if (prefix == 'kg') {
        return kugou;
    }
    if (prefix == 'kw') {
        return kuwo;
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
                            provider.get_playlist(url, $http, $httpParamSerializerJQLike).success(function(data){
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
            if (request.url.search('/parse_url') != -1) {
                var url = getParameterByName('url', url+'?'+request.data);
                var providers = getAllProviders();
                var result = undefined;
                for(var i=0; i<providers.length; i++) {
                    var r = providers[i].parse_url(url);
                    if (r !== undefined) {
                        result = r;
                        break;
                    }
                }
                return {
                    success: function(fn){
                        return fn({'result': result});
                    }
                }
            }
			if (request.url.search('/merge_playlist') != -1) {
				var source = getParameterByName('source', url+'?'+request.data);
				var target = getParameterByName('target', url+'?'+request.data);
				var tarData = (localStorage.getObject(target)).tracks;
				var srcData = (localStorage.getObject(source)).tracks;
				var isInSourceList = false;
                for(var i in tarData){
					isInSourceList = false;
					for(var j in srcData){
						if(tarData[i].id==srcData[j].id){
							isInSourceList = true;
							break;
						}
					};
					if(!isInSourceList){
						myplaylist.add_myplaylist(source, tarData[i]);
					};
				};
                return {
                    success: function(fn) {
                        fn();
                    }
                };
            }
        },
        bootstrapTrack: function(success, failure) {
            return function(sound, track, playerSuccessCallback, playerFailCallback){
                // always refresh url, becaues url will expires
                // if (sound.url.search('http') != -1){
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
                var source = track.source;
                var provider = getProviderByName(source);

                provider.bootstrap_track(sound, track, successCallback, failureCallback, $http, $httpParamSerializerJQLike);

            };
        }
    };
}]);
