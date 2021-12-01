import { l1Player } from './l1_player';

const DEFAULT_SKIP_SECOND = 5;

export function initMediaSession() {
  if ('mediaSession' in navigator === false) {
    return;
  }
  const { mediaSession } = navigator;
  mediaSession.setActionHandler('play', () => {
    l1Player.play();
  });
  mediaSession.setActionHandler('pause', () => {
    l1Player.pause();
  });
  mediaSession.setActionHandler('seekforward', (details) => {
    // User clicked "Seek Forward" media notification icon.
    const skipTime = details.seekOffset || DEFAULT_SKIP_SECOND;
    const newTime = Math.min(l1Player.getPosition() + skipTime, l1Player.getDuration());
    l1Player.seek(newTime / l1Player.getDuration());
  });
  mediaSession.setActionHandler('seekbackward', (details) => {
    // User clicked "Seek Backward" media notification icon.
    const skipTime = details.seekOffset || DEFAULT_SKIP_SECOND;
    const newTime = Math.max(l1Player.getPosition() - skipTime, 0);
    l1Player.seek(newTime / l1Player.getDuration());
  });
  mediaSession.setActionHandler('seekto', (details) => {
    const { seekTime } = details;
    l1Player.seek(seekTime / l1Player.getDuration());
  });
  mediaSession.setActionHandler('nexttrack', () => {
    l1Player.next();
  });
  mediaSession.setActionHandler('previoustrack', () => {
    l1Player.prev();
  });
}

export class MediaSessionEventListener {
  async onEvent(name, params) {
    if ('mediaSession' in navigator === false) {
      return;
    }
    const { mediaSession } = navigator;
    if (name === 'playing') {
      mediaSession.playbackState = 'playing';
    } else if (name === 'pause') {
      mediaSession.playbackState = 'paused';
    } else if (name === 'custom:nowplaying') {
      mediaSession.playbackState = 'playing';
      const { track } = params;
      if (!track) {
        return;
      }
      mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: `Listen1  •  ${(track.album || '<???>').padEnd(100)}`,
        artwork: [
          {
            src: track.img_url,
            sizes: '300x300'
          }
        ]
      });
    } else if (name === 'timeupdate') {
      mediaSession.setPositionState?.({
        duration: params.duration || 0,
        playbackRate: 1,
        position: params.position || 0
      });
    }
  }
}
