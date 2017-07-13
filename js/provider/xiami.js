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

    function xm_retina_url(s){
        return s.slice(0, -6) + s.slice(-4);
    }

    var xm_show_playlist = function(url, hm) {
        var offset = getParameterByName("offset",url)
        var page = offset/30 + 1

        var target_url = 'http://www.xiami.com/collect/recommend/page/' + page;

        return {
            success: function(fn) {
                var result = [];
                hm.get(target_url).success(function(data) {
                    data = $.parseHTML(data);
                    $(data).find('.block_list ul li').each(function(){
                        var default_playlist = {
                            'cover_img_url' : '',
                            'title': '',
                            'id': '',
                            'source_url': ''
                        };
                        default_playlist.cover_img_url = $(this).find('img')[0].src;
                        default_playlist.title = $(this).find('h3 a')[0].title;
                        var xiami_url = $(this).find('h3 a')[0].href;
                        var list_id = xiami_url.split('?')[0].split('/').pop()
                        default_playlist.id = 'xmplaylist_' + list_id;
                        default_playlist.source_url = 'http://www.xiami.com/collect/' + list_id;
                        result.push(default_playlist);
                    });
                    return fn({"result":result});
                });
            }
        };
    }

    var xm_get_playlist = function(url, hm, se) {
        var list_id = getParameterByName('list_id', url).split('_').pop();

        return {
            success: function(fn) {
                var target_url = 'http://api.xiami.com/web?v=2.0&app_key=1&id=' + list_id +
                    '&callback=jsonp122&r=collect/detail';
                hm({
                    url:target_url,
                    method: 'GET',
                    transformResponse: undefined
                })
                .success(function(data) {
                    data = data.slice('jsonp122('.length, -')'.length);
                    data = JSON.parse(data);

                    var info = {
                        'cover_img_url': xm_retina_url(data.data.logo),
                        'title': data.data.collect_name,
                        'id': 'xmplaylist_' + list_id,
                        'source_url': 'http://www.xiami.com/collect/' + list_id
                    };

                    var tracks = [];
                    $.each(data.data.songs, function(index, item){
                        var track = xm_convert_song(item, 'artist_name');
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
        hm.get(target_url).success(function(data) {
            if (data.data.trackList == null) {
                failure();
                return;
            }
            var location = data.data.trackList[0].location;
            sound.url = caesar(location);
            track.img_url = data.data.trackList[0].pic;
            track.album = data.data.trackList[0].album_name;
            track.album_id = 'xmalbum_' + data.data.trackList[0].album_id;
            track.lyric_url = data.data.trackList[0].lyric_url;
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

    var xm_search = function(url, hm, se) {
        return {
            success: function(fn) {
                var keyword = getParameterByName('keywords', url);
                var target_url = 'http://api.xiami.com/web?v=2.0&app_key=1&key=' + keyword + '&page=1&limit=50&callback=jsonp154&r=search/songs';
                hm({
                    url:target_url,
                    method: 'GET',
                    transformResponse: undefined
                })
                .success(function(data) {
                    data = data.slice('jsonp154('.length, -')'.length);
                    data = JSON.parse(data);
                    var tracks = [];
                    $.each(data.data.songs, function(index, item){
                        var track = xm_convert_song(item, 'artist_name');
                        tracks.push(track);
                    });
                    return fn({"result":tracks});
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
                .success(function(data) {
                    data = data.slice('jsonp217('.length, -')'.length);
                    data = JSON.parse(data);

                    var info = {
                        'cover_img_url': xm_retina_url(data.data.album_logo),
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
                .success(function(data) {   
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
                    .success(function(data) {
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
                }).success(function(data) {
                    return fn({"lyric":data});
                });
            }
        };
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
    bootstrap_track: xm_bootstrap_track,
    search: xm_search,
    lyric: xm_lyric,
};

})();
