var kugou = (function() {
    'use strict';

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

        // Set song info
        var track = {
            'id': 'kgtrack_' + item.hash,
            'title': item.songname,
            'artist': item.singername,
            'artist_id': '',
            'album': item.album_name,
            'album_id': 'kgalbum_' + item.album_id,
            'source': 'kugou',
            'source_url': 'http://www.kugou.com/song/#hash=' + item.hash + '&album_id=' + item.album_id,
            'img_url': '',
            'url': 'kgtrack_' + item.hash,
            'lyric_url': item.hash
        };

        // add singer id and img
        var url = 'http://www.kugou.com/yy/index.php?r=play/getdata&hash=' + track.lyric_url;
        hm({
            url: url, method: 'GET', transformResponse: undefined
        }).then(function(response){
            var data = JSON.parse(response.data);
            track.img_url = data.data.img;
            track.artist_id = 'kgartist_' + data.data.author_id;
            callback(null, track);
        });
    }

    var kg_search = function(url, hm, se) {
        return {
            success: function(fn) {
                var keyword = getParameterByName('keywords', url);
                var curpage = getParameterByName('curpage', url);
                var target_url = 'http://mobilecdnbj.kugou.com/api/v3/search/song?showtype=10&plat=2&version=8990'
                    + '&keyword=' + keyword + '&page=' + curpage + '&pagesize=30';
                hm({
                    url: target_url, method: 'GET', transformResponse: undefined
                }).then(function(response){
                    var data = JSON.parse(response.data);
                    async_process_list(data.data.info, kg_render_search_result_item, [hm], function(err, tracks){
                        return fn({"result": tracks, "total": data.data.total});
                    });
                });
            }
        }
    }

    var kg_get_playlist = function(url, hm, se) {
        return {
            success: function(fn) {
                var list_id = getParameterByName('list_id', url).split('_').pop();
                var info;

                // Get the information of the play list
                var target_url = 'http://www2.kugou.kugou.com/yueku/v9/special/single/getData.js?cdn=cdn&sid=' + list_id + '&t=5&is_ajax=1'
                hm({
                    url: target_url, method: 'GET', transformResponse: undefined
                }).then(function(response){
                    var data = $(response.data);
                    data.filter('script').not('[type]').each(function(index, item) {
                        var info_a = item.text.match(/var\sglobal\s=\s?\{[\s\S]*\}/m);
                        if (info_a != null) {
                            var info_list = info_a[0].match(/id:\s\"(\d+)\"[\s\S]*name:\s\"(.*)\"[\s\S]*pic:\s\"(.*)\"[\s\S]*/);
                            info = {
                                'cover_img_url': info_list[3], 'title': info_list[2], 'id': info_list[1],
                                'source_url': 'http://www.kugou.com/yy/special/single/{size}.html'.replace('{size}', info_list[1])
                            }
                        }
                    });
                });

                // Get song lit of the play list
                target_url = 'http://www2.kugou.kugou.com/yueku/v9/special/song/getData.js?cdn=cdn&sid=' + list_id + '&t=5&is_ajax=1';
                hm.get(target_url).then(function(response){
                    var data = response.data;
                    // It is the same as searching.
                    async_process_list(data.data, kg_render_search_result_item, [hm], function(err, tracks){
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
            'title': item.songname,
            'artist': item.singername,
            'artist_id': info['id'],
            'album': '',
            'album_id': 'kgalbum_' + item.album_id,
            'source': 'kugou',
            'source_url': 'http://www.kugou.com/song/#hash=' + item.hash + '&album_id=' + item.album_id,
            'img_url': '',
            'url': 'kgtrack_' + item.hash,
            'lyric_url': item.hash
        };

        // Fix album name
        var target_url = 'http://mobilecdnbj.kugou.com/api/v3/album/info?albumid=' + item.album_id;
        hm.get(target_url).then(function(response){
            var data = response.data;
            track['album'] = data.status ? data.data.albumname : '';
        });
        // Fix the image
        target_url = 'http://www.kugou.com/yy/index.php?r=play/getdata&hash=' + item.hash;
        hm.get(target_url).then(function(response){
            var data = response.data;
            track['img_url'] = data.data.img;
            callback(null, track);
        });
    }

    var kg_artist = function(url, hm, se) {
        return {
            success: function(fn) {
                var artist_id = getParameterByName('list_id', url).split('_').pop();
                var target_url = 'http://mobilecdnbj.kugou.com/api/v3/singer/info?singerid=' + artist_id;

                // Get the information of the singer
                var info;
                hm.get(target_url).then(function(response){
                    var data = response.data;
                    info = {
                        'cover_img_url': data.data.imgurl.replace('{size}', '400'),
                        'title': data.data.singername,
                        'id': 'kgartist_' + data.data.singerid,
                        'source_url': 'http://www.kugou.com/singer/{id}.html'.replace('{id}', data.data.singerid)
                    };
                });
                // Get the song list of the singer
                target_url = 'http://www2.kugou.kugou.com/yueku/v9/singer/song/getData.js?cdn=cdn&sid=' + artist_id + '&p=1&s=30';
                hm.get(target_url).then(function(response){
                    var data = response.data;
                    async_process_list(data.data, kg_render_artist_result_item, [hm, info], function(err, tracks){
                        return fn({"tracks":tracks, "info":info});
                    });
                });
            }
        };
    }

    var kg_bootstrap_track = function(sound, track, success, failure, hm, se) {

        var song_id = track.id.slice('kgtrack_'.length);
        var target_url = 'http://www.kugou.com/yy/index.php?r=play/getdata&hash=' + song_id;

        hm({
            url: target_url,
            method: 'GET',
            transformResponse: undefined
        }).then(function(response){
            var data = response.data;
            data = JSON.parse(data);
            console.log(data);
            if (data.status == 1) {
                sound.url = data.data.play_url;
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

    var kg_album = function(url, hm, se) {
        return {
            success: function(fn) {
                var album_id = getParameterByName('list_id', url).split('_').pop();
                var target_url = 'http://mobilecdnbj.kugou.com/api/v3/album/info?albumid=' + album_id;

                var info;
                // info
                hm.get(target_url).then(function(response){
                    var data = response.data;

                    info = {
                        'cover_img_url': data.data.imgurl.replace('{size}', '400'),
                        'title': data.data.albumname,
                        'id': 'kgalbum_' + data.data.albumid,
                        'source_url': 'http://www.kugou.com/album/{id}.html'
                            .replace('{id}', data.data.albumid)
                    };
                });

                // Get song list
                target_url = 'http://www2.kugou.kugou.com/yueku/v9/album/song/getData.js?cdn=cdn&aid=' + album_id;
                hm.get(target_url).then(function(response){
                    var data = response.data;

                    async_process_list(data.data, kg_render_search_result_item, [hm], function(err, tracks){
                        return fn({"tracks":tracks, "info":info});
                    });
                });
            }
        };
    }

    var kg_show_playlist = function(url, hm) {
        var offset = getParameterByName('offset',url);
        if (offset == undefined) { offset = 0; }
        var pagesize = 30;
        var page = offset / pagesize + 1;
        var target_url = 'http://www2.kugou.kugou.com/yueku/v9/special/index/getData/getData.html'
            +'&cdn=cdn&p=' + page + '&pagesize=' + pagesize + '&t=5&c=&is_ajax=1'

        return {
            success: function(fn) {
                var result = [];
                hm.get(target_url).then(function(response){
                    var data = response.data;
                    $.each(data.special_db, function(index, item){
                        var plist = {
                            'cover_img_url': item.img,
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
