<template>
  <Home />
</template>


<script>
import Home from '@/views/Home';
import { getPlayer, addPlayerListener } from '@/services/bridge';
export default {
  components: {
    Home
  },
  created() {
    // const mode = getLocalStorageValue('enable_stop_when_close', true) ? 'front' : 'background';
    const mode = 'front';
    getPlayer(mode).setMode(mode);
    // if (mode === 'front') {
    //   if (!isElectron()) {
    //     // avoid background keep playing when change to front mode
    //     getPlayerAsync('background', (player) => {
    //       player.pause();
    //     });
    //   }
    // }
    addPlayerListener(mode, (msg, sender, sendResponse) => {
      this.$store.dispatch('player/playerListener', { mode, msg, sender, sendResponse });
    });
    // initial vuex states
    this.$store.dispatch('player/initState');
    this.$store.dispatch('settings/initState');
  }
};
</script>