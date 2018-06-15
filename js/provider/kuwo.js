var kuwo = (function() {
    'use strict';

    // Convert html code
    function html_decode(str) {
        return str.replace(/(&nbsp;)/g, ' ');
    }
    // Fix single quote in json
    function fix_json(data) {
        return data.replace(/(\')/g, '"');
    }

    function num2str(num) {
        var t = parseInt(num);
        return parseInt(num / 10).toString() + (num % 10).toString();
    }

    function kw_convert_song(item) {
        var song_id = item.MUSICRID.split('_').pop();
        var track = {
            'id': 'kwtrack_' + song_id,
            'title': html_decode(item.SONGNAME),
            'artist': item.ARTIST,
            'artist_id': 'kwartist_' + item.ARTISTID,
            'album': html_decode(item.ALBUM),
            'album_id': 'kwalbum_' + item.ALBUMID,
            'source': 'kuwo',
            'source_url': 'http://www.kuwo.cn/yinyue/' + song_id,
            'img_url': '',
            'url': 'xmtrack_' + song_id,
            'lyric_url': song_id
        };
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

    function kw_add_song_pic_in_track(track, params, callback) {
        var hm = params[0];

        // Add song picture image
        var target_url = 'http://artistpicserver.kuwo.cn/pic.web?'
            + 'type=rid_pic&pictype=url&size=240&rid=' + track.lyric_url;
        hm({
            url: target_url, method: 'GET', transformResponse: undefined
        }).then(function(response){
            var data = response.data;
            track.img_url = data;
            callback(null, track);
        });
    }

    function kw_render_search_result_item(index, item, params, callback) {
        var hm = params[0];

        var track = kw_convert_song(item);
        kw_add_song_pic_in_track(track, params, callback);
    }

    function kw_render_artist_result_item(index, item, params, callback) {
        var hm = params[0];

        var track = {
            'id': 'kwtrack_' + item.musicrid,
            'title': html_decode(item.name),
            'artist': item.artist,
            'artist_id': 'kwartist_' + item.artistid,
            'album': html_decode(item.album),
            'album_id': 'kwalbum_' + item.albumid,
            'source': 'kuwo',
            'source_url': 'http://www.kuwo.cn/yinyue/' + item.musicrid,
            'img_url': '',
            'url': 'xmtrack_' + item.musicrid,
            'lyric_url': item.musicrid
        }

        kw_add_song_pic_in_track(track, params, callback);
    }

    function kw_render_album_result_item(index, item, params, callback) {
        var hm = params[0];
        var info = params[1];

        var track = {
            'id': 'kwtrack_' + item.id,
            'title': html_decode(item.name),
            'artist': item.artist,
            'artist_id': 'kwartist_' + item.artistid,
            'album': info['title'],
            'album_id': 'kwalbum_' + info['id'],
            'source': 'kuwo',
            'source_url': 'http://www.kuwo.cn/yinyue/' + item.id,
            'img_url': '',
            'url': 'xmtrack_' + item.id,
            'lyric_url': item.id
        }

        kw_add_song_pic_in_track(track, params, callback);
    }

    function kw_render_playlist_result_item(index, item, params, callback) {
        var hm = params[0];

        var track = {
            'id': 'kwtrack_' + item.id,
            'title': html_decode(item.name),
            'artist': item.artist,
            'artist_id': 'kwartist_' + item.artistid,
            'album': html_decode(item.album),
            'album_id': 'kwalbum_' + item.albumid,
            'source': 'kuwo',
            'source_url': 'http://www.kuwo.cn/yinyue/' + item.id,
            'img_url': '',
            'url': 'xmtrack_' + item.id,
            'lyric_url': item.id
        }

        kw_add_song_pic_in_track(track, params, callback);
    }

    var kw_search = function(url, hm, se) {
        // API From https://blog.csdn.net/u011354613/article/details/52756467
        var keyword = getParameterByName('keywords', url);
        var curpage = getParameterByName('curpage', url);
        // page number is started from 0
        curpage = curpage - 1;
        var target_url = "http://search.kuwo.cn/r.s?"
            + "ft=music&itemset=web_2013&client=kt"
            + "&rformat=json&encoding=utf8"
            + "&all={0}&pn={1}&rn=20".replace('{0}', keyword).replace('{1}', curpage);

        return {
            success: function(fn) {
                hm({
                    url: target_url, method: 'GET', ransformResponse: undefined
                }).then(function(response){
                    var data = response.data;
                    data = JSON.parse(fix_json(data));
                    async_process_list(data.abslist, kw_render_search_result_item, [hm], function(err, tracks){
                        return fn({"result": tracks, "total": data.TOTAL});
                    });
                });
            }
        };
    };

    var kw_bootstrap_track = function(sound, track, success, failure, hm, se) {
        var song_id = track.id.slice('kwtrack_'.length);
        var target_url = 'http://antiserver.kuwo.cn/anti.s?'
            + 'type=convert_url&format=aac|mp3|wma&response=url&rid=MUSIC_' + song_id;

        hm({
            url: target_url, method: 'GET', transformResponse: undefined
        }).then(function(response){
            var data = response.data;
            if (data.length > 0) {
                sound.url = data;
                success();
            } else {
                failure();
            }
        });
    }

    var kw_lyric = function(url, hm, se) {
        var track_id = getParameterByName('lyric_url', url);
        var target_url = 'http://m.kuwo.cn/newh5/singles/songinfoandlrc?musicId=' + track_id;

        return {
            success: function(fn) {
                hm({
                    url: target_url, method: 'GET', transformResponse: undefined
                }).then(function(response){
                    var data = response.data;
                    data = JSON.parse(data);

                    var lyric = '';
                    $.each(data.data.lrclist, function(index, item){
                        var t = parseFloat(item.time);
                        var m = parseInt(t / 60), s = parseInt(t - m * 60), ms = parseInt((t - m * 60 - s) * 100);
                        lyric = lyric + '[' + num2str(m) + ':' + num2str(parseInt(s)) + '.' + num2str(ms) + ']' + item.lineLyric + '\n';
                    });
                    return fn({'lyric': lyric});
                });
            }
        };
    }

    var kw_artist = function(url, hm, se) {
        var artist_id = getParameterByName('list_id', url).split('_').pop();
        return {
            success: function(fn) {
                var target_url = 'http://search.kuwo.cn/r.s?stype=artistinfo'
                    + '&artistid=' + artist_id + '&encoding=utf8';
                hm({
                    url: target_url, method: 'GET', transformResponse: undefined
                }).then(function(response){
                    var data = response.data;
                    data = JSON.parse(fix_json(data));
                    var info = {
                        'cover_img_url': 'http://img1.sycdn.kuwo.cn/star/starheads/' + data.pic,
                        'title': html_decode(data.name),
                        'id': 'kwartist_' + data.id,
                        'source_url': 'http://www.kuwo.cn/artist/content?name=' + data.name
                    };

                    // Get songs
                    target_url = 'http://search.kuwo.cn/r.s?stype=artist2music'
                        + '&sortby=0&alflac=1&pcmp4=1&encoding=utf8'
                        + '&artistid=' + artist_id + '&pn=0&rn=100';
                    hm({
                        url: target_url, method: 'GET', transformResponse: undefined
                    }).then(function(response){
                        var data = response.data;
                        data = JSON.parse(fix_json(data));
                        var tracks = [];
                        async_process_list(data.musiclist, kw_render_artist_result_item, [hm], function(err, tracks){
                            return fn({"tracks":tracks, "info":info});
                        });
                    });
                });
            }
        };
    }

    var kw_album = function(url, hm, se) {
        var album_id = getParameterByName('list_id', url).split('_').pop();
        return {
            success: function(fn) {
                var target_url = 'http://search.kuwo.cn/r.s?pn=0&rn=1000&stype=albuminfo'
                    + '&albumid=' + album_id
                    + '&alflac=1&pcmp4=1&encoding=utf8&vipver=MUSIC_8.7.7.0_W4';
                hm({
                    url: target_url, method: 'GET', transformResponse: undefined
                }).then(function(response){
                    var data = response.data;
                    data = JSON.parse(fix_json(data));

                    var info = {
                        'cover_img_url': 'http://img1.sycdn.kuwo.cn/star/albumcover/' + data.pic,
                        'title': html_decode(data.name),
                        'id': data.albumid,
                        'source_url': 'http://www.kuwo.cn/album/' + data.albumid
                    }

                    // Get songs
                    var tracks = [];
                    async_process_list(data.musiclist, kw_render_album_result_item, [hm, info], function(err, tracks){
                        return fn({"tracks":tracks, "info":info});
                    });
                });
            }
        };
    }

    var kw_show_playlist = function(url, hm) {
        var offset = getParameterByName('offset',url);
        if (offset == undefined) { offset = 0; }
        var id_available = {
            1265: '经典', 577: '纯音乐', 621: '网络', 155: '怀旧', 1879: '网红',
            220: '佛乐', 180: '影视', 578: '器乐', 1877: '游戏', 181: '二次元',
            882: 'KTV', 216: '喊麦', 1366: '3D', 146: '伤感', 62: '放松', 58: '励志',
            143: '开心', 137: '甜蜜', 139: '兴奋', 67: '安静', 66: '治愈', 147: '寂寞',
            160: '四年', 366: '运动', 354: '睡前', 378: '跳舞', 1876: '学习',
            353: '清晨', 359: '夜店', 382: '校园', 544: '亲热', 363: '咖啡店',
            375: '旅行', 371: '散步', 386: '工作', 336: '婚礼', 637: '70后', 638: '80后',
            639: '90后', 640: '00后', 268: '10后', 393: '流行', 391: '电子',
            389: '摇滚', 1921: '民歌', 392: '民谣', 399: '乡村', 35: '欧洲', 37: '华语',
        }
        var target_url = 'http://www.kuwo.cn/www/categoryNew/getPlayListInfoUnderCategory?'
            + 'type=taglist&digest=10000&id=' + 37 + '&start=' + offset + '&count=50';

        return {
            success: function(fn) {
                var result = [];
                hm.get(target_url).then(function(response){
                    var data = response.data;
                    $.each(data.data[0].data, function(index, item){
                        var plist = {
                            'cover_img_url': item.img,
                            'title': item.name,
                            'id': 'kwplaylist_' + item.id,
                            'source_url': 'http://www.kuwo.cn/playlist/index?pid=' + item.id
                        }
                        result.push(plist);
                    });
                    return fn({"result":result});
                });
            }
        };
    }

    var kw_get_playlist = function(url, hm, se) {
        var list_id = getParameterByName('list_id', url).split('_').pop();
        var target_url = 'http://nplserver.kuwo.cn/pl.svc?'
            + 'op=getlistinfo&pn=0&rn=100&encode=utf-8&keyset=pl2012&pcmp4=1'
            + '&pid=' + list_id;

        return {
            success: function(fn) {
                hm.get(target_url).then(function(response){
                    var data = response.data;

                    var info = {
                        'cover_img_url': data.pic,
                        'title': data.title,
                        'id': 'kwplaylist_' + data.id,
                        'source_url': 'http://www.kuwo.cn/playlist/index?pid=' + data.id
                    };

                    var tracks = [];
                    async_process_list(data.musiclist, kw_render_playlist_result_item, [hm], function(err, tracks){
                        return fn({"tracks":tracks, "info":info});
                    });
                });
            }
        };
    }

    var kw_parse_url = function(url) {
        var result = undefined;
        var match = /\/\/www.kuwo.cn\/playlist\/index\?pid=([0-9]+)/.exec(url);
        if (match != null) {
            var playlist_id = match[1];
            result = {'type': 'playlist', 'id': 'kwplaylist_' + playlist_id};
        }
        return result;
    }

    var get_playlist = function(url, hm, se) {
        var list_id = getParameterByName('list_id', url).split('_')[0];
        if (list_id == 'kwplaylist') {
            return kw_get_playlist(url, hm, se);
        }
        if (list_id == 'kwalbum') {
            return kw_album(url, hm, se);
        }
        if (list_id == 'kwartist') {
            return kw_artist(url, hm, se);
        }
    }

    return {
        show_playlist: kw_show_playlist,
        get_playlist: get_playlist,
        parse_url: kw_parse_url,
        bootstrap_track: kw_bootstrap_track,
        search: kw_search,
        lyric: kw_lyric,
    };
})();
