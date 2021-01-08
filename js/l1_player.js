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

  const l1Player = {
    status: {
      muted: false,
      volume: 1,
      loop_mode: 0,
      playing: null,
    },
    bootstrapTrack: null,
    play() {
      chrome.runtime.getBackgroundPage((w) => {
        w.player.play();
      });
    },
    pause() {
      chrome.runtime.getBackgroundPage((w) => {
        w.player.pause();
      });
    },
    toggleplayPause() {
      chrome.runtime.getBackgroundPage((w) => {
        if (w.player.playing) {
          w.player.pause();
        } else {
          w.player.play();
        }
      });
    },
    playById(id) {
      chrome.runtime.getBackgroundPage((w) => {
        w.player.playById(id);
      });
    },
    loadById(idx) {
      chrome.runtime.getBackgroundPage((w) => {
        w.player.loadById(idx);
      });
    },
    seek(per) {
      chrome.runtime.getBackgroundPage((w) => {
        w.player.seek(per);
      });
    },
    next() {
      chrome.runtime.getBackgroundPage((w) => {
        w.player.skip('next');
      });
    },
    prev() {
      chrome.runtime.getBackgroundPage((w) => {
        w.player.skip('prev');
      });
    },
    random() {
      chrome.runtime.getBackgroundPage((w) => {
        w.player.skip('random');
      });
    },
    setLoopMode(input) {
      chrome.runtime.getBackgroundPage((w) => {
        w.player.setLoopMode(input);
      });
    },
    mute() {
      chrome.runtime.getBackgroundPage((w) => {
        w.player.mute();
      });
    },
    unmute() {
      chrome.runtime.getBackgroundPage((w) => {
        w.player.unmute();
      });
    },
    toggleMute() {
      chrome.runtime.getBackgroundPage((w) => {
        if (w.player.muted) w.player.unmute();
        else w.player.mute();
      });
    },
    volume(per) {
      chrome.runtime.getBackgroundPage((w) => {
        w.player.volume(per / 100);
      });
    },
    adjustVolume(increase) {
      chrome.runtime.getBackgroundPage((w) => {
        w.player.adjustVolume(increase);
      });
    },
    addTrack(track) {
      chrome.runtime.getBackgroundPage((w) => {
        w.player.insertAudio(track);
      });
    },
    addTracks(list) {
      chrome.runtime.getBackgroundPage((w) => {
        w.player.appendAudioList(list);
      });
    },
    clearPlaylist() {
      chrome.runtime.getBackgroundPage((w) => {
        w.player.clearPlaylist();
      });
    },
    setNewPlaylist(list) {
      chrome.runtime.getBackgroundPage((w) => {
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
    sendUpdates() {
      chrome.runtime.getBackgroundPage((w) => {
        w.player.sendFullUpdate();
        // w.player.sendPlaylistEvent();
        w.player.sendPlayingEvent();
        w.player.sendLoadEvent();
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

    ngApp.directive('playPauseToggle', () => ({
      restrict: 'EA',
      link(scope, element) {
        element.bind('click', () => {
          l1Player.toggleplayPause();
        });
      },
    }));
  };

  chrome.runtime.onMessage.addListener((msg, sender, res) => {
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
        l1Player.bootstrapTrack({
          /**
           * A mock sound object to set url back in player.
           * @param {string} val
           */
          set url(val) {
            chrome.runtime.getBackgroundPage((w) => {
              w.player.setMediaURI(val, msg.data.url);
            });
          },
        }, msg.data, () => {
          chrome.runtime.getBackgroundPage((w) => {
            w.player.setAudioDisabled(false, msg.data.index);
            w.player.finishLoad(msg.data.index, msg.data.playNow);
          });
        }, () => {
          chrome.runtime.getBackgroundPage((w) => {
            w.player.setAudioDisabled(true, msg.data.index);
            w.player.setURL(null, msg.data.index);
            w.player.skipTo('next');
          });
        });
      }
    }
    res();
  });

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
  initPlayer(l1Player);

  window.l1Player = l1Player;
}
