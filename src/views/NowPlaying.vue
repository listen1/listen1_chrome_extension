<template>
  <div class="page">
    <div
      class="songdetail-wrapper app-region-nodrag absolute bottom-20 left-0 right-0 top-0 flex flex-col bg-now-playing duration-300"
      :class="{
        'overflow-y-scroll': commentActive,
        'justify-center overflow-hidden': !commentActive,
        slidedown: overlay.type !== 'track',
        coverbg: settings.enableNowplayingCoverBackground
      }">
      <div
        :class="{ 'app-region-drag': overlay.type === 'track', 'app-region-nodrag hidden': overlay.type !== 'track' }"
        class="absolute left-0 right-0 top-0 h-24" />
      <div
        v-if="settings.enableNowplayingCoverBackground"
        class="bg absolute h-full w-full text-center opacity-50 blur-[90px] brightness-[0.8] duration-1000 ease-in-out"
        :style="{ backgroundImage: `url(${currentPlaying?.img_url}` }" />

      <div
        class="translate-switch app-region-nodrag absolute bottom-10 right-10 flex h-6 w-6 cursor-pointer items-center justify-center border text-neutral-400 hover:text-default"
        :class="{ 'text-default': settings.enableLyricTranslation }"
        @click="toggleLyricTranslation()">
        译
      </div>
      <div class="close app-region-nodrag absolute left-8 right-8 h-8 w-8 cursor-pointer" :class="isMac ? 'mac top-16' : 'top-8 '" @click="toggleNowPlaying()">
        <vue-feather type="chevron-down"></vue-feather>
      </div>
      <WindowControl class="absolute right-2 top-4" />
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

      <div class="playsong-detail z-10 flex w-[60rem] justify-center self-center" :class="{ 'mt-24': commentActive }">
        <div class="detail-head mr-20 flex items-center overflow-hidden">
          <div class="detail-head-cover w-80 transition-all ease-in-out 2xl:w-96">
            <img class="aspect-square w-full rounded-lg object-cover shadow-2xl" :src="currentPlaying?.img_url" @error="showImage($event, coverImg)" />
          </div>
          <div class="detail-head-title">
            <!--<a title="加入收藏" class="clone" ng-click="showDialog(0, currentPlaying)">收藏</a>
            <a open-url="currentPlaying.source_url" title="原始链接" class="link">原始链接</a>-->
          </div>
        </div>
        <div class="detail-songinfo app-region-nodrag ml-8 flex w-96 flex-col overflow-hidden">
          <div class="title flex items-start">
            <h2 class="mb-4 mr-4 text-3xl font-normal">{{ currentPlaying?.title }}</h2>
            <span
              v-if="settings.enableNowplayingBitrate && currentTrackMeta?.bitrate !== undefined"
              class="badge ml-2 mt-2 flex h-6 items-center justify-center whitespace-nowrap rounded border border-badge px-2 text-sm text-badge">
              {{ currentTrackMeta.bitrate }}
            </span>
            <span
              v-if="settings.enableNowplayingPlatform && currentTrackMeta?.platform !== undefined"
              class="badge platform ml-2 mt-2 flex h-6 items-center justify-center whitespace-nowrap rounded border border-badge px-2 text-sm text-badge">
              {{ t(currentTrackMeta.platform) }}
            </span>
          </div>
          <div class="info flex border-b border-default pb-2">
            <div class="singer flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
              <span>{{ t('_ARTIST') }}:</span>
              <a
                class="ml-2 cursor-pointer"
                :title="currentPlaying?.artist"
                @click="
                  showPlaylist(currentPlaying?.artist_id);
                  setOverlayType('');
                ">
                {{ currentPlaying?.artist }}
              </a>
            </div>
            <div class="album flex-2 overflow-hidden text-ellipsis whitespace-nowrap">
              <span>{{ t('_ALBUM') }}:</span>
              <a
                class="ml-2 cursor-pointer"
                :title="currentPlaying?.album"
                @click="
                  showPlaylist(currentPlaying?.album_id);
                  setOverlayType('');
                ">
                {{ currentPlaying?.album }}
              </a>
            </div>
          </div>
          <div class="lyric blur-mask relative h-[30rem] flex-none overflow-y-scroll">
            <div class="placeholder h-1/3" />
            <p
              v-for="line in lyricArray"
              :key="line.lineNumber"
              :data-line="line.lineNumber"
              :style="{
                fontWeight: lyricFontWeight,
                fontSize: `${lyricFontSize * (isHighlighted(line.lineNumber, line.translationFlag) ? 1.2 : 1)}px`,
                filter: `blur(${line.lineNumber === (line.translationFlag ? lyricLineNumberTrans : lyricLineNumber) ? 0.25 : 0}px)`
              }"
              :class="{
                highlight: isHighlighted(line.lineNumber, line.translationFlag),
                hidden: line.translationFlag && !settings.enableLyricTranslation,
                'mt-1': line.translationFlag,
                'mt-4': !line.translationFlag
              }">
              {{ line.content }}
            </p>
            <div class="placeholder h-1/3" />
          </div>
        </div>
      </div>
      <div v-if="commentActive" class="z-10 mb-8 mt-16 w-[42rem] self-center">
        <div>热门评论</div>
        <ul>
          <li v-for="comment in commentList" :key="comment.id" class="flex border-b border-default py-4">
            <div class="w-16 flex-none justify-center">
              <img :src="comment.avatar" class="h-12 w-12 rounded-full object-cover" />
            </div>
            <div class="flex-1 overflow-hidden">
              <div>
                <span class="mr-1 text-blue-500">{{ comment.nickname }}:</span>
                <span v-for="(line, index) in comment.content.split('\n')" :key="index">
                  {{ line }}
                  <br v-if="line != ''" />
                </span>
              </div>
              <div v-if="comment.reply.length > 0" class="mt-2 bg-even p-2">
                <span class="mr-1 text-blue-500">{{ comment.reply[0].nickname }}:</span>
                {{ comment.reply[0].content }}
              </div>
              <div class="mt-1 flex text-neutral-500">
                <div class="flex-1 text-left">{{ d(new Date(comment.time), 'long') }}</div>
                <div class="mr-2 flex flex-1 items-center justify-end text-right">
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
<script setup lang="ts">
import { watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import WindowControl from '../components/WindowControl.vue';
import useOverlay from '../composition/overlay';
import usePlayer from '../composition/player';
import useSettings from '../composition/settings';
import { datetimeFormats } from '../i18n/index';
import coverImg from '../images/mycover.jpg';
import type { Comment } from '../provider/types';
import MediaService from '../services/MediaService';
const { t, d } = useI18n({
  //@ts-ignore mismatch arg num
  datetimeFormats
});
const { player } = usePlayer();
let { overlay, setOverlayType } = useOverlay();
const router = useRouter();
const { settings, setSettings } = useSettings();

let isMac = $ref(false);
let commentList = $ref(<Comment[]>[]);
let commentActive = $computed(() => settings.enableNowplayingComment && commentList.length > 0);
const toggleNowPlaying = () => {
  if (overlay.type != 'track') {
    setOverlayType('track');
  } else {
    setOverlayType('');
  }
};

const showPlaylist = (playlistId?: string) => {
  router.push('/playlist/' + playlistId);
};

const toggleLyricTranslation = () => setSettings({ enableLyricTranslation: !settings.enableLyricTranslation });
const isHighlighted = (n: number, flag: boolean) => n == (flag ? lyricLineNumberTrans : lyricLineNumber);

const showImage = (e: any, url: any) => {
  e.target.src = url;
};

let lyricArray = $computed(() => player.lyricArray.value);
let lyricLineNumber = $computed(() => player.lyricLineNumber);
let lyricLineNumberTrans = $computed(() => player.lyricLineNumberTrans);

let currentPlaying = $computed(() => player.currentPlaying);
let currentTrackMeta = $computed(() => player.currentTrackMeta);
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

.blur-mask {
  mask: linear-gradient(transparent 5%, black 20%, black 80%, transparent 95%);
  -webkit-mask: linear-gradient(transparent 5%, black 20%, black 80%, transparent 95%);
}
</style>
