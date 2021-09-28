import { createStore } from 'vuex';
import player from './modules/player';
import settings from './modules/settings';

export default createStore({
  modules: {
    player,
    settings
  }
});
