<template>
  <div class="page">
    <div
      class="songdetail-wrapper"
      :class="{
        slidedown: overlay.type !== 'track',
        coverbg: settings.enableNowplayingCoverBackground
      }">
      <div class="draggable-zone" />
      <div v-if="settings.enableNowplayingCoverBackground" class="bg" :style="{ backgroundImage: `url(${currentPlaying.img_url}` }" />
      <div class="translate-switch" @click="toggleLyricTranslation()" :class="{ selected: settings.enableLyricTranslation }">译</div>
      <div class="close" :class="isMac ? 'mac' : ''" @click="toggleNowPlaying()">
        <vue-feather type="chevron-down"></vue-feather>
      </div>

      <!-- <div v-if="!isChrome && !isMac" class="window-control">
                <svg class="icon" window-control="window_min">
                  <use href="#minimize-2" />
                </svg>
                <svg class="icon" window-control="window_max">
                  <use href="#maximize" />
                </svg>
                <svg class="icon" window-control="window_close">
                  <use href="#x" />
                </svg>
      </div>-->

      <div class="playsong-detail">
        <div class="detail-head">
          <div class="detail-head-cover">
            <img :src="currentPlaying.img_url" @error="showImage($event, 'images/mycover.jpg')" />
          </div>
          <div class="detail-head-title">
            <!--<a title="加入收藏" class="clone" ng-click="showDialog(0, currentPlaying)">收藏</a>
            <a open-url="currentPlaying.source_url" title="原始链接" class="link">原始链接</a>-->
          </div>
        </div>
        <div class="detail-songinfo">
          <div class="title">
            <h2>{{ currentPlaying.title }}</h2>
            <span v-if="settings.enableNowplayingBitrate && currentPlaying.bitrate !== undefined" class="badge">{{ currentPlaying.bitrate }}</span>
            <span v-if="settings.enableNowplayingPlatform && currentPlaying.platform !== undefined" class="badge platform">
              {{ t(currentPlaying.platform) }}
            </span>
          </div>
          <div class="info">
            <div class="singer">
              <span>{{ t('_ARTIST') }}：</span>
              <a
                @click="
                  showPlaylist(currentPlaying.artist_id);
                  setOverlayType('');
                "
                :title="currentPlaying.artist">
                {{ currentPlaying.artist }}
              </a>
            </div>
            <div class="album">
              <span>{{ t('_ALBUM') }}：</span>
              <a
                @click="
                  showPlaylist(currentPlaying.album_id);
                  setOverlayType('');
                "
                :title="currentPlaying.album">
                {{ currentPlaying.album }}
              </a>
            </div>
          </div>
          <div class="lyric">
            <div class="placeholder" />
            <p
              v-for="line in lyricArray"
              :key="line.lineNumber"
              :data-line="line.lineNumber"
              :style="{ fontWeight: lyricFontWeight, fontSize: `${lyricFontSize}px` }"
              :class="{
                highlight: line.lineNumber == lyricLineNumber || line.lineNumber == lyricLineNumberTrans,
                hide: line.translationFlag && !settings.enableLyricTranslation,
                translate: line.translationFlag
              }">
              {{ line.content }}
            </p>
            <div class="placeholder" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import usePlayer from '../composition/player';
import useSettings from '../composition/settings';
import useOverlay from '../composition/overlay';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const { player } = usePlayer();
let { overlay, setOverlayType } = useOverlay();
const router = useRouter();
const { settings, setSettings } = useSettings();

let isMac = $ref(false);

const toggleNowPlaying = () => {
  if (overlay.type != 'track') {
    setOverlayType('track');
  } else {
    setOverlayType('');
  }
};

const showPlaylist = (playlistId) => {
  router.push('/playlist/' + playlistId);
};

const toggleLyricTranslation = () => setSettings({ enableLyricTranslation: !settings.enableLyricTranslation });

const showImage = (e, url) => {
  e.target.src = url;
};

let lyricArray = $computed(() => player.lyricArray.value);
let lyricLineNumber = $computed(() => player.lyricLineNumber);
let lyricLineNumberTrans = $computed(() => player.lyricLineNumberTrans);

let currentPlaying = $computed(() => player.currentPlaying || {});
let lyricFontWeight = $computed(() => settings.lyricFontWeight);
let lyricFontSize = $computed(() => settings.lyricFontSize);
</script>
