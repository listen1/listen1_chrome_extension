var myplaylist = (function() {
    'use strict';

var show_myplaylist = function() {
    return {
        success: function(fn){
            var playlists = localStorage.getObject('playerlists');
            if (playlists == null) {
                playlists = [];
            }
            var result = [];
            for (var i=0; i<playlists.length; i++) {
                var playlist_id = playlists[i];
                var playlist = localStorage.getObject(playlist_id);
                if (playlist != null) {
                    result.push(playlist)
                }
            }
            return fn({'result': result});
        }
    }
}

var my_get_playlist = function(url, hm, se) {
    var list_id = getParameterByName('list_id', url);
    return {
        success: function(fn) {
            var playlist = localStorage.getObject(list_id);
            fn(playlist);
        }
    };
}

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

var save_myplaylist = function(playlist) {
    var playlists = localStorage.getObject('playerlists');
    if (playlists == null) {
        playlists = [];
    }
    // update listid
    var playlist_id = 'myplaylist_' + guid();
    playlist.info.id = playlist_id;
    playlist.is_mine = 1;
    playlists.push(playlist_id);
    localStorage.setObject('playerlists', playlists);
    localStorage.setObject(playlist_id, playlist);
}

var remove_myplaylist = function(playlist_id) {
    var playlists = localStorage.getObject('playerlists');
    if (playlists == null) {
        return;
    }
    var newplaylists = [];
    for (var i=0; i<playlists.length; i++) {
        if (playlists[i] == playlist_id) {
            continue;
        }
        newplaylists.push(playlists[i]);
    }
    localStorage.removeItem(playlist_id);
    localStorage.setObject('playerlists', newplaylists);
}

var add_myplaylist = function(playlist_id, track) {
    var playlist = localStorage.getObject(playlist_id);
    if (playlist == null) {
        return;
    }
    playlist.tracks.push(track);
    localStorage.setObject(playlist_id, playlist);
}

var remove_from_myplaylist = function(playlist_id, track_id) {
    var playlist = localStorage.getObject(playlist_id);
    if (playlist == null) {
        return;
    }
    var newtracks = [];
    for (var i=0; i<playlist.tracks.length; i++) {
        if (playlist.tracks[i].id == track_id) {
            continue;
        }
        newtracks.push(playlist.tracks[i]);
    }
    playlist.tracks = newtracks;
    localStorage.setObject(playlist_id, playlist);
}

var create_myplaylist = function(playlist_title, track) {
    var playlist = {};
    var info = {};

    var info = {
        'cover_img_url' : 'images/mycover.jpg',
        'title': playlist_title,
        'id': '',
        'source_url': ''
    };

    playlist.is_mine = 1;
    playlist.info = info;
    playlist.tracks = [track];
    save_myplaylist(playlist);
}

var edit_myplaylist = function(playlist_id, title, cover_img_url) {
    var playlist = localStorage.getObject(playlist_id);
    if (playlist == null) {
        return;
    }
    playlist.info.title = title;
    playlist.info.cover_img_url = cover_img_url;
    localStorage.setObject(playlist_id, playlist);
}


return {
    show_myplaylist: show_myplaylist,
    save_myplaylist: save_myplaylist,
    get_playlist: my_get_playlist,
    remove_myplaylist: remove_myplaylist,
    add_myplaylist: add_myplaylist,
    remove_from_myplaylist: remove_from_myplaylist,
    create_myplaylist: create_myplaylist,
    edit_myplaylist: edit_myplaylist
};

})();