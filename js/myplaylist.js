/* global localStorage getParameterByName */
const myplaylistFactory = () => {
  function show_myplaylist() {
    return {
      success(fn) {
        let playlists = localStorage.getObject('playerlists');
        if (playlists == null) {
          playlists = [];
        }
        const result = playlists.reduce((res, id) => {
          const playlist = localStorage.getObject(id);
          if (playlist !== null) {
            res.push(playlist);
          }
          return res;
        }, []);
        return fn({ result });
      },
    };
  }

  function my_get_playlist(url, hm, se) {
    const list_id = getParameterByName('list_id', url);
    return {
      success(fn) {
        const playlist = localStorage.getObject(list_id);
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

  const save_myplaylist = (playlist) => {
    let playlists = localStorage.getObject('playerlists');
    if (playlists == null) {
      playlists = [];
    }
    // update listid
    const playlist_id = `myplaylist_${guid()}`;
    playlist.info.id = playlist_id; // eslint-disable-line no-param-reassign
    playlist.is_mine = 1; // eslint-disable-line no-param-reassign
    playlists.push(playlist_id);
    localStorage.setObject('playerlists', playlists);
    localStorage.setObject(playlist_id, playlist);
  };

  const remove_myplaylist = (playlist_id) => {
    const playlists = localStorage.getObject('playerlists');
    if (playlists == null) {
      return;
    }
    const newplaylists = playlists.filter(item => item !== playlist_id);
    localStorage.removeItem(playlist_id);
    localStorage.setObject('playerlists', newplaylists);
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
    const newtracks = playlist.tracks.filter(item => item.id !== track_id);
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

    save_myplaylist(playlist);
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

  return {
    show_myplaylist,
    save_myplaylist,
    get_playlist: my_get_playlist,
    remove_myplaylist,
    add_myplaylist,
    remove_from_myplaylist,
    create_myplaylist,
    edit_myplaylist,
  };
};

const myplaylist = myplaylistFactory(); // eslint-disable-line no-unused-vars
