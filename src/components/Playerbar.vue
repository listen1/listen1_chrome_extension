<template>
  <div class="footer flex relative z-20 h-20 border-t border-default">
    <div class="flex flex-none items-center w-80">
      <span class="icon text-2xl ml-12 li-previous text-prevnext" @click="prevTrack()" />
      <span
        class="icon text-2xl ml-6 mr-4 li-play play text-play hover:text-play-hover"
        :class="isPlaying ? 'li-pause' : 'li-play'"
        @click="playPauseToggle()" />
      <span class="icon text-2xl mr-4 li-next text-prevnext" @click="nextTrack()" />
    </div>
    <div class="main-info flex flex-1 overflow-hidden bg-footer-main z-30">
      <div v-if="playlist.length == 0" class="logo-banner text-center flex-1 flex items-center h-16 w-16">
        <svg
          class="logo"
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
      <div v-if="playlist.length > 0" class="cover flex-none cursor-pointer h-20 w-20 relative group" @click="toggleNowPlaying()">
        <img class="object-cover h-20 w-20" :src="currentPlaying.img_url" @error="showImage($event, 'images/mycover.jpg')" />
        <div class="mask hidden group-hover:bg-black group-hover:bg-opacity-60">
          <vue-feather type="chevrons-up" />
        </div>
      </div>
      <div v-if="playlist.length > 0" class="detail flex-1 relative overflow-hidden">
        <div class="ctrl absolute top-1 right-1">
          <vue-feather
            class="icon opacity-50 hover:opacity-100 cursor-pointer"
            v-if="!isRedHeart(currentPlaying.id)"
            type="heart"
            size="15"
            stroke-width="1.5"
            @click="setRedHeart(toRaw(currentPlaying), true)" />
          <vue-feather
            class="heart cursor-pointer"
            v-if="isRedHeart(currentPlaying.id)"
            type="heart"
            fill="red"
            stroke="red"
            size="15"
            @click="setRedHeart(toRaw(currentPlaying), false)" />
          <a @click="showModal('AddToPlaylist', { tracks: [currentPlaying] })" :title="t('_ADD_TO_PLAYLIST')">
            <span class="icon opacity-50 hover:opacity-100 li-songlist ml-2" />
          </a>
          <a title @click="changePlaymode()" class="mx-2 opacity-50 hover:opacity-100">
            <span v-show="playmode == 0" class="icon li-loop" />
            <span v-show="playmode == 1" class="icon li-single-cycle" />
            <span v-show="playmode == 2" class="icon li-random-loop" />
          </a>
        </div>

        <div class="title text-center truncate h-8 flex items-end justify-center">
          <span v-if="currentPlaying.source === 'xiami'" style="color: orange; font-size: medium">⚠️</span>
          {{ currentPlaying.title }}
        </div>
        <div class="more-info h-6 text-sm flex text-subtitle px-3">
          <div class="current">{{ formatTime(currentPosition) }}</div>
          <div class="singer flex-1 tuncate text-center">
            <a class="cursor-pointer" @click="showPlaylist(currentPlaying.artist_id)">{{ currentPlaying.artist }}</a>
            -
            <a class="cursor-pointer" @click="showPlaylist(currentPlaying.album_id)">{{ currentPlaying.album }}</a>
          </div>
          <div class="total">{{ formatTime(currentDuration) }}</div>
        </div>
        <div class="playbar mx-3">
          <draggable-bar id="progressbar" :progress="myProgress" @commit-progress="commitProgress" @update-progress="updateProgress"></draggable-bar>
        </div>
      </div>
    </div>
    <div class="right-control flex flex-none items-center w-80">
      <div class="playlist-toggle">
        <span class="icon li-list" @click="togglePlaylist()" />
      </div>
      <div class="volume-ctrl flex items-center" volume-wheel>
        <vue-feather class="icon" :type="volumeIcon" size="18px" @click="toggleMuteStatus()" />
        <div class="m-pbar volume">
          <draggable-bar id="volumebar" :progress="volume * 100" @update-progress="changeVolume" @commit-progress="commitVolume"></draggable-bar>
        </div>
      </div>
      <div v-if="isElectron()" class="lyric-toggle">
        <div @click="toggleLyricFloatingWindow()" class="lyric-icon" :class="{ selected: settings.enableLyricFloatingWindow }">词</div>
      </div>
    </div>
    <div class="menu-modal fixed top-0 right-0 left-0 bg-white bg-opacity-20" :class="{ slideup: !menuHidden }" @click="togglePlaylist()" />
    <div class="menu bg-theme fixed overflow-hidden opacity-0 border-default rounded-sm h-96" :class="{ slideup: !menuHidden }">
      <div class="menu-header">
        <span class="menu-title">{{ t('_TOTAL_SONG_PREFIX') }} {{ playlist.length }} {{ t('_TOTAL_SONG_POSTFIX') }}</span>
        <a class="add-all" @click="showModal('AddToPlaylist', { tracks: playlist })">
          <span class="icon li-songlist" ng-click="togglePlaylist()" />
          <span>{{ t('_ADD_TO_PLAYLIST') }}</span>
        </a>
        <a class="remove-all" @click="clearPlaylist()">
          <span class="icon li-del" ng-click="togglePlaylist()" />
          <span>{{ t('_CLEAR_ALL') }}</span>
        </a>

        <a class="close" @click="togglePlaylist()">
          <vue-feather type="x"></vue-feather>
        </a>
      </div>
      <ul class="menu-list">
        <DragDropZone
          v-for="(song, index) in playlist"
          :id="'song_' + song.id"
          :key="song.id"
          :draggable="true"
          :class="{ playing: currentPlaying.id == song.id, even: index % 2 === 0, odd: index % 2 !== 0 }"
          dragtype="application/listen1-song"
          :dragobject="song"
          :dragtitle="song.title"
          :sortable="true"
          @mouseenter="song.highlight = true"
          @mouseleave="song.highlight = undefined"
          @drop="onCurrentPlayingSongDrop(song, $event)">
          <div class="song-status-icon">
            <vue-feather v-show="currentPlaying.id == song.id" type="play"></vue-feather>
          </div>
          <div class="song-title" :class="song.disabled ? 'disabled' : ''">
            <a @click="playFromPlaylist(song)">
              <span v-if="song.source === 'xiami'" style="color: orange; border-radius: 12px; border: solid 1px; padding: 0 4px">⚠️ 🦐</span>
              {{ song.title }}
            </a>
          </div>
          <div class="song-singer">
            <a
              @click="
                showPlaylist(song.artist_id);
                togglePlaylist();
              ">
              {{ song.artist }}
            </a>
          </div>
          <div class="tools">
            <span v-show="song.highlight" @click="removeTrack(song)" class="icon li-del" />
            <span v-show="song.highlight" @click="openUrl(song.source_url)" class="icon li-link" />
          </div>
          <!-- <div class="song-time">00:00</div> -->
        </DragDropZone>
      </ul>
    </div>
  </div>
</template>
<script setup>
import { inject, toRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import DragDropZone from '../components/DragDropZone.vue';
import DraggableBar from '../components/DraggableBar.vue';
import useOverlay from '../composition/overlay';
import usePlayer from '../composition/player';
import useRedHeart from '../composition/redheart';
import useSettings from '../composition/settings';
import { isElectron } from '../provider/lowebutil';
import { l1Player } from '../services/l1_player';
import { formatTime } from '../utils';

const { t } = useI18n();
const { player } = usePlayer();
const router = useRouter();
const showModal = inject('showModal');
const { settings, setSettings, saveSettingsToDB, getSettingsAsync } = useSettings();

let { overlay, setOverlayType } = useOverlay();
let menuHidden = $ref(true);
let playmode = $computed(() => player.playmode);

const changePlaymode = () => {
  const playmodeCount = 3;
  const newPlaymode = (playmode + 1) % playmodeCount;
  player.playmode = newPlaymode;
  l1Player.setLoopMode(newPlaymode);
};

const showPlaylist = (playlistId) => {
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
const clearPlaylist = () => {
  l1Player.clearPlaylist();
};
const updateProgress = (progress) => {
  player.changingProgress = true;
  player.currentPosition = currentDuration * progress;
};

const commitProgress = (progress) => {
  l1Player.seek(progress);
  player.changingProgress = false;
  player.currentPosition = currentDuration * progress;
  player.myProgress = progress * 100;
  // reset lryic array last search position
  player._lyricArrayIndex = -1;
};

const changeVolume = (progress) => {
  l1Player.setVolume(progress);
  l1Player.unmute();
};
const commitVolume = (progress) => {
  changeVolume(progress);
  // TODO: use settings.playerSettings will get old init value
  // must use getSettings to fetch recent value
  const task = async () => {
    const settings = await getSettingsAsync();
    saveSettingsToDB({ playerSettings: { ...settings.playerSettings, volume: progress * 100 } });
  };
  task();
};
const toggleMuteStatus = () => {
  player.mute = !player.mute;
  l1Player.toggleMute();
};
let volumeIcon = $computed(() => {
  if (player.mute) {
    return 'volume-x';
  } else if (volume > 0.5) {
    return 'volume-2';
  } else if (volume > 0) {
    return 'volume-1';
  } else {
    return 'volume';
  }
});
const playFromPlaylist = (song) => {
  l1Player.playById(song.id);
};
const removeTrack = (track) => {
  l1Player.removeTrack(track);
};
const openUrl = (url) => {
  window.open(url, '_blank')?.focus();
};
const onCurrentPlayingSongDrop = (song, event) => {
  const { data, dragType, direction } = event;
  if (dragType === 'application/listen1-song') {
    // insert song
    l1Player.insertTrack(data, toRaw(song), direction);
  }
};
function getCSSStringFromSetting(setting) {
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

const showImage = (e, url) => {
  e.target.src = url;
};

const { isRedHeart, setRedHeart } = useRedHeart();
let playlist = $computed(() => player.playlist.value);
let isPlaying = $computed(() => player.isPlaying);
let myProgress = $computed(() => player.myProgress);
let currentDuration = $computed(() => player.currentDuration);
let currentPosition = $computed(() => player.currentPosition);
let currentPlaying = $computed(() => player.currentPlaying || {});
let volume = $computed(() => player.volume);

if (isElectron()) {
  window.api?.onLyricWindow((arg) => {
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
.footer .main-info .cover:hover .mask {
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
}
.footer .menu-modal.slideup {
  bottom: 5rem;
}
.footer .menu.slideup {
  bottom: 5rem;
  opacity: 1;
}
</style>
