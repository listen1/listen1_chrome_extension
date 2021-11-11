<template>
  <Home />
</template>


<script setup>
import { onMounted, watch } from 'vue';
import whiteStyle from './assets/css/iparanoid.css';
import blackStyle from './assets/css/origin.css';
import usePlayer from './composition/player';
import useSettings from './composition/settings';
import { addPlayerListener, getPlayer } from './services/bridge';
import Home from './views/Home.vue';
const mode = 'front';
const { player, playerListener, initState } = usePlayer();
getPlayer(mode)?.setMode(mode);
// if (mode === 'front') {
//   if (!isElectron()) {
//     // avoid background keep playing when change to front mode
//     getPlayerAsync('background', (player) => {
//       player.pause();
//     });
//   }
// }
addPlayerListener(mode, (msg, sender, sendResponse) => {
  playerListener(mode, msg, sender, sendResponse);
});
// initial vuex states
initState();
const { settings, loadSettings } = useSettings();

function applyThemeCSS() {
  let cssStyle = '';
  if (settings.theme == 'white') {
    cssStyle = whiteStyle;
  } else if (settings.theme == 'black') {
    cssStyle = blackStyle;
  }
  window.api?.setTheme(settings.theme);
  document.getElementById('theme').textContent = cssStyle;
}
onMounted(async () => {
  await loadSettings();
  applyThemeCSS();
});
watch(settings, applyThemeCSS);
</script>