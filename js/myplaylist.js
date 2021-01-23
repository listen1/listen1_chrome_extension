/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-vars */
/* global localStorage getParameterByName */
const myplaylistFactory = () => {
  function getPlaylistObjectKey(playlist_type) {
    let key = '';
    if (playlist_type === 'my') {
      key = 'playerlists';
    } else if (playlist_type === 'favorite') {
      key = 'favoriteplayerlists';
    }
    return key;
  }
  function show_myplaylist(playlist_type) {
    return {
      success(fn) {
        const key = getPlaylistObjectKey(playlist_type);
        if (key === '') {
          return fn({ result: [] });
        }
        let playlists = localStorage.getObject(key);
        if (playlists == null) {
          playlists = [];
        }
        const result = playlists.reduce((res, id) => {
          const playlist = localStorage.getObject(id);
          if (playlist !== null && playlist.tracks !== undefined) {
            // clear url field when load old playlist
            playlist.tracks.forEach((e) => { delete e.url; });
          }
          res.push(playlist);
          return res;
        }, []);
        return fn({ result });
      },
    };
  }

  function get_myplaylist(url, hm, se) {
    const list_id = getParameterByName('list_id', url);
    return {
      success(fn) {
        const playlist = localStorage.getObject(list_id);
        // clear url field when load old playlist
        if (playlist !== null && playlist.tracks !== undefined) {
          playlist.tracks.forEach((e) => { delete e.url; });
        }
        fn(playlist);
      },
    };
  }

  function guid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return `${s4() + s4()}-${s4()}-${s4()}-${
      s4()}-${s4()}${s4()}${s4()}`;
  }

  const save_myplaylist = (playlist_type, playlist) => {
    const key = getPlaylistObjectKey(playlist_type);
    if (key === '') {
      return;
    }
    let playlists = localStorage.getObject(key);
    if (playlists == null) {
      playlists = [];
    }
    // update listid
    let playlist_id = '';
    if (playlist_type === 'my') {
      playlist_id = `myplaylist_${guid()}`;
      playlist.info.id = playlist_id;
      playlist.is_mine = 1; // eslint-disable-line no-param-reassign
    } else if (playlist_type === 'favorite') {
      playlist_id = playlist.info.id;
      playlist.is_fav = 1;
      // remove all tracks info, cause favorite playlist always load latest
      delete playlist.tracks;
    }

    playlists.push(playlist_id);
    localStorage.setObject(key, playlists);
    localStorage.setObject(playlist_id, playlist);
  };

  const remove_myplaylist = (playlist_type, playlist_id) => {
    const key = getPlaylistObjectKey(playlist_type);
    if (key === '') {
      return;
    }
    const playlists = localStorage.getObject(key);
    if (playlists == null) {
      return;
    }
    const newplaylists = playlists.filter((item) => item !== playlist_id);
    localStorage.removeItem(playlist_id);
    localStorage.setObject(key, newplaylists);
  };

  function add_myplaylist(playlist_id, track) {
    const playlist = localStorage.getObject(playlist_id);
    if (playlist == null) {
      return;
    }
    // new track will always insert in beginning of playlist
    if (Array.isArray(track)) {
      playlist.tracks = track.concat(playlist.tracks);
    } else {
      playlist.tracks.unshift(track);
    }

    // dedupe
    const newTracks = [];
    const trackIds = [];

    playlist.tracks.forEach((tracki) => {
      if (trackIds.indexOf(tracki.id) === -1) {
        newTracks.push(tracki);
        trackIds.push(tracki.id);
      }
    });
    playlist.tracks = newTracks;

    localStorage.setObject(playlist_id, playlist);
  }

  function remove_from_myplaylist(playlist_id, track_id) {
    const playlist = localStorage.getObject(playlist_id);
    if (playlist == null) {
      return;
    }
    const newtracks = playlist.tracks.filter((item) => item.id !== track_id);
    playlist.tracks = newtracks;
    localStorage.setObject(playlist_id, playlist);
  }

  function create_myplaylist(playlist_title, track) {
    const playlist = {};

    const info = {
      cover_img_url: 'images/mycover.jpg',
      title: playlist_title,
      id: '',
      source_url: '',
    };

    playlist.is_mine = 1;
    playlist.info = info;

    if (Array.isArray(track)) {
      playlist.tracks = track;
    } else {
      playlist.tracks = [track];
    }

    // notice: create only used by my playlist, favorite created by clone interface
    save_myplaylist('my', playlist);
  }

  function edit_myplaylist(playlist_id, title, cover_img_url) {
    const playlist = localStorage.getObject(playlist_id);
    if (playlist == null) {
      return;
    }
    playlist.info.title = title;
    playlist.info.cover_img_url = cover_img_url;
    localStorage.setObject(playlist_id, playlist);
  }

  function myplaylist_containers(playlist_type, list_id) {
    const key = getPlaylistObjectKey(playlist_type);
    if (key === '') {
      return false;
    }
    const playlist = localStorage.getObject(list_id);
    return playlist !== null && playlist.is_fav;
  }

  return {
    show_myplaylist,
    save_myplaylist,
    get_playlist: get_myplaylist,
    remove_myplaylist,
    add_myplaylist,
    remove_from_myplaylist,
    create_myplaylist,
    edit_myplaylist,
    myplaylist_containers,
  };
};

const myplaylist = myplaylistFactory(); // eslint-disable-line no-unused-vars
