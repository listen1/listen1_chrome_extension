<template>
  <div class="footer flex flex-wrap gap-y-4 relative z-20 border-t border-default">
    <div class="flex flex-none justify-center gap-4 items-center w-screen md:w-80 h-24 text-4xl">
      <span class="li-previous text-prevnext cursor-pointer" @click="prevTrack()" />
      <span class="li-play play text-play hover:text-play-hover cursor-pointer" :class="isPlaying ? 'li-pause' : 'li-play'" @click="playPauseToggle()" />
      <span class="li-next text-prevnext cursor-pointer" @click="nextTrack()" />
    </div>
    <div class="main-info w-screen md:flex-1 flex overflow-hidden bg-footer-main z-30">
      <div v-if="playlist.length == 0" class="logo-banner text-center flex-1 flex items-center h-20 w-20">
        <svg
          class="logo h-12 w-12"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="#666666"
          stroke="#666666"
          stroke-width="1"
          stroke-linecap="round"
          stroke-linejoin="round">
          <polygon points="7 4 7 19 16 19 16 16 10 16 10 4" />
          <polygon points="13 4 13 13 16 13 16 4" />
        </svg>
      </div>
      <div v-if="playlist.length > 0" class="cover flex-none cursor-pointer h-24 w-24 relative group" @click="toggleNowPlaying()">
        <img class="object-cover h-24 w-24" :src="currentPlaying?.img_url" @error="showImage($event, coverImg)" />
        <div class="mask items-center justify-center absolute inset-0 hidden group-hover:bg-black group-hover:bg-opacity-60 group-hover:flex">
          <vue-feather type="chevrons-up" stroke="#cccccc" />
        </div>
      </div>
      <div v-if="playlist.length > 0" class="detail flex-1 relative overflow-hidden">
        <div class="ctrl absolute top-2 right-2">
          <vue-feather
            class="opacity-50 hover:opacity-100 cursor-pointer"
            type="heart"
            :fill="isRedHearted ? 'red' : 'transparent'"
            :stroke="isRedHearted ? 'red' : 'white'"
            size="1rem"
            @click="setRedHeart(toRaw(currentPlaying), !isRedHearted)" />
          <a :title="t('_ADD_TO_PLAYLIST')" @click="showModal('AddToPlaylist', { tracks: [currentPlaying] })">
            <span class="icon opacity-50 hover:opacity-100 li-songlist ml-3" />
          </a>
          <a class="mx-2 opacity-50 hover:opacity-100 text-lg ml-3" @click="changePlaymode()">
            <span v-show="playmode == 0" class="icon li-loop" />
            <span v-show="playmode == 1" class="icon li-single-cycle" />
            <span v-show="playmode == 2" class="icon li-random-loop" />
          </a>
        </div>

        <div class="title text-center truncate flex items-end justify-center text-xl my-2">
          <span v-if="currentPlaying?.source === 'xiami'" style="color: orange; font-size: medium">⚠️</span>
          {{ currentPlaying?.title }}
        </div>
        <div class="more-info text-sm flex text-subtitle px-3 my-2">
          <div class="current">{{ formatTime(currentPosition) }}</div>
          <div class="singer flex-1 tuncate text-center">
            <a class="cursor-pointer" @click="showPlaylist(currentPlaying?.artist_id)">{{ currentPlaying?.artist }}</a>
            -
            <a class="cursor-pointer" @click="showPlaylist(currentPlaying?.album_id)">{{ currentPlaying?.album }}</a>
          </div>
          <div class="total">{{ formatTime(currentDuration) }}</div>
        </div>
        <div class="playbar mx-3">
          <draggable-bar
            id="progressbar"
            btn-class="bg-draggable-bar-button"
            :progress="myProgress"
            @commit-progress="commitProgress"
            @update-progress="updateProgress"></draggable-bar>
        </div>
      </div>
    </div>
    <div class="right-control flex flex-none items-center w-screen md:w-80 h-24">
      <div class="playlist-toggle cursor-pointer ml-8">
        <span class="icon li-list" @click="togglePlaylist()" />
      </div>
      <Volumebar></Volumebar>
      <div v-if="isElectron()" class="lyric-toggle cursor-pointer mx-6">
        <div class="lyric-icon" :class="{ selected: settings.enableLyricFloatingWindow }" @click="toggleLyricFloatingWindow()">词</div>
      </div>
      <div v-if="!isElectron()" class="mx-6"></div>
    </div>
    <PlayerbarPopup :hidden="menuHidden" @close="togglePlaylist()"></PlayerbarPopup>
  </div>
</template>
<script setup lang="ts">
import { inject, toRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import DraggableBar from '../components/DraggableBar.vue';
import PlayerbarPopup from '../components/PlayerbarPopup.vue';
import Volumebar from '../components/Volumebar.vue';
import useOverlay from '../composition/overlay';
import usePlayer from '../composition/player';
import useRedHeart from '../composition/redheart';
import useSettings from '../composition/settings';
import { l1Player } from '../services/l1_player';
import { formatTime, isElectron } from '../utils';
import coverImg from '../images/mycover.jpg';

const { t } = useI18n();
const { player } = usePlayer();
const router = useRouter();
const showModal = inject<any>('showModal');
const { settings, setSettings } = useSettings();

let { overlay, setOverlayType } = useOverlay();
let menuHidden = $ref(true);
let playmode = $computed(() => player.playmode);

const changePlaymode = () => {
  const playmodeCount = 3;
  const newPlaymode = (playmode + 1) % playmodeCount;
  player.playmode = newPlaymode;
  l1Player.setLoopMode(newPlaymode);
};

const showPlaylist = (playlistId?: string) => {
  router.push(`/playlist/${playlistId}`);
};
const playPauseToggle = () => {
  l1Player.togglePlayPause();
};
const prevTrack = () => {
  l1Player.prev();
};
const nextTrack = () => {
  l1Player.next();
};
const toggleNowPlaying = () => {
  if (overlay.type != 'track') {
    setOverlayType('track');
  } else {
    setOverlayType('');
  }
};

const togglePlaylist = () => {
  menuHidden = !menuHidden;
};

const updateProgress = (progress: number) => {
  player.changingProgress = true;
  player.currentPosition = currentDuration * progress;
};

const commitProgress = (progress: number) => {
  l1Player.seek(progress);
  player.changingProgress = false;
  player.currentPosition = currentDuration * progress;
  player.myProgress = progress * 100;
  // reset lryic array last search position
  player._lyricArrayIndex = -1;
};

function getCSSStringFromSetting(setting: { backgroundAlpha: number; fontSize: number; color: string }) {
  let { backgroundAlpha } = setting;
  if (backgroundAlpha === 0) {
    // NOTE: background alpha 0 results total transparent
    // which will cause mouse leave event not trigger
    // correct in windows platform for lyic window if disable
    // hardware accelerate
    backgroundAlpha = 0.01;
  }
  return `div.content.lyric-content{
      font-size: ${setting.fontSize}px;
      color: ${setting.color};
      background: rgba(36, 36, 36, ${backgroundAlpha});
    }
    div.content.lyric-content span.contentTrans {
      font-size: ${setting.fontSize - 4}px;
    }
    `;
}

const toggleLyricFloatingWindow = () => {
  let message = '';
  if (settings.enableLyricFloatingWindow === true) {
    message = 'disable_lyric_floating_window';
  } else {
    message = 'enable_lyric_floating_window';
  }
  setSettings({ enableLyricFloatingWindow: !settings.enableLyricFloatingWindow });

  window.api?.sendControl(message, getCSSStringFromSetting(settings.floatWindowSetting));
};

const showImage = (e?: any, url?: string) => {
  if (e?.target) {
    e.target.src = url;
  }
};

const { isRedHeart, setRedHeart } = useRedHeart();
let playlist = $computed(() => player.playlist.value);
let isPlaying = $computed(() => player.isPlaying);
let myProgress = $computed(() => player.myProgress);
let currentDuration = $computed(() => player.currentDuration);
let currentPosition = $computed(() => player.currentPosition);
let currentPlaying = $computed(() => player.currentPlaying);
let isRedHearted = $computed(() => isRedHeart(currentPlaying?.id));

if (isElectron()) {
  window.api?.onLyricWindow((arg: string) => {
    if (arg === 'float_window_close') {
      return toggleLyricFloatingWindow();
    }
    const { floatWindowSetting } = settings;
    if (arg === 'float_window_font_small' || arg === 'float_window_font_large') {
      const MIN_FONT_SIZE = 12;
      const MAX_FONT_SIZE = 50;
      const offset = arg === 'float_window_font_small' ? -1 : 1;
      floatWindowSetting.fontSize += offset;
      if (floatWindowSetting.fontSize < MIN_FONT_SIZE) {
        floatWindowSetting.fontSize = MIN_FONT_SIZE;
      } else if (floatWindowSetting.fontSize > MAX_FONT_SIZE) {
        floatWindowSetting.fontSize = MAX_FONT_SIZE;
      }
    } else if (arg === 'float_window_background_light' || arg === 'float_window_background_dark') {
      const MIN_BACKGROUND_ALPHA = 0;
      const MAX_BACKGROUND_ALPHA = 1;
      const offset = arg === 'float_window_background_light' ? -0.1 : 0.1;
      floatWindowSetting.backgroundAlpha += offset;
      if (floatWindowSetting.backgroundAlpha < MIN_BACKGROUND_ALPHA) {
        floatWindowSetting.backgroundAlpha = MIN_BACKGROUND_ALPHA;
      } else if (floatWindowSetting.backgroundAlpha > MAX_BACKGROUND_ALPHA) {
        floatWindowSetting.backgroundAlpha = MAX_BACKGROUND_ALPHA;
      }
    } else if (arg === 'float_window_font_change_color') {
      const floatWindowlyricColors = ['#ffffff', '#65d29f', '#3c87eb', '#ec63af', '#4f5455', '#eb605b'];
      const currentIndex = floatWindowlyricColors.indexOf(floatWindowSetting.color);
      const nextIndex = (currentIndex + 1) % floatWindowlyricColors.length;
      floatWindowSetting.color = floatWindowlyricColors[nextIndex];
    }
    // IMPORTANT: must clone to new object when save setting
    setSettings({ floatWindowSetting: { ...floatWindowSetting } });

    const message = 'update_lyric_floating_window_css';
    window.api?.sendControl(message, getCSSStringFromSetting(floatWindowSetting));
  });
}
</script>
<style>
.footer .main-info .logo-banner svg.logo {
  fill: #666666;
  stroke: #666666;
  margin: 0 auto;
}

.footer .main-info .detail .playbar .barbg .cur .btn {
  height: 8px;
  width: 2px;
  right: -2px;
  top: -5px;
}

.footer .main-info .detail .playbar .playbar-clickable:hover .barbg .cur .btn {
  width: 10px;
  height: 10px;
  border-radius: 5px;
  top: -3px;
}

.footer .menu ul.menu-list li {
  background: var(--footer-menu-odd-background-color);
}

.footer .menu ul.menu-list li.even {
  background: var(--footer-menu-even-background-color);
}

.footer .menu ul.menu-list li:hover {
  background: var(--footer-menu-hover-background-color);
}

.footer .menu ul.menu-list li.playing {
  color: var(--important-color);
}

.footer .right-control .playlist-toggle .icon {
  color: var(--player-right-icon-color);
}

.footer .right-control .playlist-toggle .icon:hover {
  color: var(--player-right-icon-hover-color);
}

.footer .right-control .lyric-toggle .lyric-icon,
.footer .right-control .lyric-toggle .lyric-icon.selected:hover {
  border: solid 1px #7f7f7f;
  height: 16px;
  line-height: 16px;
  font-size: 14px;
  color: #7f7f7f;
  background-color: var(--lyric-icon-background-color);
  user-select: none;
}

.footer .right-control .lyric-toggle .lyric-icon.selected {
  border: solid 1px #7f7f7f;
  background-color: #7f7f7f;
  color: #fff;
}
</style>
