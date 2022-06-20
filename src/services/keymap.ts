import { l1Player } from './l1_player';

const Actions = {
  playPause: () => {
    l1Player.togglePlayPause();
  },
  prev: () => {
    l1Player.prev();
  },
  next: () => {
    l1Player.next();
  },
  volumnUp: () => {
    if (l1Player.volume <= 0.9) {
      l1Player.setVolume(l1Player.volume + 0.1);
    } else {
      l1Player.setVolume(1);
    }
  },
  volumnDown: () => {
    if (l1Player.volume >= 0.1) {
      l1Player.setVolume(l1Player.volume - 0.1);
    } else {
      l1Player.setVolume(0);
    }
  }
};
export const webKeyMap = [
  { name: '_PLAY_OR_PAUSE', handler: Actions.playPause, key: 'p' },
  { name: '_PREVIOUS_TRACK', handler: Actions.prev, key: '[' },
  { name: '_NEXT_TRACK', handler: Actions.next, key: ']' },
  { name: '_VOLUME_UP', handler: Actions.volumnUp, key: 'u' },
  { name: '_VOLUME_DOWN', handler: Actions.volumnDown, key: 'd' }
];

const keyHandler = (ev: KeyboardEvent) => {
  webKeyMap.find(({ key }) => ev.key === key)?.handler();
};
export function initKeymap() {
  document.addEventListener(`keydown`, keyHandler);
}
