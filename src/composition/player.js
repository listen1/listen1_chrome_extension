import { reactive } from 'vue';
import I18n from '../i18n/index';
import { isElectron, smoothScrollTo } from '../provider/lowebutil';
import { l1Player } from '../services/l1_player';
import MediaService from '../services/MediaService';
import notyf from '../services/notyf';
import iDB from '../services/DBService';
import useSettings from '../composition/settings';

function parseLyric(lyric, tlyric) {
  const lines = lyric.split('\n');
  let result = [];
  const timeResult = [];

  if (typeof tlyric !== 'string') {
    tlyric = '';
  }
  const linesTrans = tlyric.split('\n');
  const resultTrans = [];
  const timeResultTrans = [];
  if (tlyric === '') {
    linesTrans.splice(0);
  }

  const process = (result, timeResult, translationFlag) => (line, index) => {
    const tagReg = /\[\D*:([^\]]+)\]/g;
    const tagRegResult = tagReg.exec(line);
    if (tagRegResult) {
      const lyricObject = {};
      lyricObject.seconds = 0;
      [lyricObject.content] = tagRegResult;
      result.push(lyricObject);
      return;
    }

    const timeReg = /\[(\d{2,})\:(\d{2})(?:\.(\d{1,3}))?\]/g; // eslint-disable-line no-useless-escape

    let timeRegResult = null;
    // eslint-disable-next-line no-cond-assign
    while ((timeRegResult = timeReg.exec(line)) !== null) {
      const htmlUnescapes = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&apos;': "'"
      };
      timeResult.push({
        content: line.replace(timeRegResult[0], '').replace(/&(?:amp|lt|gt|quot|#39|apos);/g, (match) => htmlUnescapes[match]),
        seconds:
          parseInt(timeRegResult[1], 10) * 60 * 1000 + // min
          parseInt(timeRegResult[2], 10) * 1000 + // sec
          (timeRegResult[3] ? parseInt(timeRegResult[3].padEnd(3, '0'), 10) : 0), // microsec
        translationFlag,
        index
      });
    }
  };

  lines.forEach(process(result, timeResult, false));
  linesTrans.forEach(process(resultTrans, timeResultTrans, true));

  // sort time line
  result = timeResult.concat(timeResultTrans).sort((a, b) => {
    const keyA = a.seconds;
    const keyB = b.seconds;

    // Compare the 2 dates
    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;
    if (a.translationFlag !== b.translationFlag) {
      if (a.translationFlag === false) {
        return -1;
      }
      return 1;
    }
    if (a.index < b.index) return -1;
    if (a.index > b.index) return 1;
    return 0;
  });
  // disable tag info, because music provider always write
  // tag info in lyric timeline.
  // result.push.apply(result, timeResult);
  // result = timeResult; // executed up there

  for (let i = 0; i < result.length; i += 1) {
    result[i].lineNumber = i;
  }

  return result;
}
const player = reactive({
  playlist: [],
  isPlaying: false,
  lyricArray: [],
  lyricLineNumber: -1,
  lyricLineNumberTrans: -1,
  lastTrackId: '',
  myProgress: 0,
  changingProgress: false,
  currentDuration: '0:00',
  currentPosition: '0:00',
  currentPlaying: {},
  mute: false,
  // state below is loaded from storage
  playmode: 0,
  nowplaying_track_id: -1,
  volume: 90
});

function saveState() {
  const { saveSettingsToDB } = useSettings();

  const newPlayerSettings = {
    playmode: player.playmode,
    nowplaying_track_id: player.nowplaying_track_id,
    volume: player.volume
  };

  saveSettingsToDB({ playerSettings: newPlayerSettings });
}

function initState() {
  const { getSettingsAsync } = useSettings();
  getSettingsAsync().then((settings) => {
    player.playmode = settings.playerSettings.playmode;
    player.nowplaying_track_id = settings.playerSettings.nowplaying_track_id;
    player.volume = settings.playerSettings.volume;
  });

  l1Player.connectPlayer();
}
function playerListener(mode, msg, sender, sendResponse) {
  if (typeof msg.type === 'string' && msg.type.split(':')[0] === 'BG_PLAYER') {
    switch (msg.type.split(':').slice(1).join('')) {
      case 'READY': {
        break;
      }
      case 'PLAY_FAILED': {
        notyf.info(I18n.global.t('_COPYRIGHT_ISSUE'), true);
        break;
      }

      case 'VOLUME': {
        player.volume = msg.data;
        break;
      }

      case 'FRAME_UPDATE': {
        // 'currentTrack:position'
        // update lyric position
        if (!l1Player.status.playing.id) break;
        const currentSeconds = msg.data.pos;
        let lastObject = null;
        let lastObjectTrans = null;
        player.lyricArray.forEach((lyric) => {
          if (currentSeconds >= lyric.seconds / 1000) {
            if (lyric.translationFlag !== true) {
              lastObject = lyric;
            } else {
              lastObjectTrans = lyric;
            }
          }
        });
        if (lastObject && lastObject.lineNumber !== player.lyricLineNumber) {
          const lineElement = document.querySelector(`.page .playsong-detail .detail-songinfo .lyric p[data-line="${lastObject.lineNumber}"]`);
          const windowHeight = document.querySelector('.page .playsong-detail .detail-songinfo .lyric').offsetHeight;

          const adjustOffset = 30;
          const offset = lineElement.offsetTop - windowHeight / 2 + adjustOffset;
          smoothScrollTo(document.querySelector('.lyric'), offset, 500);

          player.lyricLineNumber = lastObject.lineNumber;
          if (lastObjectTrans && lastObjectTrans.lineNumber !== player.lyricLineNumberTrans) {
            player.lyricLineNumberTrans = lastObjectTrans.lineNumber;
          }
          if (isElectron()) {
            const currentLyric = player.lyricArray[lastObject.lineNumber].content;
            let currentLyricTrans = '';
            if (player.enableLyricFloatingWindowTranslation === true && lastObjectTrans) {
              currentLyricTrans = player.lyricArray[lastObjectTrans.lineNumber].content;
            }
            window.api?.sendLyric({
              lyric: currentLyric,
              tlyric: currentLyricTrans
            });
          }
        }

        // 'currentTrack:duration'
        (() => {
          const durationSec = Math.floor(msg.data.duration);
          const durationStr = `${Math.floor(durationSec / 60)}:${`0${durationSec % 60}`.substr(-2)}`;
          if (msg.data.duration === 0 || player.currentDuration === durationStr) {
            return;
          }
          player.currentDuration = durationStr;
        })();

        // 'track:progress'
        if (player.changingProgress === false) {
          if (msg.data.duration === 0) {
            player.myProgress = 0;
          } else {
            player.myProgress = (msg.data.pos / msg.data.duration) * 100;
          }
          const posSec = Math.floor(msg.data.pos);
          const posStr = `${Math.floor(posSec / 60)}:${`0${posSec % 60}`.substr(-2)}`;
          player.currentPosition = posStr;
        }
        break;
      }

      case 'LOAD': {
        player.currentPlaying = msg.data;
        if (msg.data.id === undefined) {
          break;
        }

        // state.currentPlaying.platformText = state.$t(state.currentPlaying.platform);
        player.myProgress = 0;

        if (player.lastTrackId === msg.data.id) {
          break;
        }

        player.nowplaying_track_id = msg.data.id;

        saveState();
        // update lyric
        player.lyricArray = [];
        player.lyricLineNumber = -1;
        player.lyricLineNumberTrans = -1;

        smoothScrollTo(document.querySelector('.lyric'), 0, 300);
        const track = msg.data;
        // $rootScope.page_title = {
        //   title: track.title,
        //   artist: track.artist,
        //   status: "playing",
        // };
        // if (lastfm.isAuthorized()) {
        //   lastfm.sendNowPlaying(track.title, track.artist, () => {});
        // }

        MediaService.getLyric(msg.data.id, msg.data.album_id, track.lyric_url, track.tlyric_url).then(({ lyric, tlyric }) => {
          if (!lyric) {
            return;
          }
          player.lyricArray = parseLyric(lyric);
        });
        player.lastTrackId = msg.data.id;
        player.lastTrackId = msg.data.id;
        if (isElectron()) {
          window.api?.sendLyric({ lyric: `${track.title} - ${track.artist}`, tlyric: '' });
          window.api?.sendTrackPlayingNow(track);
        }
        break;
      }

      case 'MUTE': {
        // 'music:mute'
        player.mute = msg.data;
        break;
      }

      case 'PLAYLIST': {
        // 'player:playlist'
        player.playlist = msg.data;
        msg.data.forEach((track) => (track.playlist = 'current'));
        iDB.Playlists.put({
          id: 'current',
          title: 'current',
          cover_img_url: '',
          type: 'current',
          order: msg.data.map((i) => i.id)
        });
        iDB.Tracks.bulkPut(msg.data);

        break;
      }

      case 'PLAY_STATE': {
        // 'music:isPlaying'
        player.isPlaying = !!msg.data.isPlaying;
        // let title = "Listen 1";
        // if ($rootScope.page_title !== undefined) {
        //   title = "";
        //   if (msg.data.isPlaying) {
        //     $rootScope.page_title.status = "playing";
        //   } else {
        //     $rootScope.page_title.status = "paused";
        //   }
        //   if ($rootScope.page_title.status !== "") {
        //     if ($rootScope.page_title.status === "playing") {
        //       title += "▶ ";
        //     } else if ($rootScope.page_title.status === "paused") {
        //       title += "❚❚ ";
        //     }
        //   }
        //   title += $rootScope.page_title.title;
        //   if ($rootScope.page_title.artist !== "") {
        //     title += ` - ${$rootScope.page_title.artist}`;
        //   }
        // }

        // $rootScope.document_title = title;
        // if (isElectron()) {
        //   const { ipcRenderer } = require("electron");
        //   if (msg.data.isPlaying) {
        //     ipcRenderer.send("isPlaying", true);
        //   } else {
        //     ipcRenderer.send("isPlaying", false);
        //   }
        // }

        // if (msg.data.reason === "Ended") {
        //   if (!lastfm.isAuthorized()) {
        //     break;
        //   }
        //   // send lastfm scrobble
        //   const track = l1Player.getTrackById(l1Player.status.playing.id);
        //   lastfm.scrobble(
        //     l1Player.status.playing.playedFrom,
        //     track.title,
        //     track.artist,
        //     track.album,
        //     () => {}
        //   );
        // }

        break;
      }
      case 'RETRIEVE_URL_SUCCESS': {
        player.currentPlaying = msg.data;
        // update translate whenever set value
        // state.currentPlaying.platformText = i18next.t($scope.currentPlaying.platform);
        break;
      }
      case 'RETRIEVE_URL_FAIL': {
        notyf.info(I18n.global.t('_COPYRIGHT_ISSUE'), true);
        break;
      }
      case 'RETRIEVE_URL_FAIL_ALL': {
        notyf.warning(I18n.global.t('_FAIL_ALL_NOTICE'), true);
        break;
      }
      default:
        break;
    }
  }
  sendResponse?.();
}
function usePlayer() {
  return { player, playerListener, initState };
}
export default usePlayer;
