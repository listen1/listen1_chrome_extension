<template>
  <div class="page">
    <div
      class="songdetail-wrapper absolute flex flex-col top-0 left-0 right-0 bottom-20 overflow-y-scroll duration-300 app-region-nodrag bg-now-playing"
      :class="{
        slidedown: overlay.type !== 'track',
        coverbg: settings.enableNowplayingCoverBackground
      }">
      <div
        :class="{ 'app-region-drag': overlay.type === 'track', 'app-region-nodrag hidden': overlay.type !== 'track' }"
        class="absolute top-0 left-0 right-0 h-24" />
      <div
        v-if="settings.enableNowplayingCoverBackground"
        class="bg absolute opacity-50 h-full text-center w-full brightness-[0.8] blur-[90px] duration-1000 ease-in-out"
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

      <div class="playsong-detail my-0 mx-auto flex w-[60rem] z-10">
        <div class="detail-head overflow-hidden flex-none w-[30rem] flex justify-center">
          <div class="detail-head-cover w-72 h-72 mt-32">
            <img class="w-72 h-72 object-cover" :src="currentPlaying.img_url" @error="showImage($event, 'images/mycover.jpg')" />
          </div>
          <div class="detail-head-title">
            <!--<a title="加入收藏" class="clone" ng-click="showDialog(0, currentPlaying)">收藏</a>
            <a open-url="currentPlaying.source_url" title="原始链接" class="link">原始链接</a>-->
          </div>
        </div>
        <div class="detail-songinfo flex app-region-nodrag overflow-hidden mt-28 flex-col flex-1">
          <div class="title flex items-start">
            <h2 class="font-normal text-3xl mr-4 mb-4">{{ currentPlaying.title }}</h2>
            <span
              v-if="settings.enableNowplayingBitrate && currentTrackMeta.bitrate !== undefined"
              class="badge text-badge text-sm border border-badge px-2 ml-2 mt-2 rounded h-6 flex items-center justify-center whitespace-nowrap">
              {{ currentTrackMeta.bitrate }}
            </span>
            <span
              v-if="settings.enableNowplayingPlatform && currentTrackMeta.platform !== undefined"
              class="badge text-badge text-sm border border-badge px-2 ml-2 mt-2 rounded h-6 flex items-center justify-center whitespace-nowrap platform">
              {{ t(currentTrackMeta.platform) }}
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
                highlight: (!line.translationFlag && line.lineNumber == lyricLineNumber) || (line.translationFlag && line.lineNumber == lyricLineNumberTrans),
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
      <div v-if="commentList.length > 0" class="mt-20 mb-8 mx-auto w-[42rem] z-10">
        <div>热门评论</div>
        <ul>
          <li v-for="comment in commentList" :key="comment.id" class="flex py-4 border-b border-default">
            <div class="flex-none w-16 justify-center">
              <img :src="comment.avatar" class="w-12 h-12 object-cover rounded-full" />
            </div>
            <div class="flex-1 overflow-hidden">
              <div>
                <span class="text-blue-500 mr-1">{{ comment.nickname }}:</span>
                <span v-for="line,index in comment.content.split('\n')" :key=index>
                {{ line }} <br v-if="line != ''"/>
                </span>
              </div>
              <div v-if="comment.reply.length > 0" class="mt-2 p-2 bg-even">
                <span class="text-blue-500 mr-1">{{ comment.reply[0].nickname }}:</span>
                {{ comment.reply[0].content }}
              </div>
              <div class="flex text-neutral-500 mt-1">
                <div class="flex-1 text-left">{{ d(new Date(comment.time)) }}</div>
                <div class="flex-1 text-right mr-2 flex items-center justify-end">
                  <vue-feather class="mr-1" type="thumbs-up" size="1rem"></vue-feather>
                  {{ comment.like }}
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
<script setup>
import { watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import useOverlay from '../composition/overlay';
import usePlayer from '../composition/player';
import useSettings from '../composition/settings';
import MediaService from '../services/MediaService';

const { t, d } = useI18n();
const { player } = usePlayer();
let { overlay, setOverlayType } = useOverlay();
const router = useRouter();
const { settings, setSettings } = useSettings();

let isMac = $ref(false);
let commentList = $ref([]);
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
let currentTrackMeta = $computed(() => player.currentTrackMeta || {});
let lyricFontWeight = $computed(() => settings.lyricFontWeight);
let lyricFontSize = $computed(() => settings.lyricFontSize);

watchEffect(async () => {
  let trackId = '';

  if (player.currentPlaying && player.currentPlaying.id) {
    trackId = player.currentPlaying.id;
  }
  if (!trackId) {
    return;
  }

  const result = await MediaService.getCommentList(player.currentPlaying, 0, 100);
  commentList = result['comments'];
  document.getElementsByClassName('songdetail-wrapper')[0].scrollTop = 0;
});
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
