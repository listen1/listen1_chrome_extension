<template>
  <div class="footer">
    <div class="left-control">
      <span class="icon li-previous" @click="prevTrack()" />
      <span
        class="icon li-play play"
        :class="isPlaying ? 'li-pause' : 'li-play'"
        @click="playPauseToggle()"
      />
      <span class="icon li-next" @click="nextTrack()" />
    </div>
    <div class="main-info">
      <div v-if="playlist.length == 0" class="logo-banner">
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
          stroke-linejoin="round"
        >
          <polygon points="7 4 7 19 16 19 16 16 10 16 10 4" />
          <polygon points="13 4 13 13 16 13 16 4" />
        </svg>
      </div>
      <div v-if="playlist.length > 0" class="cover" @click="toggleNowPlaying()">
        <img
          :src="currentPlaying.img_url"
          err-src="https://y.gtimg.cn/mediastyle/global/img/album_300.png"
        />
        <div class="mask">
          <vue-feather type="chevrons-up" />
        </div>
      </div>
      <div v-if="playlist.length > 0" class="detail">
        <div class="ctrl">
          <a @click="showModal('AddToPlaylist', { tracks: [currentPlaying] })" :title="t('_ADD_TO_PLAYLIST')">
                    <span class="icon li-songlist" />
          </a>
          <a title @click="changePlaymode()">
            <span v-show="playmode == 0" class="icon li-loop" />
            <span v-show="playmode == 1" class="icon li-single-cycle" />
            <span v-show="playmode == 2" class="icon li-random-loop" />
          </a>
        </div>

        <div class="title">
          <span
            v-if="currentPlaying.source === 'xiami'"
            style="color: orange; font-size: medium"
          >⚠️</span>
          {{ currentPlaying.title }}
        </div>
        <div class="more-info">
          <div class="current">{{ currentPosition }}</div>
          <div class="singer">
            <a @click="showPlaylist(currentPlaying.artist_id)">{{ currentPlaying.artist }}</a>
            -
            <a
              @click="showPlaylist(currentPlaying.album_id)"
            >{{ currentPlaying.album }}</a>
          </div>
          <div class="total">{{ currentDuration }}</div>
        </div>
        <div class="playbar">
          <draggable-bar
            id="progressbar"
            :progress="myProgress"
            @commit-progress="changeProgress"
          ></draggable-bar>
        </div>
      </div>
    </div>
    <div class="right-control">
      <div class="playlist-toggle">
        <span class="icon li-list" @click="togglePlaylist()" />
      </div>
      <div class="volume-ctrl" volume-wheel>
        <span class="icon" :class="mute ? 'li-mute' : 'li-volume'" @click="toggleMuteStatus()" />
        <div class="m-pbar volume">
          <draggable-bar
            id="volumebar"
            :progress="volume*100"
            @update-progress="changeVolume"
            @commit-progress="commitVolume"
          ></draggable-bar>
        </div>
      </div>
      <div v-if="isElectron()" class="lyric-toggle">
        <div
          @click="toggleLyricFloatingWindow(true)"
          class="lyric-icon"
          :class="{'selected': settings.enableLyricFloatingWindow}"
        >词</div>
      </div>
    </div>
    <div class="menu-modal" :class="{ slideup: !menuHidden }" @click="togglePlaylist()" />
    <div class="menu" :class="{ slideup: !menuHidden }">
      <div class="menu-header">
        <span
          class="menu-title"
        >{{ t('_TOTAL_SONG_PREFIX') }} {{ playlist.length }} {{ t('_TOTAL_SONG_POSTFIX') }}</span>
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
          :id="'song_'+song.id "
          :key="song.id"
          :class="{ playing: currentPlaying.id == song.id ,'even': index % 2 === 0, 'odd': index % 2 !== 0}"
          dragtype="application/listen1-song"
          :dragobject="song"
          :dragtitle="song.title"
          :sortable="true"
          @mouseenter="song.highlight=true"
          @mouseleave="song.highlight=undefined"
          @drop="onCurrentPlayingSongDrop(song, $event)"
        >
          <div class="song-status-icon">
            <vue-feather v-show="currentPlaying.id == song.id" type="play"></vue-feather>
          </div>
          <div class="song-title" :class="song.disabled ? 'disabled' : ''">
            <a @click="playFromPlaylist(song)">
              <span
                v-if="song.source === 'xiami'"
                style="color: orange; border-radius: 12px; border: solid 1px; padding: 0 4px"
              >⚠️ 🦐</span>
              {{ song.title }}
            </a>
          </div>
          <div class="song-singer">
            <a @click="showPlaylist(song.artist_id); togglePlaylist();">{{ song.artist }}</a>
          </div>
          <div class="tools">
            <span
              v-show="song.highlight"
              @click="removeTrack(song)"
              class="icon li-del"
            />
            <span v-show="song.highlight" @click="openUrl(song.source_url)" class="icon li-link" />
        
          </div>
          <!-- <div class="song-time">00:00</div> -->
        </DragDropZone>
      </ul>
    </div>
  </div>
</template>
<script setup>

import { inject,toRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import DraggableBar from '../components/DraggableBar.vue';
import usePlayer from '../composition/player';
import useOverlay from '../composition/overlay';
import { l1Player } from '../services/l1_player';
import { isElectron } from '../provider/lowebutil';
import useSettings from '../composition/settings';
import DragDropZone from '../components/DragDropZone.vue';

const { t } = useI18n();
const { player } = usePlayer();
const router = useRouter();
const showModal = inject('showModal');
const { settings, setSettings, saveSettingsToDB,getSettingsAsync } = useSettings();

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
  router.push('/playlist/' + playlistId);
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
const changeProgress = (progress) => {
  l1Player.seek(progress);
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
    saveSettingsToDB({playerSettings: {...settings.playerSettings, volume: progress * 100}});
  };
  task();
};
const toggleMuteStatus = () => {
  l1Player.toggleMute();
};
const playFromPlaylist = (song) => {
  l1Player.playById(song.id);
};
const removeTrack = (track) => {
  l1Player.removeTrack(track);
};
const openUrl = (url) => {
  window.open(url, '_blank').focus();
};
const onCurrentPlayingSongDrop = (song,event) => {
  const { data, dragType, direction } = event;
  if (dragType === 'application/listen1-song') {
    // insert song
    l1Player.insertTrack(data, toRaw(song), direction);
  }
}
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

let playlist = $computed(() => player.playlist.value);
let isPlaying = $computed(() => player.isPlaying);
let myProgress = $computed(() => player.myProgress);
let currentDuration = $computed(() => player.currentDuration);
let currentPosition = $computed(() => player.currentPosition);
let currentPlaying = $computed(() => player.currentPlaying || {});
let volume = $computed(() => player.volume);
let mute = $computed(() => player.mute);

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
