import { reactive } from 'vue';
import MediaService from '../services/MediaService';
import { parseLyric, calculateLine } from '../services/lyric';
import { smoothScrollTo } from '../provider/lowebutil';
import iDB from '../services/DBService';
import useSettings from '../composition/settings';

const player = reactive({
  playlist: [],
  isPlaying: false,
  enableLyric: false,
  lyricArray: [],
  _lyricArrayIndex: -1,
  lyricLineNumber: -1,
  lyricLineNumberTrans: -1,
  lastTrackId: '',
  myProgress: 0,
  changingProgress: false,
  currentDuration: '0:00',
  currentPosition: '0:00',
  currentPlaying: null,
  mute: false,
  // state below is loaded from storage
  playmode: 0,
  volume: 1
});

function savePlayerSettings() {
  const { saveSettingsToDB } = useSettings();

  const newPlayerSettings = {
    playmode: player.playmode,
    nowplaying_track_id: player.currentPlaying !== null ? player.currentPlaying.id : '',
    volume: player.volume * 100
  };

  saveSettingsToDB({ playerSettings: newPlayerSettings });
}
function formatTime(secs) {
  const minutes = Math.floor(secs / 60) || 0;
  const seconds = Math.round(secs - minutes * 60) || 0;

  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}
export class PlayerEventListener {
  async onEvent(name, params) {
    if (name === 'playing') {
      player.isPlaying = true;
    } else if (name === 'pause') {
      player.isPlaying = false;
    } else if (name === 'custom:nowplaying') {
      const { track } = params;
      player.currentPlaying = track;
      if (track === null) {
        return;
      }
      // save now playing
      savePlayerSettings();

      const { lyric, tlyric } = await MediaService.getLyric(track.id, track.album_id, track.lyric_url, track.tlyric_url);
      if (lyric) {
        player.lyricArray = parseLyric(lyric, tlyric);
        player._lyricArrayIndex = -1;
      }
    } else if (name === 'custom:playlist') {
      const { playlist } = params;
      player.playlist = playlist;

      // save playlist
      playlist.forEach((track) => (track.playlist = 'current'));
      iDB.Playlists.put({
        id: 'current',
        title: 'current',
        cover_img_url: '',
        type: 'current',
        order: playlist.map((i) => i.id)
      });
      iDB.Tracks.bulkPut(playlist);
    } else if (name === 'timeupdate') {
      player.currentDuration = formatTime(params.duration);
      player.currentPosition = formatTime(params.position);
      player.myProgress = (params.position / params.duration) * 100;
      if (!player.enableLyric) {
        return;
      }
      const { lineNumber, transLineNumber, index } = calculateLine(
        params.seconds,
        player.lyricArray,
        player.lyricLineNumber,
        player.lyricLineNumberTrans,
        player._lyricArrayIndex
      );
      player._lyricArrayIndex = index;
      if (lineNumber != player.lyricLineNumber) {
        if (player.lyricLineNumber != -1) {
          const lineElement = document.querySelector(`.page .playsong-detail .detail-songinfo .lyric p[data-line="${player.lyricLineNumber}"]`);
          const windowHeight = document.querySelector('.page .playsong-detail .detail-songinfo .lyric').offsetHeight;

          const adjustOffset = 30;
          const offset = lineElement.offsetTop - windowHeight / 2 + adjustOffset;
          smoothScrollTo(document.querySelector('.lyric'), offset, 500);
        }

        player.lyricLineNumber = lineNumber;
        player.lyricLineNumberTrans = transLineNumber;
      }
    } else if (name === 'custom:volume') {
      player.volume = params.volume;
    } else if (name === 'custom:loopmode') {
      player.playmode = params.loopmode;
      savePlayerSettings();
    }
  }
}
function usePlayer() {
  return { player };
}
export default usePlayer;
