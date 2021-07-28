/* eslint-disable no-param-reassign */
/* global isElectron getPlayer getPlayerAsync addPlayerListener getLocalStorageValue */
{
  const mode =
    isElectron() || getLocalStorageValue('enable_stop_when_close', true)
      ? 'front'
      : 'background';

  const myPlayer = getPlayer(mode);
  const l1Player = {
    status: {
      muted: myPlayer.muted,
      volume: myPlayer.volume * 100,
      loop_mode: myPlayer.loop_mode,
      playing: myPlayer.playing,
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
      getPlayerAsync(mode, (player) => {
        if (!player.playing) {
          // load local storage settings
          if (!player.playlist.length) {
            const localCurrentPlaying =
              localStorage.getObject('current-playing');
            if (localCurrentPlaying !== null) {
              localCurrentPlaying.forEach((i) => {
                i.disabled = false;
              });
              player.setNewPlaylist(localCurrentPlaying);
            }
          }

          const localPlayerSettings = localStorage.getObject('player-settings');
          if (localPlayerSettings !== null) {
            player.loadById(localPlayerSettings.nowplaying_track_id);
          }
        }

        player.sendPlaylistEvent();
        player.sendPlayingEvent();
        player.sendLoadEvent();
      });
    },
  };

  l1Player.injectDirectives = (ngApp) => {
    ngApp.directive('playFromPlaylist', () => ({
      restrict: 'EA',
      scope: {
        song: '=playFromPlaylist',
      },
      link(scope, element) {
        element.bind('click', () => {
          l1Player.playById(scope.song.id);
        });
      },
    }));

    ngApp.directive('nextTrack', () => ({
      restrict: 'EA',
      link(scope, element) {
        element.bind('click', () => {
          l1Player.next();
        });
      },
    }));

    ngApp.directive('prevTrack', () => ({
      restrict: 'EA',
      link(scope, element) {
        element.bind('click', () => {
          l1Player.prev();
        });
      },
    }));

    ngApp.directive('clearPlaylist', () => ({
      restrict: 'EA',
      link(scope, element) {
        element.bind('click', () => {
          l1Player.clearPlaylist();
        });
      },
    }));

    ngApp.directive('removeFromPlaylist', () => ({
      restrict: 'EA',
      scope: {
        song: '=removeFromPlaylist',
      },
      link(scope, element, attrs) {
        element.bind('click', () => {
          l1Player.removeTrack(attrs.index);
        });
      },
    }));

    ngApp.directive('playPauseToggle', () => ({
      restrict: 'EA',
      link(scope, element) {
        element.bind('click', () => {
          l1Player.togglePlayPause();
        });
      },
    }));
  };

  addPlayerListener(mode, (msg, sender, res) => {
    if (msg.type === 'BG_PLAYER:FRAME_UPDATE') {
      l1Player.status.playing = {
        ...l1Player.status.playing,
        ...msg.data,
      };
    } else if (msg.type === 'BG_PLAYER:PLAYLIST') {
      l1Player.status.playlist = msg.data || [];
    }
    if (res !== undefined) {
      res();
    }
  });

  window.l1Player = l1Player;
}
