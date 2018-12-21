var xiami = (function() {
    'use strict';
    function caesar(location){
        var num = location[0];
        var avg_len = Math.floor(location.slice(1).length / num);
        var remainder = location.slice(1).length % num;

        var result = [];
        for (var i=0; i<remainder; i++) {
            var line = location.slice(i * (avg_len + 1) + 1, (i + 1) * (avg_len + 1) + 1);
            result.push(line);
        }

        for (var i=0; i<num-remainder; i++) {
            var line = location.slice((avg_len + 1) * remainder).slice(i * avg_len + 1, (i + 1) * avg_len + 1);
            result.push(line);
        }

        var s = [];
        for (var i=0; i< avg_len; i++) {
            for (var j=0; j<num; j++){
                s.push(result[j][i]);
            }
        }

        for (var i=0; i<remainder; i++) {
            s.push(result[i].slice(-1));
        }

        return unescape(s.join('')).replace(/\^/g, '0');
    }

    function handleProtocolRelativeUrl(url){
        var regex = /^.*?\/\//;
        var result = url.replace(regex, 'http://');
        return result;
    }

    function xm_retina_url(s){
        if (s.slice(-6, -4) == '_1') {
            return s.slice(0, -6) + s.slice(-4);
        }
        return s;
    }

    function xm_get_token(callback) {
        var domain = 'https://www.xiami.com';
        var name = 'xm_sg_tk';
        var cookieProvider = null;
        if (typeof chrome !== 'undefined') {
            cookieProvider = chrome;
            cookieProvider.cookies.get({url: domain, name:name}, function(cookie) {
                if (cookie == null) {
                    return callback('');
                }
                return callback(cookie.value);
            });
        }
        else {
            var remote = require('electron').remote;
            cookieProvider = remote.session.defaultSession;
            cookieProvider.cookies.get({domain: '.xiami.com', name:name}, function(err, cookie) {
                if (cookie.length == 0) {
                    return callback('');
                }
                return callback(cookie[0].value);
            });
        }

    }

    function xm_cookie_get(hm, api, params, callback) {
        xm_get_token(function(token){
            var url = xm_get_api_url(api, params, token);
            hm.get(url).then(function(response) {
                if (response.data.code == "SG_TOKEN_EMPTY" || response.data.code == "SG_TOKEN_EXPIRED"||response.data.code == "SG_INVALID") {
                    // token expire, refetch token and start get url
                    xm_get_token(function(token){
                        var url = xm_get_api_url(api, params, token);
                        hm.get(url).then(function(response) {
                            callback(response);
                        });
                    });
                }
                else {
                    callback(response);
                }
            });
        });
    }

    function xm_get_api_url(api, params, token) {
        var params_string = JSON.stringify(params);
        var origin = token.split('_')[0] + '_xmMain_' + api + '_' + params_string;
        var sign = MD5(origin);
        var baseUrl = 'https://www.xiami.com';
        return encodeURI(baseUrl + api + '?_q=' + params_string + '&_s=' + sign);
    }

    function xm_get_low_quality_img_url(url) {
        return url + '?x-oss-process=image/resize,m_fill,limit_0,s_330/quality,q_80';
    }

    var xm_show_playlist = function(url, hm) {
        var offset = getParameterByName("offset",url);
        var page = offset/30 + 1;
        var pageSize = 60;

        return {
            success: function(fn) {
                var result = [];
                var api = '/api/list/collect';
                var params = {"pagingVO":{"page":page,"pageSize":pageSize},"dataType":"system"};
                xm_cookie_get(hm, api, params, function(response){
                    for(var i=0; i<response.data.result.data.collects.length; i++) {
                        var d = response.data.result.data.collects[i];
                        var default_playlist = {
                            'cover_img_url' : '',
                            'title': '',
                            'id': '',
                            'source_url': ''
                        };
                        default_playlist.cover_img_url = xm_get_low_quality_img_url(d.collectLogo);
                        default_playlist.title = d.collectName;
                        var list_id = d.listId;
                        default_playlist.id = 'xmplaylist_' + list_id;
                        default_playlist.source_url = 'http://www.xiami.com/collect/' + list_id;
                        result.push(default_playlist);
                    }
                    return fn({"result":result});
                });
            }
        };
    }

    var xm_get_playlist = function(url, hm, se) {
        var list_id = getParameterByName('list_id', url).split('_').pop();

        return {
            success: function(fn) {
                var api = '/api/collect/initialize';
                var params = {"listId": parseInt(list_id)};
                xm_cookie_get(hm, api, params, function(response){
                    var collect = response.data.result.data.collectDetail;
                    var info = {
                        'cover_img_url': xm_get_low_quality_img_url(collect.collectLogo),
                        'title': collect.collectName,
                        'id': 'xmplaylist_' + list_id,
                        'source_url': 'http://www.xiami.com/collect/' + list_id
                    };
                    var tracks = [];
                    $.each(response.data.result.data.collectSongs, function(index, item){
                        var track = xm_convert_song2(item, 'artist_name');
                        tracks.push(track);
                    });
                    return fn({"tracks":tracks, "info":info});
                });
            }
        };
    }

    var xm_bootstrap_track = function(sound, track, success, failure, hm, se) {
        var target_url = 'http://www.xiami.com/song/playlist/id/' + track.id.slice('xmtrack_'.length) +
            '/object_name/default/object_id/0/cat/json';
        hm.get(target_url).then(function(response) {
            var data = response.data;
            if (data.data.trackList == null) {
                failure();
                return;
            }
            var location = data.data.trackList[0].location;
            sound.url = handleProtocolRelativeUrl(caesar(location));
            track.img_url = xm_retina_url(handleProtocolRelativeUrl(data.data.trackList[0].pic));
            track.album = data.data.trackList[0].album_name;
            track.album_id = 'xmalbum_' + data.data.trackList[0].album_id;
            track.lyric_url = handleProtocolRelativeUrl(data.data.trackList[0].lyric_url);
            success();
        });
    }

    function xm_convert_song(song_info, artist_field_name) {
        var track = {
            'id': 'xmtrack_' + song_info.song_id,
            'title': song_info.song_name,
            'artist': song_info[artist_field_name],
            'artist_id': 'xmartist_' + song_info.artist_id,
            'album': song_info.album_name,
            'album_id': 'xmalbum_' + song_info.album_id,
            'source': 'xiami',
            'source_url': 'http://www.xiami.com/song/' + song_info.song_id,
            'img_url': song_info.album_logo,
            'url': 'xmtrack_' + song_info.song_id,
            'lyric_url': song_info.lyric_file
        };
        return track;
    }

    function xm_convert_song2(song_info, artist_field_name) {
        var track = {
            'id': 'xmtrack_' + song_info.songId,
            'title': song_info.songName,
            'artist': song_info.artistName,
            'artist_id': 'xmartist_' + song_info.artistId,
            'album': song_info.albumName,
            'album_id': 'xmalbum_' + song_info.albumId,
            'source': 'xiami',
            'source_url': 'http://www.xiami.com/song/' + song_info.songId,
            'img_url': song_info.albumLogo,
            'url': 'xmtrack_' + song_info.songId,
            //'lyric_url': song_info.lyricInfo.lyricFile
        };
        if (song_info.lyricInfo != undefined) {
            track.lyric_url = song_info.lyricInfo.lyricFile;
        }
        return track;
    }

    var xm_search = function(url, hm, se) {
        return {
            success: function(fn) {
                var keyword = getParameterByName('keywords', url);
                var curpage = getParameterByName('curpage', url);
                var target_url = 'http://api.xiami.com/web?v=2.0&app_key=1&key=' + keyword + '&page='+ curpage +'&limit=20&callback=jsonp154&r=search/songs';
                hm({
                    url:target_url,
                    method: 'GET',
                    transformResponse: undefined
                })
                .then(function(response) {
                    var data = response.data;
                    data = data.slice('jsonp154('.length, -')'.length);
                    data = JSON.parse(data);
                    var tracks = [];
                    $.each(data.data.songs, function(index, item){
                        var track = xm_convert_song(item, 'artist_name');
                        tracks.push(track);
                    });
                    return fn({"result":tracks,"total":data.data.total});
                });
            }
        };
    }

    var xm_album = function(url, hm, se) {
        return {
            success: function(fn) {
                var album_id = getParameterByName('list_id', url).split('_').pop();
                var target_url = 'http://api.xiami.com/web?v=2.0&app_key=1&id=' + album_id +
                '&page=1&limit=20&callback=jsonp217&r=album/detail';
                hm({
                    url:target_url,
                    method: 'GET',
                    transformResponse: undefined
                })
                .then(function(response) {
                    var data = response.data;
                    data = data.slice('jsonp217('.length, -')'.length);
                    data = JSON.parse(data);

                    var info = {
                        'cover_img_url': data.data.album_logo,
                        'title': data.data.album_name,
                        'id': 'xmalbum_' + data.data.album_id,
                        'source_url': 'http://www.xiami.com/album/' + data.data.album_id
                    };

                    var tracks = [];
                    $.each(data.data.songs, function(index, item){
                        var track = xm_convert_song(item, 'singers');
                        tracks.push(track);
                    });
                    return fn({"tracks":tracks,"info": info});
                });
            }
        };
    }

    var xm_artist = function (url, hm, se) {
        return {
            success: function(fn) {
                var artist_id = getParameterByName('list_id', url).split('_').pop();

                var target_url = 'http://api.xiami.com/web?v=2.0&app_key=1&id=' + artist_id +
                    '&page=1&limit=20&_ksTS=1459931285956_216' +
                    '&callback=jsonp217&r=artist/detail';

                hm({
                    url:target_url,
                    method: 'GET',
                    transformResponse: undefined
                })
                .then(function(response) {
                    var data = response.data;
                    data = data.slice('jsonp217('.length, -')'.length);
                    data = JSON.parse(data);

                    var info = {
                        'cover_img_url': xm_retina_url(data.data.logo),
                        'title': data.data.artist_name,
                        'id': 'xmartist_' + artist_id,
                        'source_url': 'http://www.xiami.com/artist/' + artist_id
                    };

                    target_url = 'http://api.xiami.com/web?v=2.0&app_key=1&id=' + artist_id +
                        '&page=1&limit=20&callback=jsonp217&r=artist/hot-songs'
                    hm({
                        url:target_url,
                        method: 'GET',
                        transformResponse: undefined
                    })
                    .then(function(response) {
                        var data = response.data;
                        data = data.slice('jsonp217('.length, -')'.length);
                        data = JSON.parse(data);

                        var tracks = [];
                        $.each(data.data, function(index, item){
                            var track = xm_convert_song(item, 'singers');
                            track.artist_id = 'xmartist_' + artist_id;
                            tracks.push(track);
                        });
                        return fn({"tracks":tracks,"info": info});
                    });
                });
            }
        };
    }

    var xm_lyric = function (url, hm, se) {
        var track_id = getParameterByName('track_id', url).split('_').pop();
        var lyric_url = getParameterByName('lyric_url', url);
        return {
            success: function(fn) {
                hm({
                    url: lyric_url,
                    method: 'GET',
                    transformResponse: undefined
                }).then(function(response) {
                    var data = response.data;
                    return fn({"lyric":data});
                });
            }
        };
    }

    var xm_parse_url = function(url) {
        var result = undefined;
        var match = /\/\/www.xiami.com\/collect\/([0-9]+)/.exec(url);
        if (match != null) {
            var playlist_id = match[1];
            result = {'type': 'playlist', 'id': 'xmplaylist_' + playlist_id};
        }
        return result;
    }

var get_playlist = function(url, hm, se) {
    var list_id = getParameterByName('list_id', url).split('_')[0];
    if (list_id == 'xmplaylist') {
        return xm_get_playlist(url, hm, se);
    }
    if (list_id == 'xmalbum') {
        return xm_album(url, hm, se);
    }
    if (list_id == 'xmartist') {
        return xm_artist(url, hm, se);
    }
}
return {
    show_playlist: xm_show_playlist,
    get_playlist: get_playlist,
    parse_url: xm_parse_url,
    bootstrap_track: xm_bootstrap_track,
    search: xm_search,
    lyric: xm_lyric,
};

})();