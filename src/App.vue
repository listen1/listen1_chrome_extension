<template>
  <Home />
</template>


<script setup>
import Home from '@/views/Home';
import { useStore } from 'vuex';
import { getPlayer, addPlayerListener } from '@/services/bridge';
const mode = 'front';
const store = useStore();
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
  store.dispatch('player/playerListener', { mode, msg, sender, sendResponse });
});
// initial vuex states
store.dispatch('player/initState');
store.dispatch('settings/initState');
</script>