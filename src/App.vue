<template>
  <Home />
</template>

<script setup>
import { onMounted, watch } from 'vue';
import whiteStyle from './assets/css/iparanoid.css';
import blackStyle from './assets/css/origin.css';
import useSettings, { migrateSettings } from './composition/settings';

import Home from './views/Home.vue';
import iDB, { dbMigrate } from './services/DBService';
import { PlayerEventListener } from './composition/player';
import { l1Player } from './services/l1_player';
import { initMediaSession, MediaSessionEventListener } from './services/media_session';

if (!localStorage.getItem('V3_MIGRATED')) {
  migrateSettings();
  dbMigrate();
}

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

const initPlayer = async () => {
  l1Player.addEventListener(new PlayerEventListener());
  if ('mediaSession' in navigator) {
    l1Player.addEventListener(new MediaSessionEventListener());
  }

  // load local storage settings
  const currentPlaylist = await iDB.Playlists.get({ id: 'current' });
  const localCurrentPlaying = await iDB.Tracks.where('playlist').equals('current').toArray();
  const tracks = currentPlaylist.order.map((id) => localCurrentPlaying.find((track) => track.id == id));
  const dbSettings = await iDB.Settings.where('key').equals('playerSettings').toArray();

  tracks.forEach((i) => {
    i.disabled = false;
  });

  l1Player.addTracks(tracks);


  let playerSettings = {};
  if (dbSettings.length > 0) {
    playerSettings = dbSettings[0].value;
  } else {
    playerSettings = settings.playerSettings;
  }

  l1Player.setLoopMode(playerSettings.playmode);
  l1Player.setVolume(playerSettings.volume / 100);
  if (playerSettings.nowplaying_track_id !== undefined) {
    l1Player.loadById(playerSettings.nowplaying_track_id);
  }
};

onMounted(async () => {
  initMediaSession();
  await initPlayer();
  // TODO: diagnose slow loadSetting function
  await loadSettings();
  applyThemeCSS();
});
watch(settings, applyThemeCSS);
</script>
