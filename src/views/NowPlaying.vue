<template>
  <div class="page">
    <div
      class="songdetail-wrapper absolute top-0 left-0 right-0 bottom-20 overflow-hidden duration-300 app-region-nodrag bg-now-playing"
      :class="{
        slidedown: overlay.type !== 'track',
        coverbg: settings.enableNowplayingCoverBackground
      }">
      <div
        :class="{ 'app-region-drag': overlay.type === 'track', 'app-region-nodrag hidden': overlay.type !== 'track' }"
        class="absolute top-0 left-0 right-0 h-24" />
      <div
        v-if="settings.enableNowplayingCoverBackground"
        class="bg opacity-50 h-full text-center float-left w-full brightness-[0.8] blur-[90px] duration-1000 ease-in-out"
        :style="{ backgroundImage: `url(${currentPlaying.img_url}` }" />
      <div
        class="translate-switch app-region-nodrag h-6 w-6 border flex items-center justify-center absolute bottom-10 right-10 cursor-pointer text-neutral-400 hover:text-default"
        @click="toggleLyricTranslation()"
        :class="{ 'text-default': settings.enableLyricTranslation }">
        译
      </div>
      <div class="close app-region-nodrag cursor-pointer absolute left-8 right-8 w-8 h-8" :class="isMac ? 'mac top-16' : 'top-8 '" @click="toggleNowPlaying()">
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

      <div class="playsong-detail absolute left-11 right-11 my-0 mx-auto flex h-full max-w-5xl">
        <div class="detail-head overflow-hidden flex-none w-96">
          <div class="detail-head-cover w-72 h-72 mt-32">
            <img class="w-72 h-72 object-cover" :src="currentPlaying.img_url" @error="showImage($event, 'images/mycover.jpg')" />
          </div>
          <div class="detail-head-title">
            <!--<a title="加入收藏" class="clone" ng-click="showDialog(0, currentPlaying)">收藏</a>
            <a open-url="currentPlaying.source_url" title="原始链接" class="link">原始链接</a>-->
          </div>
        </div>
        <div class="detail-songinfo flex app-region-nodrag overflow-hidden mt-28 flex-col flex-1">
          <div class="title flex items-center">
            <h2 class="font-normal text-3xl mr-4 mb-4">{{ currentPlaying.title }}</h2>
            <span
              v-if="settings.enableNowplayingBitrate && currentPlaying.bitrate !== undefined"
              class="badge text-badge text-sm border border-badge px-2 ml-2 mt-2 rounded h-6 flex items-center justify-center whitespace-nowrap">
              {{ currentPlaying.bitrate }}
            </span>
            <span
              v-if="settings.enableNowplayingPlatform && currentPlaying.platform !== undefined"
              class="badge text-badge text-sm border border-badge px-2 ml-2 mt-2 rounded h-6 flex items-center justify-center whitespace-nowrap platform">
              {{ t(currentPlaying.platform) }}
            </span>
          </div>
          <div class="info border-b border-default pb-2 flex">
            <div class="singer flex-1 overflow-hidden whitespace-nowrap text-ellipsis">
              <span>{{ t('_ARTIST') }}：</span>
              <a
                class="cursor-pointer"
                @click="
                  showPlaylist(currentPlaying.artist_id);
                  setOverlayType('');
                "
                :title="currentPlaying.artist">
                {{ currentPlaying.artist }}
              </a>
            </div>
            <div class="album flex-2 overflow-hidden whitespace-nowrap text-ellipsis">
              <span>{{ t('_ALBUM') }}：</span>
              <a
                class="cursor-pointer"
                @click="
                  showPlaylist(currentPlaying.album_id);
                  setOverlayType('');
                "
                :title="currentPlaying.album">
                {{ currentPlaying.album }}
              </a>
            </div>
          </div>
          <div class="lyric relative flex-none h-96 overflow-y-scroll">
            <div class="placeholder" />
            <p
              v-for="line in lyricArray"
              :key="line.lineNumber"
              :data-line="line.lineNumber"
              :style="{ fontWeight: lyricFontWeight, fontSize: `${lyricFontSize}px` }"
              :class="{
                highlight: line.lineNumber == lyricLineNumber || line.lineNumber == lyricLineNumberTrans,
                hidden: line.translationFlag && !settings.enableLyricTranslation,
                'mt-1': line.translationFlag,
                'mt-4': !line.translationFlag
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
import { useRouter } from 'vue-router';
import useOverlay from '../composition/overlay';
import usePlayer from '../composition/player';
import useSettings from '../composition/settings';

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
<style>
.page .songdetail-wrapper.slidedown {
  top: calc(100% - 5rem);
}
.page .bg {
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  transition: background ease-in-out 1.5s;
}
.page .playsong-detail .detail-songinfo .info span {
  color: var(--lyric-default-color);
}
.page .coverbg .playsong-detail .detail-songinfo .info span {
  color: var(--lyric-on-cover-color);
}
.page .playsong-detail .detail-songinfo .lyric {
  color: var(--lyric-default-color);
  scrollbar-width: thin;
  scrollbar-color: var(--scroll-color) transparent;
}
.page .coverbg .playsong-detail .detail-songinfo .lyric {
  color: var(--lyric-on-cover-color);
}

.page .playsong-detail .detail-songinfo .lyric p.highlight {
  color: var(--lyric-important-color);
}
.page .coverbg .playsong-detail .detail-songinfo .lyric p.highlight {
  color: var(--lyric-important-on-cover-color);
}
/* .page .songdetail-wrapper .window-control {
  position: absolute;
  top: 24px;
  left: 55px;
  height: 24px;
  cursor: pointer;
  -webkit-app-region: no-drag;
  z-index: 99;
}

.page .songdetail-wrapper .window-control svg {
  margin-left: 8px;
  stroke: var(--now-playing-close-icon-color);
}

.page .songdetail-wrapper .close svg {
  stroke: var(--now-playing-close-icon-color);
} */
</style>
