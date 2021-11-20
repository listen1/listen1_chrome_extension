import { getParameterByName } from './lowebutil';
import iDB from '../services/DBService';
import EventService from '../services/EventService';

const myplaylistFactory = () => {
  function array_move(arr, old_index, new_index) {
    // https://stackoverflow.com/questions/5306680/move-an-array-element-from-one-array-position-to-another
    if (new_index >= arr.length) {
      let k = new_index - arr.length + 1;
      while (k > 0) {
        k -= 1;
        arr.push(undefined);
      }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr; // for testing
  }
  function getPlaylistObjectKey(playlist_type) {
    let key = '';
    if (playlist_type === 'my') {
      key = 'c';
    } else if (playlist_type === 'favorite') {
      key = 'favorite';
    }
    return key;
  }
  async function get_myplaylists_list(playlist_type) {
    const order = await iDB.Settings.get({ key: playlist_type + 'playlist_order' }) || [];
    let playlists = await iDB.Playlists.where('type').equals(playlist_type).toArray();
    playlists = order.map((id) => playlists.find(playlist => playlist.id === id));
    // const resultPromise = playlists.map(async (res, id) => {
    //   //const playlist = localStorage.getObject(id);
    //   const playlist = await iDB.Tracks.where('playlist').equals(id).toArray();
    //   res.push(playlist);
    //   return res;
    // }, []);
    // const result = await Promise.all(resultPromise);
    return playlists;
  }

  async function get_myplaylist(url) {
    const list_id = getParameterByName('list_id', url);
    const playlistInfo = await iDB.Playlists.get(list_id);
    let playlist = {
      info: playlistInfo,
    };
    // clear url field when load old playlist
    if (playlistInfo) {
      playlist.tracks = await iDB.Tracks.where('playlist').equals(list_id).toArray().then(tracks =>
        playlistInfo.order ? playlistInfo.order.map(id => tracks.find(track => track.id = id)) : tracks,
      );
    } else {
      playlist = null;
    }
    return playlist;
  }

  function guid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
  }

  function insert_myplaylist_to_myplaylists(playlist_type, playlist_id, to_playlist_id, direction) {
    const key = getPlaylistObjectKey(playlist_type);
    if (key === '') {
      return [];
    }
    const playlists = localStorage.getObject(key);

    const index = playlists.findIndex((i) => i === playlist_id);
    let insertIndex = playlists.findIndex((i) => i === to_playlist_id);
    if (index === insertIndex) {
      return playlists;
    }
    if (insertIndex > index) {
      insertIndex -= 1;
    }
    const offset = direction === 'top' ? 0 : 1;

    array_move(playlists, index, insertIndex + offset);

    localStorage.setObject(key, playlists);
    return playlists;
  }

  const save_myplaylist = async (playlist_type, playlistObj) => {
    const playlist = await playlistObj;

    const playlistInfo = { ...playlist.info };

    // update listid
    let playlist_id = '';
    if (playlist_type === 'my') {
      playlist_id = `myplaylist_${guid()}`;
      playlistInfo.id = playlist_id;
      playlistInfo.type = 'my';
      playlistInfo.order = playlist.tracks.map(track => track.id);
      playlist.tracks.forEach(track => track.playlist = playlist_id);
      await iDB.transaction('rw', [iDB.Settings, iDB.Tracks, iDB.Playlists], async () => {
        await iDB.Settings.where('key')
          .equals('my_playlist_order')
          .modify((order) => order.value.push(playlist_id));
        await iDB.Playlists.put(playlistInfo);
        await iDB.Tracks.where('playlist').equals(playlist_id).delete();
        await iDB.Tracks.bulkAdd(playlist.tracks);
      });

    } else if (playlist_type === 'favorite') {
      playlist_id = playlist.info.id;
      playlistInfo.type = 'favorite';
      await iDB.Settings.where('key')
        .equals('favorite_playlist_order')
        .modify((order) => order.value.push(playlist_id));
      await iDB.Playlists.put(playlistInfo);

      // remove all tracks info, cause favorite playlist always load latest
    }
    EventService.emit(`playlist:${playlist_type}:update`);

    return playlist_id;
  };

  const remove_myplaylist = async (playlist_type, playlist_id) => {
    await iDB.transaction('rw', iDB.Tracks, iDB.Playlists, async () => {
      await iDB.Playlists.where('id').equals(playlist_id).delete();
      await iDB.Tracks.where('playlist').equals(playlist_id).delete();
    });
    EventService.emit(`playlist:${playlist_type}:update`);
  };

  async function add_track_to_myplaylist(playlist_id, tracks) {
    const playlist = await iDB.Playlists.get({ id: playlist_id });
    if (!playlist) {
      return null;
    }
    // dedupe
    const filterTracks = tracks.filter((i) => !playlist.order.includes(i.id));
    playlist.order = playlist.order.concat(filterTracks.map(i => i.id));
    filterTracks.forEach(i => i.playlist = playlist_id);
    await iDB.transaction('rw', [iDB.Playlists, iDB.Tracks], () => {
      // new track will always insert in beginning of playlist
      iDB.Playlists.put(playlist);
      iDB.Tracks.bulkPut(filterTracks);
    });

    return playlist;
  }

  function insert_track_to_myplaylist(playlist_id, track, to_track, direction) {
    const playlist = localStorage.getObject(playlist_id);
    if (playlist == null) {
      return null;
    }
    const index = playlist.tracks.findIndex((i) => i.id === track.id);
    let insertIndex = playlist.tracks.findIndex((i) => i.id === to_track.id);
    if (index === insertIndex) {
      return playlist;
    }
    if (insertIndex > index) {
      insertIndex -= 1;
    }
    const offset = direction === 'top' ? 0 : 1;
    array_move(playlist.tracks, index, insertIndex + offset);
    localStorage.setObject(playlist_id, playlist);
    return playlist;
  }

  function remove_track_from_myplaylist(playlist_id, track_id) {
    const playlist = localStorage.getObject(playlist_id);
    if (playlist == null) {
      return;
    }
    const newtracks = playlist.tracks.filter((item) => item.id !== track_id);
    playlist.tracks = newtracks;
    localStorage.setObject(playlist_id, playlist);
  }

  function create_myplaylist(playlist_title, tracks) {
    const playlist = {
      info: {
        cover_img_url: 'images/mycover.jpg',
        title: playlist_title,
        id: '',
        source_url: '',
      },
      tracks,
    };

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
    get_myplaylists_list,
    save_myplaylist,
    get_playlist: get_myplaylist,
    remove_myplaylist,
    add_track_to_myplaylist,
    remove_track_from_myplaylist,
    create_myplaylist,
    edit_myplaylist,
    myplaylist_containers,
    insert_track_to_myplaylist,
    insert_myplaylist_to_myplaylists
  };
};

export default myplaylistFactory();
