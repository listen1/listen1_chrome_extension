import { threadPlayer } from './src/services/player_thread';

declare global {
  type Mode = 'background' | 'front';
  interface Window {
    threadPlayer: typeof threadPlayer;
  }
}
