<template>
  <Home />
</template>


<script setup>
import Home from './views/Home.vue';
import { onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { getPlayer, addPlayerListener } from './services/bridge';
import useSettings from './composition/settings';
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
const { settings, loadSettings } = useSettings();

import whiteStyle from './assets/css/iparanoid.css';
import blackStyle from './assets/css/origin.css';
function applyThemeCSS() {
  let cssStyle = '';
  if (settings.theme == 'white') {
    cssStyle = whiteStyle;
  } else if (settings.theme == 'black') {
    cssStyle = blackStyle;
  }
  document.getElementById('theme').textContent = cssStyle;
}
onMounted(() => {
  loadSettings();
  applyThemeCSS();
});
watch(settings, applyThemeCSS);
</script>