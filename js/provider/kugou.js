var kugou = (function() {
    'use strict';

    function kg_convert_song(song) {
        var track = {
            'id': 'kgtrack_' + song.FileHash,
            'title': song.SongName,
            'artist': '',
            'artist_id': '',
            'album': song.AlbumName,
            'album_id': 'kgalbum_' + song.AlbumID,
            'source': 'kugou',
            'source_url': 'http://www.kugou.com/song/#hash=' + song.FileHash + '&album_id=' + song.AlbumID,
            'img_url': '',
            'url': 'kgtrack_' + song.FileHash,
            'lyric_url': song.FileHash
        };
        var singer_id = song.SingerId;
        var singer_name = song.SingerName;
        if (song.SingerId instanceof Array) {
            singer_id = singer_id[0];
            singer_name = singer_name.split('、')[0];
        }
        track['artist'] = singer_name;
        track['artist_id'] = 'kgartist_' + singer_id;
        return track;
    }

    function async_process_list(data_list, handler, handler_extra_param_list, callback) {
        var tracks = [];
        var fnDict = {};
        $.each(data_list, function(index, item){
            fnDict[index] = function(callback){
                return handler(index, item, handler_extra_param_list, callback);
            };
        });
        async.parallel(fnDict, function(err, results){
            $.each(data_list, function(index){
                tracks.push(results[index]);
            });
            callback(null, tracks);
        });
    }

    function kg_render_search_result_item(index, item, params, callback) {
        var hm = params[0];

        var track = kg_convert_song(item);
        // Add singer img
        var url = 'http://www.kugou.com/yy/index.php?'
            + 'r=play/getdata&hash=' + track.lyric_url;
        hm({
            url: url,
            method: 'GET',
            transformResponse: undefined
        }).then(function(response){
            var data = response.data;
            data = JSON.parse(data);
            track.img_url = data.data.img;
            callback(null, track);
        });
    }

    var kg_search = function(url, hm, se) {
        return {
            success: function(fn) {
                var keyword = getParameterByName('keywords', url);
                var curpage = getParameterByName('curpage', url);
                var target_url = "http://songsearch.kugou.com/" +
                    "song_search_v2?keyword=" + keyword + "&page=" + curpage;
                hm({
                    url: target_url,
                    method: 'GET',
                    transformResponse: undefined
                })
                .then(function(response){
                    var data = response.data
                    data = JSON.parse(data);
                    async_process_list(data.data.lists, kg_render_search_result_item, [hm], function(err, tracks){
                        return fn({"result": tracks, "total": data.data.total});
                    });
                });
            }
        };
    }

    function kg_render_playlist_result_item(index, item, params, callback){
        var hm = params[0];
        var target_url = 'http://m.kugou.com/app/i/getSongInfo.php?'
        + 'cmd=playInfo&hash=' + item.hash;

        var track = {
            'id': 'kgtrack_' + item.hash,
            'title': '',
            'artist': '',
            'artist_id': '',
            'album': '',
            'album_id': 'kgalbum_' + item.album_id,
            'source': 'kugou',
            'source_url': 'http://www.kugou.com/song/#hash='
                    + item.hash + '&album_id=' + item.album_id,
            'img_url': '',
            'url': 'xmtrack_' + item.hash,
            'lyric_url': item.hash
        };
        // Fix song info
        hm.get(target_url).then(function(response){
            var data = response.data;
            track['title'] = data.songName;
            track['artist'] = data.singerId == 0 ?
                '未知' : data.singerName;
            track['artist_id'] = 'kgartist_' + data.singerId;
            track['img_url'] = data.imgUrl.replace('{size}', '400');
            // Fix album
            target_url = 'http://mobilecdnbj.kugou.com/api/v3/album/info?albumid='
                + item.album_id;
            hm.get(target_url).then(function(response){
                var data = response.data;
                track['album'] = data.status ? data.data.albumname : '';
                return callback(null, track);
            });
        });
    }

    var kg_get_playlist = function(url, hm, se) {
        return {
            success: function(fn) {
                var list_id = getParameterByName('list_id', url).split('_').pop();
                var target_url = 'http://m.kugou.com/plist/list/' + list_id + '?json=true';

                hm.get(target_url).then(function(response){
                    var data = response.data;

                    var info = {
                        'cover_img_url': data.info.list.imgurl ?
                            data.info.list.imgurl.replace('{size}', '400') : '',
                        'title': data.info.list.specialname,
                        'id': 'kgplaylist_' + data.info.list.specialid,
                        'source_url': 'http://www.kugou.com/yy/special/single/{size}.html'
                            .replace('{size}', data.info.list.specialid)
                    };

                    var tracks = [];

                    async_process_list(data.list.list.info, kg_render_playlist_result_item, [hm], function(err, tracks){
                        return fn({"tracks":tracks, "info":info});
                    });
                });
            }
        };
    }

    function kg_render_artist_result_item(index, item, params, callback){
        var hm = params[0];
        var info = params[1];
        var track = {
            'id': 'kgtrack_' + item.hash,
            'title': '', 
            'artist': '', 
            'artist_id': info['id'],
            'album': '',
            'album_id': 'kgalbum_' + item.album_id,
            'source': 'kugou',
            'source_url': 'http://www.kugou.com/song/#hash='
                + item.hash + '&album_id=' + item.album_id,
            'img_url': '',
            'url': 'kgtrack_' + item.hash,
            'lyric_url': item.hash
        };
        var one = item.filename.split('-');
        track['title'] = $.trim(one[1]);
        track['artist'] = $.trim(one[0]);
        // Fix album name and img
        var target_url = 'http://www.kugou.com/yy/index.php?'
            + 'r=play/getdata&hash=' + item.hash;
        hm({
            url: 'http://mobilecdnbj.kugou.com/api/v3/album/info?albumid=' + item.album_id,
            method: 'GET',
            transformResponse: undefined
        }).then(function(response){
            var data = response.data; data = JSON.parse(data);
            track['album'] = data.status ? data.data.albumname : '';
            hm({
                url: target_url, method: 'GET', transformResponse: undefined
            }).then(function(response){
                var data = JSON.parse(response.data);
                track['img_url'] = data.data.img;
                callback(null, track);
            });
        });
    }

    var kg_artist = function(url, hm, se) {
        return {
            success: function(fn) {
                var artist_id = getParameterByName('list_id', url).split('_').pop();
                var target_url = 'http://mobilecdnbj.kugou.com/api/v3/singer/info?singerid=' + artist_id
                hm({
                    url:target_url,
                    method: 'GET',
                    transformResponse: undefined
                }).then(function(response){
                    var data = response.data;
                    data = JSON.parse(data);
                    var info = {
                        'cover_img_url': data.data.imgurl.replace('{size}', '400'),
                        'title': data.data.singername,
                        'id': 'kgartist_' + artist_id,
                        'source_url': 'http://www.kugou.com/singer/{id}.html'.replace('{id}', artist_id)
                    }
                    target_url = 'http://mobilecdnbj.kugou.com/api/v3/singer/song?singerid='
                        + artist_id + '&page=1&pagesize=30';
                    hm({
                        url:target_url,
                        method: 'GET',
                        transformResponse: undefined
                    }).then(function(response){
                        var data = response.data;
                        data = JSON.parse(data);
                        var tracks = [];
                        async_process_list(data.data.info, kg_render_artist_result_item, [hm, info], function(err, tracks){
                            return fn({"tracks":tracks, "info":info});
                        });
                    });
                });
            }
        };
    }

    var kg_bootstrap_track = function(sound, track, success, failure, hm, se) {
        var target_url = 'http://trackercdnbj.kugou.com/i/v2/?cmd=23&pid=1&behavior=download';
        var song_id = track.id.slice('kgtrack_'.length);
        var key = MD5(song_id + 'kgcloudv2');
        target_url = target_url + '&hash=' + song_id  + '&key=' + key;

        hm({
            url: target_url,
            method: 'GET',
            transformResponse: undefined
        }).then(function(response){
            var data = response.data;
            data = JSON.parse(data);
            if (data.status == '1') {
                sound.url = data.url;
                success();
            } else {
                failure();
            }
        });
    }

    var kg_lyric = function(url, hm, se) {
        var track_id = getParameterByName('track_id', url).split('_').pop();
        var lyric_url = 'http://www.kugou.com/yy/index.php?r=play/getdata&hash='
            + track_id;
        return {
            success: function(fn) {
                hm({
                    url: lyric_url,
                    method: 'GET',
                    transformResponse: undefined
                }).then(function(response){
                    var data = response.data;
                    data = JSON.parse(data);
                    return fn({'lyric': data.data.lyrics});
                });
            }
        };
    }

    function kg_render_album_result_item(index, item, params, callback){
        var hm = params[0];
        var info = params[1];
        var album_id = params[2];
        var track = {
            'id': 'kgtrack_' + item.hash,
            'title': '',
            'artist': '',
            'artist_id': '',
            'album': info['title'],
            'album_id': 'kgalbum_' + album_id,
            'source': 'kugou',
            'source_url': 'http://www.kugou.com/song/#hash='
                    + item.hash + '&album_id=' + album_id,
            'img_url': '',
            'url': 'xmtrack_' + item.hash,
            'lyric_url': item.hash
        };
        // Fix other data
        var target_url = 'http://m.kugou.com/app/i/getSongInfo.php?'
            + 'cmd=playInfo&hash=' + item.hash;
        hm({
            url: target_url, method: 'GET', transformResponse: undefined
        }).then(function(response){
            var data = JSON.parse(response.data);
            track['title'] = data.songName;
            track['artist'] = data.singerId == 0 ?
                '未知' : data.singerName;
            track['artist_id'] = 'kgartist_' + data.singerId;
            track['img_url'] = data.imgUrl.replace('{size}', '400');
            callback(null, track);
        });
    }

    var kg_album = function(url, hm, se) {
        return {
            success: function(fn) {
                var album_id = getParameterByName('list_id', url).split('_').pop();
                var target_url = 'http://mobilecdnbj.kugou.com/api/v3/album/info?'
                    + 'albumid=' + album_id;

                var info, tracks = [];
                // info
                hm({
                    url: target_url,
                    method: 'GET',
                    transformResponse: undefined
                }).then(function(response){
                    var data = response.data;
                    data = JSON.parse(data);

                    info = {
                        'cover_img_url': data.data.imgurl.replace('{size}', '400'),
                        'title': data.data.albumname,
                        'id': 'kgalbum_' + data.data.albumid,
                        'source_url': 'http://www.kugou.com/album/{id}.html'
                            .replace('{id}', data.data.albumid)
                    };

                    target_url = 'http://mobilecdnbj.kugou.com/api/v3/album/song?'
                    + 'albumid=' + album_id + '&page=1&pagesize=-1'
                    hm({
                        url: target_url,
                        method: 'GET',
                        transformResponse: undefined
                    }).then(function(response){
                        var data = response.data;
                        data = JSON.parse(data);

                        async_process_list(data.data.info, kg_render_album_result_item, [hm, info, album_id], function(err, tracks){
                            return fn({"tracks":tracks, "info":info});
                        });
                    });
                });
            }
        };
    }

    var kg_show_playlist = function(url, hm) {
        var offset = getParameterByName('offset',url);
        if (offset == undefined) { offset = 0; }
        var page = offset / 30 + 1;
        var target_url = 'http://m.kugou.com/plist/index'
            + '&json=true&page=' + offset;
        return {
            success: function(fn) {
                var result = [];
                hm.get(target_url).then(function(response){
                    var data = response.data;
                    var total = data.plist.total;
                    $.each(data.plist.list.info, function(index, item){
                        var plist = {
                            'cover_img_url': item.imgurl ? item.imgurl.replace('{size}', '400') : '',
                            'title': item.specialname,
                            'id': 'kgplaylist_' + item.specialid,
                            'source_url': 'http://www.kugou.com/yy/special/single/{size}.html'.replace('{size}', item.specialid)
                        };
                        result.push(plist);
                    });
                    return fn({"result":result});
                });
            }
        };
    }

    var kg_parse_url = function(url) {
        var result = undefined;
        var match = /\/\/www.kugou.com\/yy\/special\/single\/([0-9]+).html/.exec(url);
        if (match != null) {
            var playlist_id = match[1];
            result = {'type': 'playlist', 'id': 'kgplaylist_' + playlist_id};
        }
        return result;
    }

    var get_playlist = function(url, hm, se) {
        var list_id = getParameterByName('list_id', url).split('_')[0];
        if (list_id == 'kgplaylist') {
            return kg_get_playlist(url, hm, se);
        }
        if (list_id == 'kgalbum') {
            return kg_album(url, hm, se);
        }
        if (list_id == 'kgartist') {
            return kg_artist(url, hm, se);
        }
    }

return {
    show_playlist: kg_show_playlist,
    get_playlist: get_playlist,
    parse_url: kg_parse_url,
    bootstrap_track: kg_bootstrap_track,
    search: kg_search,
    lyric: kg_lyric,
};

})();
