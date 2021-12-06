/* eslint-disable @typescript-eslint/no-unused-vars */
import MediaService from './MediaService';
import { arrayMove } from '../utils';

interface Track {
  id: string;
  album: string;
  album_id: string;
  artist: string;
  artist_id: string;
  img_url: string;
  options?: string;
  source: string;
  source_url: string;
  title: string;
  disabled?: boolean;
}

interface Sound {
  url: string;
  bitrate: string;
  platform: string;
}

type StringDict = { [key: string]: unknown };

interface PlayerListener {
  onEvent: (name: string, params: StringDict) => void;
}

enum PlayerLoopMode {
  LOOP_ALL = 0,
  LOOP_ONE = 1,
  SHUFFLE = 2
}

/* Randomize array in-place using Durstenfeld shuffle algorithm */
function shuffle(array: number[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

function range(n: number): number[] {
  return [...Array(n).keys()];
}

function posMod(m: number, n: number) {
  return ((m % n) + n) % n;
}

/*
l1PlayerProto
Wrap html audio element to provide playlist management.

Usage:
```
const l1Player = l1PlayerProto();
class PlayerEventListener {
  async onEvent(name: string, params: any) {
    if(name === 'playing'){
      // support all audio element event
    } else if (name === 'timeupdate') {
      // support all audio element event
    } else if (name === 'custom:playlist'){
      // use custom prefix to indicate custom event
    }
  }
}
const listener = {}
l1Player.addEventListener([new PlayerEventListener()]);
l1Player.playTracks([track]);
```
*/
class l1PlayerProto {
  playlist = <Track[]>[];
  muted = false;
  volume = 1; // 0-1
  loopMode = PlayerLoopMode.LOOP_ALL;
  playing: Track | null = null;
  // NOTICE: isPlaying indicate whether playing task is started
  // NOT indicate whether audio file is playing
  isPlaying = false;
  _audio: HTMLAudioElement;
  _eventListenerArray = <PlayerListener[]>[];
  _shuffleArray: number[] = [];

  constructor() {
    this._audio = new window.Audio();
    this._audio.volume = this.volume;
    this._audio.controls = false;
    this._audio.autoplay = true;
    this._audio.preload = 'auto';
    this._audio.muted = this.muted;
    const allowEventArray = ['playing', 'timeupdate', 'pause', 'ended'];
    allowEventArray.forEach((name) =>
      this._audio.addEventListener(name, () => {
        const params: StringDict = {};
        if (name === 'timeupdate') {
          params['duration'] = this._audio.duration;
          params['position'] = this._audio.currentTime;
        } else if (name === 'ended') {
          if (this.loopMode === PlayerLoopMode.LOOP_ONE) {
            return;
          }
          this._next(0);
        }
        return this._emit(name, params);
      })
    );
  }
  addEventListener(eventLisnter: PlayerListener) {
    this._eventListenerArray.push(eventLisnter);
  }
  play() {
    this._emit('custom:playlist_playing', {});
    this.isPlaying = true;
    this._audio.play();
  }
  pause() {
    this._emit('custom:playlist_pause', {});
    this.isPlaying = false;

    this._audio.pause();
  }
  prev() {
    this._emit('custom:playlist_playing', {});
    this.isPlaying = true;
    this._prev(0);
  }
  next() {
    this._emit('custom:playlist_playing', {});
    this.isPlaying = true;
    this._next(0);
  }
  _emit(name: string, params: StringDict) {
    return this._eventListenerArray.forEach((listener) => listener.onEvent(name, params));
  }
  togglePlayPause() {
    this.isPlaying = !this.isPlaying;

    if (this.isPlaying) {
      if (this._audio.src === '' && this.playing) {
        // first time play when loaded
        this.playById(this.playing.id);
      } else {
        this.play();
      }
    } else {
      this.pause();
    }
  }
  async playById(id: string) {
    this._emit('custom:playlist_playing', {});
    this.isPlaying = true;
    const track = this.playlist.find((t) => t.id === id);
    await this._play(track);
  }
  async _play(track?: Track, playDirection = 1, tryCount = 1) {
    this._audio.pause();
    // raw play method, internal usage only
    if (!track) {
      return;
    }
    if (tryCount > this.playlist.length) {
      this._emit('custom:playlist_not_playable', {});
      this.pause();
      return;
    }
    if (!this.isPlaying) {
      return;
    }

    this.playing = track;
    this._emit('custom:nowplaying', { track: this.playing });

    if (track.disabled) {
      if (playDirection === -1) {
        this._prev(tryCount + 1);
      } else {
        this._next(tryCount + 1);
      }
      return;
    }
    const result: unknown = await MediaService.bootstrapTrackAsync(track).catch(async () => {
      this._emit('custom:track_not_playable', { track });

      track.disabled = true;
      await new Promise((r) => setTimeout(r, 2000));
      if (playDirection === -1) {
        this._prev(tryCount + 1);
      } else {
        this._next(tryCount + 1);
      }
    });

    if (!result) {
      return;
    }
    const sound: Sound = <Sound>result;

    this._audio.src = sound.url;
    this._emit('custom:nowplaying_loaded', { track, url: sound.url, bitrate: sound.bitrate, platform: sound.platform });
    // Resets the media to the beginning and selects the best available source
    // from the sources provided using the src attribute or the <source> element.
    this._audio.load(); //suspends and restores all audio element
  }
  loadById(id: string) {
    const track = this.playlist.find((t) => t.id === id);
    if (track === undefined) {
      return;
    }
    this.playing = track;
    this._emit('custom:nowplaying', { track: this.playing });
  }
  seek(percent: number) {
    if (!this._audio.src) {
      return;
    }
    if (percent < 0 || percent > 1) {
      throw Error('seek range not in 0 and 1');
    }
    const time = this._audio.duration * percent;
    this._audio.currentTime = time;
  }
  getPosition(): number {
    return this._audio.currentTime;
  }
  getDuration(): number {
    return this._audio.duration;
  }
  _prev(tryCount: number) {
    if (this.playlist.length === 0) {
      return;
    }
    const index = this.playlist.findIndex((t) => t.id === this.playing?.id);
    let prevIndex = posMod(index - 1, this.playlist.length);
    if (this.loopMode === PlayerLoopMode.SHUFFLE) {
      const shuffleIndex = this._shuffleArray.findIndex((i) => i === index);
      prevIndex = this._shuffleArray[posMod(shuffleIndex - 1, this._shuffleArray.length)];
    }
    this._play(this.playlist[prevIndex], -1, tryCount);
  }
  _next(tryCount: number) {
    if (this.playlist.length === 0) {
      return;
    }
    const index = this.playlist.findIndex((t) => t.id === this.playing?.id);

    let nextIndex = posMod(index + 1, this.playlist.length);
    if (this.loopMode === PlayerLoopMode.SHUFFLE) {
      const shuffleIndex = this._shuffleArray.findIndex((i) => i === index);
      nextIndex = this._shuffleArray[posMod(shuffleIndex + 1, this._shuffleArray.length)];
    }
    this._play(this.playlist[nextIndex], 1, tryCount);
  }
  _reshuffleIfNeeded() {
    if (this.loopMode !== PlayerLoopMode.SHUFFLE) {
      return;
    }
    if (this.playlist.length === 0) {
      return;
    }
    const newShuffleArray = range(this.playlist.length);
    shuffle(newShuffleArray);
    this._shuffleArray = newShuffleArray;
  }

  setLoopMode(modeNumber: PlayerLoopMode) {
    this.loopMode = modeNumber;
    if (this.loopMode === PlayerLoopMode.LOOP_ONE) {
      this._audio.loop = true;
    } else {
      this._audio.loop = false;
    }
    this._reshuffleIfNeeded();
    this._emit('custom:loopmode', { loopmode: this.loopMode });
  }
  mute() {
    this._audio.muted = true;
  }
  unmute() {
    this._audio.muted = false;
  }
  toggleMute() {
    this._audio.muted = !this._audio.muted;
  }
  setVolume(percent: number) {
    this.volume = percent;
    this._audio.volume = percent;
    this._emit('custom:volume', { volume: this.volume });
  }
  addTrack(track: Track) {
    if (this.playlist.findIndex((t) => t.id === track.id) > -1) {
      return;
    }
    this.playlist.push(track);
    this._emit('custom:playlist', { playlist: this.playlist });
    this._reshuffleIfNeeded();
  }
  insertTrack(track: Track, to_track: Track, direction: string) {
    const index = this.playlist.findIndex((i) => i.id === track.id);
    let insertIndex = this.playlist.findIndex((i) => i.id === to_track.id);
    if (index === insertIndex) {
      return;
    }
    if (insertIndex > index) {
      insertIndex -= 1;
    }
    const offset = direction === 'top' ? 0 : 1;
    arrayMove(this.playlist, index, insertIndex + offset);
    this._emit('custom:playlist', { playlist: this.playlist });
  }
  removeTrack(track: Track) {
    this.playlist = this.playlist.filter((tr) => tr.id != track.id);
    this._emit('custom:playlist', { playlist: this.playlist });
  }
  addTracks(tracks: Track[]) {
    const existsTrackIds: { [key: string]: number } = {};
    this.playlist.forEach((tr) => {
      existsTrackIds[tr.id] = 1;
    });
    tracks.forEach((tr) => {
      if (existsTrackIds[tr.id] === 1) {
        return;
      }
      this.playlist.push(tr);
    });
    this._emit('custom:playlist', { playlist: this.playlist });
    this._reshuffleIfNeeded();
  }
  clearPlaylist() {
    this._audio.pause();
    this.playlist = [];
    this._emit('custom:playlist', { playlist: this.playlist });
    this._reshuffleIfNeeded();

    this.playing = null;
    this._emit('custom:nowplaying', { track: this.playing });
  }
  playTracks(tracks: Track[]) {
    if (tracks.length === 0) {
      return;
    }
    this._emit('custom:playlist_playing', {});
    this.isPlaying = true;

    this.playlist = tracks;
    this._emit('custom:playlist', { playlist: this.playlist });
    this._reshuffleIfNeeded();
    let firstIndex = 0;
    if (this.loopMode === PlayerLoopMode.SHUFFLE) {
      firstIndex = this._shuffleArray[0];
    }
    this._play(tracks[firstIndex]);
  }
}

export const l1Player = new l1PlayerProto();
