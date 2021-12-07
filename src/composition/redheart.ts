import { reactive } from 'vue';
import iDB from '../services/DBService';
import MediaService from '../services/MediaService';

const redheart = reactive({
  tracks: <{ [key: string]: any }>{} // array is not reactive
});

function isRedHeart(trackId: string) {
  return redheart.tracks[trackId] !== undefined;
}

async function initRedHeart() {
  const redheartPlaylist = await iDB.Playlists.get({ id: 'myplaylist_redheart' });
  if (redheartPlaylist) {
    redheartPlaylist.order.forEach((id) => {
      redheart.tracks[id] = 1;
    });
  }
}

async function setRedHeart(track: any, value: boolean) {
  if (value) {
    await MediaService.addMyPlaylist('myplaylist_redheart', [track]);
    redheart.tracks[track.id] = 1;
  } else {
    await MediaService.removeTrackFromMyPlaylist(track.id, 'myplaylist_redheart');
    redheart.tracks[track.id] = undefined;
  }
}

async function addMyPlaylistByUpdateRedHeart(list_id: string, tracks: unknown[]) {
  await MediaService.addMyPlaylist(list_id, tracks);
  if (list_id === 'myplaylist_redheart') {
    tracks.forEach((track: any) => {
      redheart.tracks[track.id] = 1;
    });
  }
}

async function removeTrackFromMyPlaylistByUpdateRedHeart(track_id: string, list_id: string) {
  await MediaService.removeTrackFromMyPlaylist(track_id, list_id);
  if (list_id === 'myplaylist_redheart') {
    redheart.tracks[track_id] = undefined;
  }
}

function useRedHeart() {
  return { redheart, isRedHeart, setRedHeart, initRedHeart, addMyPlaylistByUpdateRedHeart, removeTrackFromMyPlaylistByUpdateRedHeart };
}
export default useRedHeart;
