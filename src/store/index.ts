import { createStore } from 'vuex';
import search from './modules/search';
import player from './modules/player';
import settings from './modules/settings';

export default createStore({
  modules: {
    search,
    player,
    settings
  }
});
