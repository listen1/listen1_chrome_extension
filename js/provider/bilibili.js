var bilibili = (function() {
    'use strict';

    function bi_convert_song(song_info) {
        var track = {
            'id': 'bitrack_' + song_info.id,
            'title': song_info.title,
            'artist': song_info.uname,
            'artist_id': 'biartist_' + song_info.uid,
            'source': 'bilibili',
            'source_url': 'https://www.bilibili.com/audio/au' + song_info.id,
            'img_url': song_info.cover,
            'url': song_info.id,
            'lyric_url': song_info.lyric
        };
        return track;
    }

    var bi_show_playlist = function(url, hm) {
        var offset = getParameterByName("offset", url)
        if (offset == undefined) { offset = 0; }
        var page = offset / 20;
        var target_url = 'https://www.bilibili.com/audio/music-service-c/web/menu/hit?ps=20&pn=' + page
        return {
            success: function(fn) {
                var result = [];
                hm.get(target_url).then(function(response) {
                    var data = response.data.data.data;
                    $.each(data, function(index, item) {
                        var plist = {
                            'cover_img_url': item.cover,
                            'title': item.title,
                            'id': 'biplaylist_' + item.menuId,
                            'source_url': 'https://www.bilibili.com/audio/am' + item.menuId
                        }
                        result.push(plist);
                    });
                    return fn({"result": result});
                });
            }
        };
    }

    var bi_get_playlist = function(url, hm, se) {
        var list_id = getParameterByName('list_id', url).split('_').pop();
        var target_url = 'https://www.bilibili.com/audio/music-service-c/web/menu/info?sid=' + list_id;

        return {
            success: function(fn) {
                hm.get(target_url).then(function(response) {
                    var data = response.data.data;

                    var info = {
                        'cover_img_url': data.cover,
                        'title': data.title,
                        'id': 'biplaylist_' + list_id,
                        'source_url': 'https://www.bilibili.com/audio/am' + list_id
                    };

                    var target_url = 'https://www.bilibili.com/audio/music-service-c/web/song/of-menu?pn=1&ps=100&sid=' + list_id;
                    hm.get(target_url).then(function(response) {
                        var data = response.data.data.data;
                        var tracks = [];
                        $.each(data, function(index, item) {
                            var track = bi_convert_song(item);
                            tracks.push(track);
                        });
                        return fn({"info":info,"tracks":tracks});
                    });
                });
            }
        };
    }

    var bi_album = function(url, hm, se) {
        return {
            success: function(fn) {
                return fn({"tracks": [], "info": {}});
                // bilibili havn't album
                var album_id = getParameterByName('list_id', url).split('_').pop();
                var target_url = ''
                hm.get(target_url).then(function(response) {
                    var data = response.data;

                    var info = {};

                    var tracks = [];
                    return fn({"tracks": tracks, "info": info});
                });
            }
        };
    }

    var bi_artist = function (url, hm, se) {
        return {
            success: function(fn) {
                var artist_id = getParameterByName('list_id', url).split('_').pop();

                var target_url = 'https://space.bilibili.com/ajax/member/GetInfo'

                hm.post(target_url, 'mid=' + artist_id).then(function(response) {
                    var data = response.data.data;

                    var info = {
                        'cover_img_url': data.face,
                        'title': data.name,
                        'id': 'biartist_' + artist_id,
                        'source_url': 'https://space.bilibili.com/' + artist_id + '/#/audio'
                    };

                    target_url = 'https://api.bilibili.com/audio/music-service-c/web/song/upper?pn=1&ps=0&order=2&uid=' + artist_id
                    hm.get(target_url).then(function(response) {
                        var data = response.data.data.data;

                        var tracks = [];
                        $.each(data, function(index, item) {
                            var track = bi_convert_song(item);
                            tracks.push(track);
                        });
                        return fn({"tracks": tracks, "info": info});
                    });
                });
            }
        };
    }

    var bi_parse_url = function(url) {
        var result = undefined;
        var match = /\/\/www.bilibili.com\/audio\/am([0-9]+)/.exec(url);
        if (match != null) {
            var playlist_id = match[1];
            result = {'type': 'playlist', 'id': 'biplaylist_' + playlist_id};
        }
        return result;
    }

    var bi_bootstrap_track = function(sound, track, success, failure, hm, se) {
        var song_id = track.id.slice('bitrack_'.length);
        var target_url = 'https://www.bilibili.com/audio/music-service-c/web/url?sid=' + song_id;

        hm.get(target_url).then(function(response) {
            var data = response.data;
            if (data.code == 0) {
                sound.url = data.data.cdns[0];
                success();
            } else {
                failure();
            }
        });
    }

    var bi_search = function(url, hm, se) {
        return {
            success: function(fn) {
                return fn({"result": [], "total": 0});
                // inferred, not implemented yet
                var keyword = getParameterByName('keywords', url);
                var curpage = getParameterByName('curpage', url);
                var target_url = 'https://api.bilibili.com/x/web-interface/search/type?search_type=audio&keyword=' + keyword + '&page=' + curpage
                hm({
                    url:target_url,
                    method: 'GET',
                    transformResponse: undefined
                })
                .then(function(response) {
                    var data = response.data.data;
                    var tracks = [];
                    $.each(data.result, function(index, item) {
                        var track = bi_convert_song(item);
                        tracks.push(track);
                    });
                    return fn({"result": tracks, "total": data.numResults});
                });
            }
        };
    }

    var bi_lyric = function (url, hm, se) {
        var track_id = getParameterByName('track_id', url).split('_').pop();
        var lyric_url = getParameterByName('lyric_url', url);
        return {
            success: function(fn) {
                hm.get(lyric_url).then(function(response) {
                    var data = response.data;
                    return fn({"lyric": data});
                });
            }
        };
    }

    var get_playlist = function(url, hm, se) {
        var list_id = getParameterByName('list_id', url).split('_')[0];
        if (list_id == 'biplaylist') {
            return bi_get_playlist(url, hm, se);
        }
        if (list_id == 'bialbum') {
            return bi_album(url, hm, se);
        }
        if (list_id == 'biartist') {
            return bi_artist(url, hm, se);
        }
    }

    return {
        show_playlist: bi_show_playlist,
        get_playlist: get_playlist,
        parse_url: bi_parse_url,
        bootstrap_track: bi_bootstrap_track,
        search: bi_search,
        lyric: bi_lyric,
    };
})();
