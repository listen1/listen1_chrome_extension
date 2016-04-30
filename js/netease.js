function ne_show_playlist(url, hm) {
    var target_url = 'http://music.163.com/discover/playlist/';

    return {
        success: function(fn) {
            var result = [];
            hm.get(target_url).success(function(data) {
                data = $.parseHTML(data);
                $(data).find('.m-cvrlst li').each(function(){
                    var default_playlist = {
                        'cover_img_url' : '',
                        'title': '',
                        'list_id': ''
                    };
                    default_playlist.cover_img_url = $(this).find('img')[0].src;
                    default_playlist.title = $(this).find('div a')[0].title;
                    var url = $(this).find('div a')[0].href;
                    default_playlist.list_id = 'neplaylist_' + getParameterByName('id',url);
                    result.push(default_playlist);
                });
                return fn({"result":result});
            });
        }
    };
}

function ne_get_playlist(url, hm) {
    var list_id = getParameterByName('list_id', url).split('_').pop();
    var target_url = 'http://music.163.com/playlist?id=' + list_id;
    return {
        success: function(fn) {
            hm.get(target_url).success(function(data) {
                data = $.parseHTML(data);
                var dataObj = $(data);
                var info = {
                    'list_id': list_id,
                    'cover_img_url': dataObj.find('.u-cover img').attr('src'),
                    'title': dataObj.find('.tit h2').text()
                };
                var tracks = [];
                var json_string = dataObj.find('textarea').val();
                var track_json_list = JSON.parse(json_string);
                $.each(track_json_list, function(index, track_json){
                    var default_track = {
                        'id': '0',
                        'title': '',
                        'artist': '',
                        'artist_id': 'neartist_0',
                        'album': '',
                        'album_id': 'nealbum_0',
                        'source': 'netease',
                        'source_url': 'http://www.xiami.com/song/0',
                        'img_url': '',
                        'url': ''
                    };
                    default_track.id = 'netrack_' + track_json.id;
                    default_track.title = track_json.name;
                    default_track.artist = track_json.artists[0].name;
                    default_track.artist_id = 'neartist_' + track_json.artists[0].id;
                    default_track.album = track_json.album.name;
                    default_track.album_id = 'nealbum_' + track_json.album.id;
                    default_track.source_url = 'http://music.163.com/#/song?id=' +  track_json.id;
                    default_track.img_url = track_json.album.picUrl;
                    default_track.url = default_track.id;
                    tracks.push(default_track);
                });
                return fn({"info":info,"tracks":tracks,'is_mine':'0'});
            });
        }
    };
}

function _create_secret_key(size) {
    var result = [];
    var choice = '012345679abcdef'.split('');
    for (var i=0; i<size; i++) {
        var index = Math.floor(Math.random() * choice.length);
        result.push(choice[index]);
    }
    return result.join('');
}


function _aes_encrypt(text, sec_key) {
    pad = 16 - text.length % 16;
    for (var i=0; i<pad; i++) {
        text = text + String.fromCharCode(pad);
    }
    var key = aesjs.util.convertStringToBytes(sec_key);
    // The initialization vector, which must be 16 bytes
    var iv = aesjs.util.convertStringToBytes("0102030405060708");
    var textBytes = aesjs.util.convertStringToBytes(text);
    var aesCbc = new aesjs.ModeOfOperation.cbc(key, iv);
    var cipherArray = [];
    while(textBytes.length != 0) {
        var block = aesCbc.encrypt(textBytes.slice(0, 16));
        Array.prototype.push.apply(cipherArray,block);
        textBytes = textBytes.slice(16);
    }
    var ciphertext = '';
    for (var i=0; i<cipherArray.length; i++) {
        ciphertext = ciphertext + String.fromCharCode(cipherArray[i]);
    }
    ciphertext = btoa(ciphertext)
    return ciphertext;
}

function hexify(text) {
    return text.split('').map(function(x){return x.charCodeAt(0).toString(16)}).join('');
}

function zfill(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}


function expmod( base, exp, mymod ) {
  if ( equalsInt(exp, 0) == 1) return int2bigInt(1,10);
  if ( equalsInt(mod(exp, int2bigInt(2,10) ), 0) ) {
    var newexp = dup(exp);
    rightShift_(newexp,1);
    var result = powMod(expmod( base, newexp, mymod), [2,0], mymod);
    return result;
  }
  else {
    var result = mod(mult(expmod( base, sub(exp, int2bigInt(1,10)), mymod), base), mymod);
    return result;
  }
}

function _rsa_encrypt(text, pubKey, modulus) {
    text = text.split('').reverse().join('');
    var base = str2bigInt(hexify(text), 16);
    var exp = str2bigInt(pubKey, 16);
    var mod = str2bigInt(modulus, 16);
    var bigNumber = expmod(base, exp, mod);
    var rs = bigInt2str(bigNumber, 16);
    return zfill(rs, 256).toLowerCase();
}

function _encrypted_request(text) {
    var modulus = '00e0b509f6259df8642dbc35662901477df22677ec152b5ff68ace615bb7b72' + 
    '5152b3ab17a876aea8a5aa76d2e417629ec4ee341f56135fccf695280104e0312ecbd' + 
    'a92557c93870114af6c9d05c4f7f0c3685b7a46bee255932575cce10b424d813cfe48' + 
    '75d3e82047b97ddef52741d546b8e289dc6935b3ece0462db0a22b8e7';
    var nonce = '0CoJUm6Qyw8W8jud';
    var pubKey = '010001';
    text = JSON.stringify(text);
    var sec_key = _create_secret_key(16);
    var enc_text = _aes_encrypt(_aes_encrypt(text, nonce), sec_key);
    var enc_sec_key = _rsa_encrypt(sec_key, pubKey, modulus);
    var data = {
        'params': enc_text,
        'encSecKey': enc_sec_key
    };

    return data;
}

function ne_bootstrap_track(sound, track, callback, hm, se) {
    var target_url = 'http://music.163.com/weapi/song/enhance/player/url?csrf_token=';
    var csrf = '';
    var song_id = sound.url;

    song_id = song_id.slice('netrack_'.length);
    var d = {
        "ids": [song_id],
        "br": 320000,
        "csrf_token": csrf
    }
    var data = _encrypted_request(d);

    hm({
        url: target_url,
        method: 'POST',
        data: se(data),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }).success(function(data) {
        sound.url = data.data[0].url;
        callback();
      });
}

function ne_search(url, hm, se) {
    // use chrome extension to modify referer.
    var target_url = 'http://music.163.com/api/search/pc';
    var keyword = getParameterByName('keywords', url);
    var req_data = {
        's': keyword,
        'offset': 0,
        'limit': 20,
        'type': 1
    };
    return {
        success: function(fn) {
            hm({
                url: target_url,
                method: 'POST',
                data: se(req_data),
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
                }
            }).success(function(data) {
                var tracks = [];
                $.each(data.result.songs, function(index, song_info) {
                    if (song_info.status == -1) {
                        return;
                    }
                    var default_track = {
                        'id': 'netrack_' + song_info.id,
                        'title': song_info.name,
                        'artist': song_info.artists[0].name,
                        'artist_id': 'neartist_' + song_info.artists[0].id,
                        'album': song_info.album.name,
                        'album_id': 'nealbum_' + song_info.album.id,
                        'source': 'netease',
                        'source_url': 'http://music.163.com/#/song?id=' + song_info.id,
                        'img_url': song_info.album.picUrl,
                        'url': 'netrack_' + song_info.id
                    };
                    tracks.push(default_track);
                });
                return fn({"result":tracks});
            });
        }
    };
}


function ne_album(url, hm, se) {
    var album_id = getParameterByName('album_id', url).split('_').pop();
    // use chrome extension to modify referer.
    var target_url = 'http://music.163.com/api/album/' + album_id;

    return {
        success: function(fn) {
            hm({
                url: target_url,
                method: 'GET'
            }).success(function(data) {
                var info = {
                    'cover_img_url': data.album.picUrl,
                    'title': data.album.name,
                    'id': data.album.id
                };

                var tracks = [];
                $.each(data.album.songs, function(index, song_info) {
                    var default_track = {
                        'id': 'netrack_' + song_info.id,
                        'title': song_info.name,
                        'artist': song_info.artists[0].name,
                        'artist_id': 'neartist_' + song_info.artists[0].id,
                        'album': song_info.album.name,
                        'album_id': 'nealbum_' + song_info.album.id,
                        'source': 'netease',
                        'source_url': 'http://music.163.com/#/song?id=' + song_info.id,
                        'img_url': song_info.album.picUrl,
                        'url': 'netrack_' + song_info.id
                    };
                    tracks.push(default_track);
                });
                return fn({"tracks":tracks, "info":info, "is_mine": 0});
            });
        }
    };
}

function ne_artist(url, hm, se) {
    var artist_id = getParameterByName('artist_id', url).split('_').pop();
    // use chrome extension to modify referer.
    var target_url = 'http://music.163.com/api/artist/' + artist_id;

    return {
        success: function(fn) {
            hm({
                url: target_url,
                method: 'GET'
            }).success(function(data) {
                var info = {
                    'cover_img_url': data.artist.picUrl,
                    'title': data.artist.name,
                    'id': data.artist.id
                };

                var tracks = [];
                $.each(data.hotSongs, function(index, song_info) {
                    var default_track = {
                        'id': 'netrack_' + song_info.id,
                        'title': song_info.name,
                        'artist': song_info.artists[0].name,
                        'artist_id': 'neartist_' + song_info.artists[0].id,
                        'album': song_info.album.name,
                        'album_id': 'nealbum_' + song_info.album.id,
                        'source': 'netease',
                        'source_url': 'http://music.163.com/#/song?id=' + song_info.id,
                        'img_url': song_info.album.picUrl,
                        'url': 'netrack_' + song_info.id
                    };
                    tracks.push(default_track);
                });
                return fn({"tracks":tracks, "info":info, "is_mine": 0});
            });
        }
    };
}
