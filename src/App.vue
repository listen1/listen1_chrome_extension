<template>
  <Home />
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
// NOTICE: without inline postfix, css will inject into html
// we only use css string here
import gridientStyle from './assets/css/themes/gridient.css?inline';
import infiniteGridStyle from './assets/css/themes/infinite_grid.css?inline';
import whiteStyle from './assets/css/themes/iparanoid.css?inline';
import whiteTransparentStyle from './assets/css/themes/iparanoid_transparent.css?inline';
import blackStyle from './assets/css/themes/origin.css?inline';
import blackTransparentStyle from './assets/css/themes/origin_transparent.css?inline';
import { PlayerEventListener } from './composition/player';
import useRedHeart from './composition/redheart';
import useSettings, { migrateSettings } from './composition/settings';
import iDB, { dbMigrate } from './services/DBService';
import type { Track } from './services/l1_player';
import { l1Player } from './services/l1_player';
import { initMediaSession, MediaSessionEventListener } from './services/media_session';
import { isWin } from './utils';
import Home from './views/Home.vue';

if (!localStorage.getItem('V3_MIGRATED')) {
  migrateSettings();
  dbMigrate();
}

const { settings, loadSettings } = useSettings();

function applyThemeCSS() {
  const mapping = {
    white: whiteStyle,
    black: blackStyle,
    white_transparent: whiteTransparentStyle,
    black_transparent: blackTransparentStyle,
    infinite_grid: infiniteGridStyle,
    gridient: gridientStyle
  };
  const titleBarMapping = {
    white: {
      color: '#ffffff',
      symbolColor: '#72706e'
    },
    black: {
      color: '#333333',
      symbolColor: '#969da5'
    },
    infinite_grid: {
      color: '#ffffff',
      symbolColor: '#72706e'
    },
    gridient: {
      color: '#f6f6f6',
      symbolColor: '#72706e'
    }
  };
  const cssStyle = mapping[settings.theme] || '';
  if (isWin()) {
    window.api.updateTheme(titleBarMapping[settings.theme]);
  }
  (document.getElementById('theme') as HTMLElement).textContent = cssStyle;
}

const initPlayer = async () => {
  l1Player.addEventListener(new PlayerEventListener());
  if ('mediaSession' in navigator) {
    l1Player.addEventListener(new MediaSessionEventListener());
  }

  // load local storage settings
  const currentPlaylist = await iDB.Playlists.get({ id: 'current' });
  const localCurrentPlaying = await iDB.Tracks.where('playlist').equals('current').toArray();
  let tracks: Track[] = [];
  if (currentPlaylist !== undefined) {
    //@ts-ignore not null
    tracks = currentPlaylist.order.map((id) => localCurrentPlaying.find((track) => track.id == id));
  }
  const dbSettings = await iDB.Settings.where('key').equals('playerSettings').toArray();

  tracks.forEach((i) => {
    i.disabled = false;
  });

  l1Player.addTracks(tracks);

  let playerSettings = {} as { playmode: number; volume: number; nowplaying_track_id?: string };
  if (dbSettings.length > 0) {
    playerSettings = dbSettings[0].value as { playmode: number; volume: number };
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

  const { initRedHeart } = useRedHeart();
  await initRedHeart();

  applyThemeCSS();
});
watch(settings, applyThemeCSS);
</script>
