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

function useRedHeart() {
  return { redheart, isRedHeart, setRedHeart, initRedHeart };
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
export default useRedHeart;
