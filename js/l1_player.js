/* global localStorage */
// eslint-disable-next-line no-unused-vars
{
  const proto = Object.getPrototypeOf(localStorage);
  proto.getObject = function getObject(key) {
    const value = this.getItem(key);
    return value && JSON.parse(value);
  };
  proto.setObject = function setObject(key, value) {
    this.setItem(key, JSON.stringify(value));
  };
  Object.setPrototypeOf(localStorage, proto);

  const backgroundCall = (callback) => {
    (chrome || browser).runtime.getBackgroundPage(callback);
  };

  const initPlayer = (player) => {
    // add songs to playlist
    let localCurrentPlaying = localStorage.getObject('playing-list');
    if (localCurrentPlaying === null) {
      localCurrentPlaying = localStorage.getObject('current-playing');
    }
    if (localCurrentPlaying === null) {
      return;
    }
    player.setNewPlaylist(localCurrentPlaying);

    const localPlayerSettings = localStorage.getObject('player-settings');
    if (localPlayerSettings === null) {
      return;
    }
    const track_id = localPlayerSettings.nowplaying_track_id;
    player.loadById(track_id);
  };

  const l1Player = {
    status: {
      muted: false,
      volume: 1,
      loop_mode: 0,
      playing: null,
    },
    bootstrapTrack: null,
    play() {
      backgroundCall((w) => {
        w.player.play();
      });
    },
    pause() {
      backgroundCall((w) => {
        w.player.pause();
      });
    },
    toggleplayPause() {
      backgroundCall((w) => {
        if (w.player.playing) {
          w.player.pause();
        } else {
          w.player.play();
        }
      });
    },
    playById(id) {
      backgroundCall((w) => {
        w.player.playById(id);
      });
    },
    loadById(idx) {
      backgroundCall((w) => {
        w.player.loadById(idx);
      });
    },
    seek(per) {
      backgroundCall((w) => {
        w.player.seek(per);
      });
    },
    next() {
      backgroundCall((w) => {
        w.player.skip('next');
      });
    },
    prev() {
      backgroundCall((w) => {
        w.player.skip('prev');
      });
    },
    random() {
      backgroundCall((w) => {
        w.player.skip('random');
      });
    },
    setLoopMode(input) {
      backgroundCall((w) => {
        w.player.setLoopMode(input);
      });
    },
    mute() {
      backgroundCall((w) => {
        w.player.mute();
      });
    },
    unmute() {
      backgroundCall((w) => {
        w.player.unmute();
      });
    },
    toggleMute() {
      backgroundCall((w) => {
        if (w.player.muted) w.player.unmute();
        else w.player.mute();
      });
    },
    volume(per) {
      backgroundCall((w) => {
        w.player.volume(per / 100);
      });
    },
    adjustVolume(increase) {
      backgroundCall((w) => {
        w.player.adjustVolume(increase);
      });
    },
    addTrack(track) {
      backgroundCall((w) => {
        w.player.insertAudio(track);
      });
    },
    removeTrack(index) {
      backgroundCall((w) => {
        w.player.removeAudio(index);
      });
    },
    addTracks(list) {
      backgroundCall((w) => {
        w.player.appendAudioList(list);
      });
    },
    clearPlaylist() {
      backgroundCall((w) => {
        w.player.clearPlaylist();
      });
    },
    setNewPlaylist(list) {
      backgroundCall((w) => {
        w.player.setNewPlaylist(list);
      });
    },
    getTrackById(id) {
      if (!l1Player.status.playlist) return null;
      return l1Player.status.playlist.find(track => track.id === id);
    },
    setBootstrapTrack(fn) {
      l1Player.bootstrapTrack = fn;
    },
    connectPlayer() {
      const player = this;
      backgroundCall((w) => {
        w.player.sendFullUpdate();
        w.player.sendPlaylistEvent();
        w.player.sendPlayingEvent();
        w.player.sendLoadEvent();
        if (!w.player.playing) {
          initPlayer(player);
        }
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
          l1Player.toggleplayPause();
        });
      },
    }));
  };

  (chrome || browser).runtime.onMessage.addListener((msg, sender, res) => {
    if (msg.type === 'BG_PLAYER:FULL_UPDATE') {
      l1Player.status = {
        ...l1Player.status,
        ...msg.data,
      };
    }
    if (msg.type === 'BG_PLAYER:FRAME_UPDATE') {
      l1Player.status.playing = {
        ...l1Player.status.playing,
        ...msg.data,
      };
    }
    if (msg.type === 'BG_PLAYER:PLAYLIST') {
      l1Player.status.playlist = msg.data || [];
    }
    if (msg.type === 'BG_PLAYER:RETRIEVE_URL') {
      if (l1Player.bootstrapTrack) {
        let url = '';
        l1Player.bootstrapTrack({
          /**
           * A mock sound object to set url back in player.
           * @param {string} val
           */
          set url(val) {
            url = val;
          },
        }, msg.data, () => {
          backgroundCall((w) => {
            w.player.setMediaURI(url, msg.data.url || msg.data.id);
            w.player.setAudioDisabled(false, msg.data.index);
            w.player.finishLoad(msg.data.index, msg.data.playNow);
          });
        }, () => {
          backgroundCall((w) => {
            w.player.setAudioDisabled(true, msg.data.index);
            w.player.setURL(null, msg.data.index);
            w.player.skipTo('next');
          });
        });
      }
    }
    res();
  });

  window.l1Player = l1Player;
}
