import { reactive } from 'vue';
import MediaService from '../services/MediaService';
import { parseLyric, calculateLine } from '../services/lyric';
import { isElectron, smoothScrollTo } from '../provider/lowebutil';
import iDB from '../services/DBService';
import useSettings, { getSetting } from '../composition/settings';
import useOverlay from '../composition/overlay';

const player = reactive({
  playlist: { value: [] }, // array is not reactive
  isPlaying: false,
  lyricArray: { value: [] },
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

      player.position = 0;
      player.myProgress = 0;

      // clear lyric
      player.lyricArray = { value: [] };
      player._lyricArrayIndex = -1;
      player.lyricLineNumber = -1;
      player.lyricLineNumberTrans = -1;
      const { lyric, tlyric } = await MediaService.getLyric(track.id, track.album_id, track.lyric_url, track.tlyric_url);

      if (lyric) {
        player.lyricArray = { value: parseLyric(lyric, tlyric) };
      }

      if (isElectron()) {
        window.api?.sendLyric({ lyric: `${track.title} - ${track.artist}`, tlyric: '' });
        window.api?.sendTrackPlayingNow(track);
      }
      // update scroll position in current list
      document.getElementById(`song_${track.id}`).scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (name === 'custom:nowplaying_loaded') {
      if (!player.currentPlaying) {
        return;
      }
      const { bitrate, platform, url } = params;
      player.currentPlaying.bitrate = bitrate;
      player.currentPlaying.platform = platform;
      player.currentPlaying.url = url;
    } else if (name === 'custom:playlist') {
      const { playlist } = params;
      player.playlist = { value: playlist };
      playlist.forEach((track) => (track.playlist = 'current'));

      // save playlist
      await iDB.transaction('rw', [iDB.Tracks, iDB.Playlists], async () => {
        await iDB.Playlists.put({
          id: 'current',
          title: 'current',
          cover_img_url: '',
          type: 'current',
          order: playlist.map((i) => i.id)
        });
        await iDB.Tracks.where('playlist').equals('current').delete();
        await iDB.Tracks.bulkPut(playlist);
      });
    } else if (name === 'timeupdate') {
      player.currentDuration = formatTime(params.duration);
      player.currentPosition = formatTime(params.position);
      player.myProgress = (params.position / params.duration) * 100;
      const { overlay } = useOverlay();
      const { settings } = useSettings();

      if (overlay.type !== 'track' && !settings.enableLyricFloatingWindow) {
        return;
      }

      const { lineNumber, transLineNumber, index } = calculateLine(
        params.position,
        player.lyricArray.value,
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

          if (isElectron()) {
            window.api?.sendLyric({
              lyric: player.lyricArray.value[lineNumber].content,
              tlyric: getSetting('enableLyricTranslation') && player.lyricArray.value[transLineNumber] ? player.lyricArray.value[transLineNumber].content : ''
            });
          }
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
