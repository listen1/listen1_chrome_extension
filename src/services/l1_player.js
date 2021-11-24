import { getPlayer, addPlayerListener, getPlayerAsync } from './bridge';
import { getLocalStorageValue } from '../provider/lowebutil';
import iDB from './DBService';

const mode = getLocalStorageValue('enable_stop_when_close', true) ? 'front' : 'background';

export const myPlayer = getPlayer(mode);
export const l1Player = {
  status: {
    muted: myPlayer.muted,
    volume: myPlayer.volume * 100,
    loop_mode: myPlayer.loop_mode,
    playing: myPlayer.playing
  },
  play() {
    getPlayerAsync(mode, (player) => {
      player.play();
    });
  },
  pause() {
    getPlayerAsync(mode, (player) => {
      player.pause();
    });
  },
  togglePlayPause() {
    getPlayerAsync(mode, (player) => {
      if (player.playing) {
        player.pause();
      } else {
        player.play();
      }
    });
  },
  playById(id) {
    getPlayerAsync(mode, (player) => {
      player.playById(id);
    });
  },
  loadById(idx) {
    getPlayerAsync(mode, (player) => {
      player.loadById(idx);
    });
  },
  seek(per) {
    getPlayerAsync(mode, (player) => {
      player.seek(per);
    });
  },
  next() {
    getPlayerAsync(mode, (player) => {
      player.skip('next');
    });
  },
  prev() {
    getPlayerAsync(mode, (player) => {
      player.skip('prev');
    });
  },
  random() {
    getPlayerAsync(mode, (player) => {
      player.skip('random');
    });
  },
  setLoopMode(input) {
    getPlayerAsync(mode, (player) => {
      // eslint-disable-next-line no-param-reassign
      player.loop_mode = input;
    });
  },
  mute() {
    getPlayerAsync(mode, (player) => {
      player.mute();
    });
  },
  unmute() {
    getPlayerAsync(mode, (player) => {
      player.unmute();
    });
  },
  toggleMute() {
    getPlayerAsync(mode, (player) => {
      if (player.muted) player.unmute();
      else player.mute();
    });
  },
  setVolume(per) {
    getPlayerAsync(mode, (player) => {
      // eslint-disable-next-line no-param-reassign
      player.volume = per / 100;
    });
  },
  adjustVolume(increase) {
    getPlayerAsync(mode, (player) => {
      player.adjustVolume(increase);
    });
  },
  addTrack(track) {
    getPlayerAsync(mode, (player) => {
      player.insertAudio(track);
    });
  },
  insertTrack(track, to_track, direction) {
    getPlayerAsync(mode, (player) => {
      player.insertAudioByDirection(track, to_track, direction);
    });
  },
  removeTrack(index) {
    getPlayerAsync(mode, (player) => {
      player.removeAudio(index);
    });
  },
  addTracks(list) {
    getPlayerAsync(mode, (player) => {
      player.appendAudioList(list);
    });
  },
  clearPlaylist() {
    getPlayerAsync(mode, (player) => {
      player.clearPlaylist();
    });
  },
  setNewPlaylist(list) {
    getPlayerAsync(mode, (player) => {
      player.setNewPlaylist(list);
    });
  },
  getTrackById(id) {
    if (!l1Player.status.playlist) return null;
    return l1Player.status.playlist.find((track) => track.id === id);
  },
  connectPlayer() {
    getPlayerAsync(mode, async (player) => {
      if (!player.playing) {
        // load local storage settings
        const currentPlaylist = await iDB.Playlists.get({ id: 'current' });
        const localCurrentPlaying = await iDB.Tracks.where('playlist').equals('current').toArray();
        const currentPlaying = currentPlaylist.order.map((id) => localCurrentPlaying.find((track) => track.id == id));
        const localPlayerSettings = localStorage.getObject('player-settings');

        if (!player.playlist.length) {
          currentPlaying.forEach((i) => {
            i.disabled = false;
          });
          player.setNewPlaylist(currentPlaying);
        }

        if (localPlayerSettings !== null) {
          player.loadById(localPlayerSettings.nowplaying_track_id);
        }
      }

      player.sendPlaylistEvent();
      player.sendPlayingEvent();
      player.sendLoadEvent();
    });
  }
};

addPlayerListener(mode, (msg, sender, res) => {
  if (msg.type === 'BG_PLAYER:FRAME_UPDATE') {
    l1Player.status.playing = {
      ...l1Player.status.playing,
      ...msg.data
    };
  } else if (msg.type === 'BG_PLAYER:PLAYLIST') {
    l1Player.status.playlist = msg.data || [];
  }
  if (res !== undefined) {
    res();
  }
});
