import MediaService from '../../services/MediaService';
import { isElectron, smoothScrollTo } from '../../provider/lowebutil';
import { l1Player } from '../../services/l1_player';
import notyf from '../../services/notyf';
import I18n from '../../i18n';
function rightPadding(str, length, padChar) {
  const newstr = str + new Array(length - str.length + 1).join(padChar);
  return newstr;
}
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
          (timeRegResult[3] ? parseInt(rightPadding(timeRegResult[3], 3, '0'), 10) : 0), // microsec
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
export default {
  namespaced: true,
  state() {
    return {
      playlist: [],
      isPlaying: false,
      lyricArray: [],
      lyricLineNumber: -1,
      lyricLineNumberTrans: -1,
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
    };
  },
  mutations: {
    setPlaylist(state, newValue) {
      state.playlist = newValue;
    },
    setCurrentPlaying(state, newValue) {
      state.currentPlaying = newValue;
    },
    setMyProgress(state, newValue) {
      state.myProgress = newValue;
    },
    setLyricArray(state, newValue) {
      state.lyricArray = newValue;
    },
    setLyricLineNumber(state, newValue) {
      state.lyricLineNumber = newValue;
    },
    setLineNumberTrans(state, newValue) {
      state.lineNumberTrans = newValue;
    },
    setLastTrackId(state, newValue) {
      state.lastTrackId = newValue;
    },
    setIsPlaying(state, newValue) {
      state.isPlaying = newValue;
    },
    setCurrentDuration(state, newValue) {
      state.currentDuration = newValue;
    },
    setCurrentPosition(state, newValue) {
      state.currentPosition = newValue;
    },
    setMute(state, newValue) {
      state.mute = newValue;
    },
    setVolume(state, newValue) {
      state.volume = newValue;
    },
    setBySetting(state, newValue) {
      for (let k in newValue) {
        state[k] = newValue[k];
      }
    }
  },
  actions: {
    saveState({ state }) {
      const settings = {
        playmode: state.playmode,
        nowplaying_track_id: state.nowplaying_track_id,
        volume: state.volume
      };

      localStorage.setObject('player-settings', settings);
    },
    initState({ commit, dispatch }) {
      const localSettings = localStorage.getObject('player-settings');
      if (localSettings === null) {
        dispatch('saveState');
      } else {
        commit('setBySetting', {
          playmode: localSettings.playmode,
          nowplaying_track_id: localSettings.nowplaying_track_id,
          volume: localSettings.volume
        });
      }
      l1Player.connectPlayer();
    },
    changePlaymode({ commit, dispatch }, { mode }) {
      commit('setBySetting', {
        playmode: mode
      });
      switch (mode) {
        case 0:
          l1Player.setLoopMode('all');
          break;
        case 1:
          l1Player.setLoopMode('shuffle');
          break;
        case 2:
          l1Player.setLoopMode('one');
          break;
        default:
      }
      dispatch('saveState');
    },
    playerListener({ commit, state, dispatch }, { mode, msg, sender, sendResponse }) {
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
            commit('setVolume', msg.data);
            break;
          }

          case 'FRAME_UPDATE': {
            // 'currentTrack:position'
            // update lyric position
            if (!l1Player.status.playing.id) break;
            const currentSeconds = msg.data.pos;
            let lastObject = null;
            let lastObjectTrans = null;
            state.lyricArray.forEach((lyric) => {
              if (currentSeconds >= lyric.seconds / 1000) {
                if (lyric.translationFlag !== true) {
                  lastObject = lyric;
                } else {
                  lastObjectTrans = lyric;
                }
              }
            });
            if (lastObject && lastObject.lineNumber !== state.lyricLineNumber) {
              const lineElement = document.querySelector(`.page .playsong-detail .detail-songinfo .lyric p[data-line="${lastObject.lineNumber}"]`);
              const windowHeight = document.querySelector('.page .playsong-detail .detail-songinfo .lyric').offsetHeight;

              const adjustOffset = 30;
              const offset = lineElement.offsetTop - windowHeight / 2 + adjustOffset;
              smoothScrollTo(document.querySelector('.lyric'), offset, 500);

              commit('setLyricLineNumber', lastObject.lineNumber);
              if (lastObjectTrans && lastObjectTrans.lineNumber !== state.lyricLineNumberTrans) {
                commit('setLineNumberTrans', lastObject.lineNumber);
              }
              // if (isElectron()) {
              //   const { ipcRenderer } = require("electron");
              //   const currentLyric =
              //     state.lyricArray[lastObject.lineNumber].content;
              //   let currentLyricTrans = "";
              //   if (
              //     state.enableLyricFloatingWindowTranslation === true &&
              //     lastObjectTrans
              //   ) {
              //     currentLyricTrans =
              //       state.lyricArray[lastObjectTrans.lineNumber].content;
              //   }
              //   ipcRenderer.send("currentLyric", {
              //     lyric: currentLyric,
              //     tlyric: currentLyricTrans,
              //   });
              // }
            }

            // 'currentTrack:duration'
            (() => {
              const durationSec = Math.floor(msg.data.duration);
              const durationStr = `${Math.floor(durationSec / 60)}:${`0${durationSec % 60}`.substr(-2)}`;
              if (msg.data.duration === 0 || state.currentDuration === durationStr) {
                return;
              }
              commit('setCurrentDuration', durationStr);
            })();

            // 'track:progress'
            if (state.changingProgress === false) {
              if (msg.data.duration === 0) {
                commit('setMyProgress', 0);
              } else {
                commit('setMyProgress', (msg.data.pos / msg.data.duration) * 100);
              }
              const posSec = Math.floor(msg.data.pos);
              const posStr = `${Math.floor(posSec / 60)}:${`0${posSec % 60}`.substr(-2)}`;

              commit('setCurrentPosition', posStr);
            }
            break;
          }

          case 'LOAD': {
            commit('setCurrentPlaying', msg.data);
            if (msg.data.id === undefined) {
              break;
            }

            // state.currentPlaying.platformText = state.$t(state.currentPlaying.platform);
            commit('setMyProgress', 0);

            if (state.lastTrackId === msg.data.id) {
              break;
            }

            // const current = localStorage.getObject('player-settings') || {};
            commit('setBySetting', { nowplaying_track_id: msg.data.id });
            dispatch('saveState');
            // current.nowplaying_track_id = msg.data.id;
            // localStorage.setObject('player-settings', current);
            // update lyric
            commit('setLyricArray', []);
            commit('setLyricLineNumber', -1);
            commit('setLineNumberTrans', -1);

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

              commit('setLyricArray', parseLyric(lyric, tlyric));
            });
            commit('setLastTrackId', msg.data.id);

            if (isElectron()) {
              const { ipcRenderer } = require('electron');
              ipcRenderer.send('currentLyric', track.title);
              ipcRenderer.send('trackPlayingNow', track);
            }
            break;
          }

          case 'MUTE': {
            // 'music:mute'

            commit('setMute', msg.data);

            break;
          }

          case 'PLAYLIST': {
            // 'player:playlist'
            commit('setPlaylist', msg.data);
            localStorage.setObject('current-playing', msg.data);

            break;
          }

          case 'PLAY_STATE': {
            // 'music:isPlaying'
            commit('setIsPlaying', !!msg.data.isPlaying);

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
            commit('setCurrentPlaying', msg.data);

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
      if (sendResponse !== undefined) {
        sendResponse();
      }
    }
  }
};
