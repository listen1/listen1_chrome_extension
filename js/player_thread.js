/* eslint-disable no-underscore-dangle */
/* global MediaMetadata playerSendMessage MediaService */
/* global Howl Howler */
{
  /**
   * Player class containing the state of our playlist and where we are in it.
   * Includes all methods for playing, skipping, updating the display, etc.
   * @param {Array} playlist Array of objects with playlist song details ({title, file, howl}).
   */
  class Player {
    constructor() {
      this.playlist = [];
      this._random_playlist = [];
      this.index = -1;
      this._loop_mode = 0;
      this._media_uri_list = {};
      this.playedFrom = 0;
      this.mode = 'background';
      this.skipTime = 15;
    }

    setMode(newMode) {
      this.mode = newMode;
    }

    setRefreshRate(rate = 10) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = setInterval(() => {
        if (this.playing) {
          this.sendFrameUpdate();
        }
      }, 1000 / rate);
    }

    get currentAudio() {
      return this.playlist[this.index];
    }

    get currentHowl() {
      return this.currentAudio && this.currentAudio.howl;
    }

    get playing() {
      return this.currentHowl ? this.currentHowl.playing() : false;
    }

    // eslint-disable-next-line class-methods-use-this
    get muted() {
      return !!Howler._muted;
    }

    insertAudio(audio, idx) {
      if (this.playlist.find((i) => audio.id === i.id)) return;

      const audioData = {
        ...audio,
        disabled: false, // avoid first time load block
        howl: null,
      };
      if (idx) {
        this.playlist.splice(idx, 0, [audio]);
      } else {
        this.playlist.push(audioData);
      }
      this.sendPlaylistEvent();
      this.sendLoadEvent();
    }

    static array_move(arr, old_index, new_index) {
      // https://stackoverflow.com/questions/5306680/move-an-array-element-from-one-array-position-to-another
      if (new_index >= arr.length) {
        let k = new_index - arr.length + 1;
        while (k > 0) {
          k -= 1;
          arr.push(undefined);
        }
      }
      arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
      return arr; // for testing
    }

    insertAudioByDirection(audio, to_audio, direction) {
      const originTrack = this.playlist[this.index];
      const index = this.playlist.findIndex((i) => i.id === audio.id);
      let insertIndex = this.playlist.findIndex((i) => i.id === to_audio.id);
      if (index === insertIndex) {
        return;
      }
      if (insertIndex > index) {
        insertIndex -= 1;
      }
      const offset = direction === 'top' ? 0 : 1;
      this.playlist = Player.array_move(
        this.playlist,
        index,
        insertIndex + offset
      );
      const foundOriginTrackIndex = this.playlist.findIndex(
        (i) => i.id === originTrack.id
      );
      if (foundOriginTrackIndex >= 0) {
        this.index = foundOriginTrackIndex;
      }

      this.sendPlaylistEvent();
      this.sendLoadEvent();
    }

    removeAudio(idx) {
      if (!this.playlist[idx]) {
        return;
      }
      // restore playing status before change
      const isPlaying = this.playing;
      const { id: trackId } = this.currentAudio;

      if (isPlaying && this.playlist[idx].id === trackId) {
        this.pause();
      }

      this.playlist.splice(idx, 1);
      const newIndex = this.playlist.findIndex((i) => i.id === trackId);
      if (newIndex >= 0) {
        this.index = newIndex;
      } else {
        // current playing is deleted
        if (idx >= this.playlist.length) {
          this.index = this.playlist.length - 1;
        } else {
          this.index = idx;
        }
        if (isPlaying) {
          this.play();
        }
      }

      this.sendPlaylistEvent();
      this.sendLoadEvent();
    }

    appendAudioList(list) {
      if (!Array.isArray(list)) {
        return;
      }
      list.forEach((audio) => {
        this.insertAudio(audio);
      });
    }

    clearPlaylist() {
      this.stopAll(); // stop the loadded track before remove list
      this.playlist = [];
      Howler.unload();
      this.sendPlaylistEvent();
      this.sendLoadEvent();
    }

    stopAll() {
      this.playlist.forEach((i) => {
        if (i.howl) {
          i.howl.stop();
        }
      });
    }

    setNewPlaylist(list) {
      if (list.length) {
        // stop current
        this.stopAll();
        Howler.unload();

        this.playlist = list.map((audio) => ({
          ...audio,
          howl: null,
        }));
        // TODO: random mode need random choose first song to load
        this.index = 0;
        this.load(0);
      }
      this.sendPlaylistEvent();
    }

    playById(id) {
      const idx = this.playlist.findIndex((audio) => audio.id === id);
      this.play(idx);
    }

    loadById(id) {
      const idx = this.playlist.findIndex((audio) => audio.id === id);
      this.load(idx);
    }

    /**
     * Play a song in the playlist.
     * @param  {Number} index Index of the song in the playlist
     * (leave empty to play the first or current).
     */
    play(idx) {
      this.load(idx);

      const data = this.playlist[this.index];
      if (!data.howl || !this._media_uri_list[data.id]) {
        this.retrieveMediaUrl(this.index, true);
      } else {
        this.finishLoad(this.index, true);
      }
    }

    retrieveMediaUrl(index, playNow) {
      const msg = {
        type: 'BG_PLAYER:RETRIEVE_URL',
        data: {
          ...this.playlist[index],
          howl: undefined,
          index,
          playNow,
        },
      };

      MediaService.bootstrapTrack(
        msg.data,
        (bootinfo) => {
          msg.type = 'BG_PLAYER:RETRIEVE_URL_SUCCESS';

          msg.data = { ...msg.data, ...bootinfo };

          this.playlist[index].bitrate = bootinfo.bitrate;
          this.playlist[index].platform = bootinfo.platform;

          this.setMediaURI(msg.data.url, msg.data.id);
          this.setAudioDisabled(false, msg.data.index);
          this.finishLoad(msg.data.index, playNow);
          playerSendMessage(this.mode, msg);
        },
        () => {
          msg.type = 'BG_PLAYER:RETRIEVE_URL_FAIL';

          this.setAudioDisabled(true, msg.data.index);
          playerSendMessage(this.mode, msg);

          this.skip('next');
        }
      );
    }

    /**
     * Load a song from the playlist.
     * @param  {Number} index Index of the song in the playlist
     * (leave empty to load the first or current).
     */
    load(idx) {
      let index = typeof idx === 'number' ? idx : this.index;
      if (index < 0) return;
      if (!this.playlist[index]) {
        index = 0;
      }
      // stop when load new track to avoid multiple songs play in same time
      if (index !== this.index) {
        Howler.unload();
      }
      this.index = index;

      this.sendLoadEvent();
    }

    finishLoad(index, playNow) {
      const data = this.playlist[index];

      // If we already loaded this track, use the current one.
      // Otherwise, setup and load a new Howl.
      const self = this;
      if (!data.howl) {
        data.howl = new Howl({
          src: [self._media_uri_list[data.url || data.id]],
          volume: 1,
          mute: self.muted,
          html5: true, // Force to HTML5 so that the audio can stream in (best for large files).
          onplay() {
            if ('mediaSession' in navigator) {
              const { mediaSession } = navigator;
              mediaSession.playbackState = 'playing';
              mediaSession.metadata = new MediaMetadata({
                title: self.currentAudio.title,
                artist: self.currentAudio.artist,
                album: `Listen1  •  ${(
                  self.currentAudio.album || '<???>'
                ).padEnd(100)}`,
                artwork: [
                  {
                    src: self.currentAudio.img_url,
                    sizes: '300x300',
                  },
                ],
              });
            }
            self.currentAudio.disabled = false;
            self.playedFrom = Date.now();
            self.sendPlayingEvent('Playing');
          },
          onload() {
            self.currentAudio.disabled = false;
            self.sendPlayingEvent('Loaded');
          },
          onend() {
            switch (self.loop_mode) {
              case 2:
                self.skip('random');
                break;

              case 1:
                self.play();
                break;

              case 0:
              default:
                self.skip('next');
                break;
            }
            self.sendPlayingEvent('Ended');
          },
          onpause() {
            navigator.mediaSession.playbackState = 'paused';
            self.sendPlayingEvent('Paused');
          },
          onstop() {
            self.sendPlayingEvent('Stopped');
          },
          onseek() {},
          onvolume() {},
          onloaderror(id, err) {
            playerSendMessage(this.mode, {
              type: 'BG_PLAYER:PLAY_FAILED',
              data: err,
            });
            self.currentAudio.disabled = true;
            self.sendPlayingEvent('err');
            self.currentHowl.unload();
            delete self._media_uri_list[data.id];
          },
          onplayerror(id, err) {
            playerSendMessage(this.mode, {
              type: 'BG_PLAYER:PLAY_FAILED',
              data: err,
            });
            self.currentAudio.disabled = true;
            self.sendPlayingEvent('err');
          },
        });
      }

      if (playNow) {
        if (this.playing && index === this.index) {
          return;
        }
        this.playlist.forEach((i) => {
          if (i.howl && i.howl !== this.currentHowl) {
            i.howl.stop();
          }
        });
        this.currentHowl.play();
      }
    }

    /**
     * Pause the currently playing track.
     */
    pause() {
      if (!this.currentHowl) return;

      // Puase the sound.
      this.currentHowl.pause();
    }

    /**
     * Skip to the next or previous track.
     * @param  {String} direction 'next' or 'prev'.
     */
    skip(direction) {
      Howler.unload();
      // Get the next track based on the direction of the track.
      const nextIndexFn = (idx) => {
        const l = this.playlist.length;
        const random_mode = this._loop_mode === 2 || direction === 'random';

        let rdx = idx;

        if (random_mode) {
          if (this._random_playlist.length / 2 !== l) {
            // construction random playlist
            const a = Array.from({ length: l }, (_v, i) => i);
            for (let i = 0; i < l; i += 1) {
              const e = l - i - 1;
              const s = Math.floor(Math.random() * e);
              const t = a[s];
              a[s] = a[e];
              a[e] = t;
              // lookup table
              a[t + l] = e;
            }
            this._random_playlist = a;
          }
          rdx = this._random_playlist[idx + l];
        } else if (this._random_playlist.length !== 0) {
          // clear random playlist
          this._random_playlist = [];
        }

        if (direction === 'prev') {
          if (rdx === 0) rdx = l;
          rdx -= 1;
        } else {
          rdx += 1;
        }
        return random_mode ? this._random_playlist[rdx % l] : rdx % l;
      };
      this.index = nextIndexFn(this.index);

      let tryCount = 0;
      while (tryCount < this.playlist.length) {
        if (!this.playlist[this.index].disabled) {
          this.play(this.index);
          return;
        }
        this.index = nextIndexFn(this.index);
        tryCount += 1;
      }
      playerSendMessage(this.mode, {
        type: 'BG_PLAYER:RETRIEVE_URL_FAIL_ALL',
      });
      this.sendLoadEvent();
    }

    set loop_mode(input) {
      const LOOP_MODE = {
        all: 0,
        one: 1,
        shuffle: 2,
      };
      let myMode = 0;
      if (typeof input === 'string') {
        myMode = LOOP_MODE[input];
      } else {
        myMode = input;
      }
      if (!Object.values(LOOP_MODE).includes(myMode)) {
        return;
      }
      this._loop_mode = myMode;
    }

    get loop_mode() {
      return this._loop_mode;
    }

    /**
     * Set the volume and update the volume slider display.
     * @param  {Number} val Volume between 0 and 1.
     */
    set volume(val) {
      // Update the global volume (affecting all Howls).
      if (typeof val === 'number') {
        Howler.volume(val);
        this.sendVolumeEvent();
        this.sendFrameUpdate();
      }
    }

    // eslint-disable-next-line class-methods-use-this
    get volume() {
      return Howler.volume();
    }

    adjustVolume(inc) {
      this.volume = inc
        ? Math.min(this.volume + 0.1, 1)
        : Math.max(this.volume - 0.1, 0);
      this.sendVolumeEvent();
      this.sendFrameUpdate();
    }

    mute() {
      Howler.mute(true);
      playerSendMessage(this.mode, {
        type: 'BG_PLAYER:MUTE',
        data: true,
      });
    }

    unmute() {
      Howler.mute(false);
      playerSendMessage(this.mode, {
        type: 'BG_PLAYER:MUTE',
        data: false,
      });
    }

    /**
     * Seek to a new position in the currently playing track.
     * @param  {Number} per Percentage through the song to skip.
     */
    seek(per) {
      if (!this.currentHowl) return;

      // Get the Howl we want to manipulate.
      const audio = this.currentHowl;

      // Convert the percent into a seek position.
      // if (audio.playing()) {
      // }
      audio.seek(audio.duration() * per);
    }
    /**
     * Seek to a new position in the currently playing track.
     * @param {Number} seconds Seconds through the song to skip.
     */

    seekTime(seconds) {
      if (!this.currentHowl) return;
      const audio = this.currentHowl;
      audio.seek(seconds);
    }

    /**
     * Format the time from seconds to M:SS.
     * @param  {Number} secs Seconds to format.
     * @return {String}      Formatted time.
     */
    static formatTime(secs) {
      const minutes = Math.floor(secs / 60) || 0;
      const seconds = secs - minutes * 60 || 0;

      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    setMediaURI(uri, url) {
      if (url) {
        this._media_uri_list[url] = uri;
      }
    }

    setAudioDisabled(disabled, idx) {
      if (this.playlist[idx]) {
        this.playlist[idx].disabled = disabled;
      }
    }

    async sendFrameUpdate() {
      const data = {
        id: this.currentAudio ? this.currentAudio.id : 0,
        duration: this.currentHowl ? this.currentHowl.duration() : 0,
        pos: this.currentHowl ? this.currentHowl.seek() : 0,
        playedFrom: this.playedFrom,
        playing: this.playing,
      };
      if ('setPositionState' in navigator.mediaSession) {
        navigator.mediaSession.setPositionState({
          duration: this.currentHowl ? this.currentHowl.duration() : 0,
          playbackRate: this.currentHowl ? this.currentHowl.rate() : 1,
          position: this.currentHowl ? this.currentHowl.seek() : 0,
        });
      }

      playerSendMessage(this.mode, {
        type: 'BG_PLAYER:FRAME_UPDATE',
        data,
      });
    }

    async sendPlayingEvent(reason = 'UNKNOWN') {
      playerSendMessage(this.mode, {
        type: 'BG_PLAYER:PLAY_STATE',
        data: {
          isPlaying: this.playing,
          reason,
        },
      });
    }

    async sendLoadEvent() {
      playerSendMessage(this.mode, {
        type: 'BG_PLAYER:LOAD',
        data: {
          ...this.currentAudio,
          howl: undefined,
        },
      });
    }

    async sendVolumeEvent() {
      playerSendMessage(this.mode, {
        type: 'BG_PLAYER:VOLUME',
        data: this.volume * 100,
      });
    }

    async sendPlaylistEvent() {
      playerSendMessage(this.mode, {
        type: 'BG_PLAYER:PLAYLIST',
        data: this.playlist.map((audio) => ({ ...audio, howl: undefined })),
      });
    }
  }

  // Setup our new audio player class and pass it the playlist.

  const threadPlayer = new Player();
  threadPlayer.setRefreshRate();
  window.threadPlayer = threadPlayer;

  if ('mediaSession' in navigator) {
    const { mediaSession } = navigator;
    mediaSession.setActionHandler('play', () => {
      threadPlayer.play();
    });
    mediaSession.setActionHandler('pause', () => {
      threadPlayer.pause();
    });
    mediaSession.setActionHandler('seekforward', (details) => {
      // User clicked "Seek Forward" media notification icon.
      const { currentHowl } = threadPlayer;
      const skipTime = details.seekOffset || threadPlayer.skipTime;
      const newTime = Math.min(
        currentHowl.seek() + skipTime,
        currentHowl.duration()
      );
      threadPlayer.seekTime(newTime);
      threadPlayer.sendFrameUpdate();
    });
    mediaSession.setActionHandler('seekbackward', (details) => {
      // User clicked "Seek Backward" media notification icon.
      const { currentHowl } = threadPlayer;
      const skipTime = details.seekOffset || threadPlayer.skipTime;
      const newTime = Math.max(currentHowl.seek() - skipTime, 0);
      threadPlayer.seekTime(newTime);
      threadPlayer.sendFrameUpdate();
    });
    mediaSession.setActionHandler('seekto', (details) => {
      const { seekTime } = details;
      threadPlayer.seekTime(seekTime);
      threadPlayer.sendFrameUpdate();
    });
    mediaSession.setActionHandler('nexttrack', () => {
      threadPlayer.skip('next');
      threadPlayer.sendFrameUpdate();
    });
    mediaSession.setActionHandler('previoustrack', () => {
      threadPlayer.skip('prev');
      threadPlayer.sendFrameUpdate();
    });
  }
  playerSendMessage(this.mode, {
    type: 'BG_PLAYER:READY',
  });
}
