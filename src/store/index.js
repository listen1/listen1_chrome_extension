import { createStore } from 'vuex';
import player from './modules/player';

export default createStore({
  modules: {
    player
  }
});
