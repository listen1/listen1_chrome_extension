<template>
  <div class="page page-hot-playlist max-w-5xl my-0 mx-auto">
    <SourceTab :sources="sourceList" :tab="tab" @click="changeTab"></SourceTab>
    <div class="playlist-filter">
      <div
        v-for="filter in playlistFilters[tab] || []"
        :key="filter.name"
        class="l1-button filter-item"
        ng-class="{'active':filter.id === currentFilterId}"
        @click="changeFilter(filter.id)">
        {{ filter.name }}
      </div>
      <div v-show="playlistFilters[tab] && playlistFilters[tab].length > 0" class="l1-button filter-item" @click="toggleMorePlaylists()">更多...</div>
    </div>
    <div v-show="showMore" class="all-playlist-filter">
      <div v-for="category in allPlaylistFilters[tab] || []" :key="category.category" class="category">
        <div class="category-title">{{ category.category }}</div>
        <div class="category-filters">
          <div v-for="filter in category.filters" :key="filter.name" class="filter-item">
            <span @click="changeFilter(filter.id)">{{ filter.name }}</span>
          </div>
        </div>
      </div>
    </div>
    <div id="hotplaylist" class="site-wrapper-innerd">
      <div id="playlist-content" class="cover-container">
        <ul class="playlist-covers m-0 py-0 flex relative flex-wrap">
          <li v-for="i in result" :key="i.id" class="group w-1/3 md:w-1/5 min-h-40 px-4 sm:w-1/4">
            <div class="u-cover flex relative">
              <img :src="i.cover_img_url" @click="showPlaylist(i.id)" class="m-auto border border-default cursor-pointer w-full object-cover" />
              <div
                class="bottom opacity-0 group-hover:opacity-100 cursor-pointer absolute w-8 h-8 bottom-3 right-3 ease-linear duration-200"
                @click="directplaylist(i.id)">
                <vue-feather type="play-circle" size="2rem"></vue-feather>
              </div>
            </div>
            <div class="desc cursor-pointer">
              <span class="title flex min-h-8" @click="showPlaylist(i.id)">{{ i.title }}</span>
            </div>
          </li>
          <!-- <div class="loading_bottom">
                              <img src="images/loading-1.gif" height="40px" />
          </div>-->
        </ul>
      </div>
    </div>
  </div>
</template>
<script setup>
/* eslint-disable @typescript-eslint/no-unused-vars */

import { l1Player } from '../services/l1_player';
import { computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import MediaService from '../services/MediaService';
import EventService from '../services/EventService';
import SourceTab from '../components/SourceTab.vue';

const { t } = useI18n();
const router = useRouter();
let currentFilterId = $ref('');
let result = $ref([]);
let tab = $ref(MediaService.getSourceList()[0].name);
let loading = $ref(true);
let showMore = $ref(false);
let playlistFilters = $ref({});
let allPlaylistFilters = $ref({});

const loadPlaylist = async (isReset) => {
  let offset = 0;
  if (!isReset) {
    offset = result.length;
  }
  showMore = false;
  let response = await MediaService.showPlaylistArray(tab, offset, currentFilterId);
  if (isReset) {
    result = response;
  } else {
    result = [...result, ...response];
  }
  loading = false;

  if (playlistFilters[tab] === undefined && allPlaylistFilters[tab] === undefined) {
    const { recommend, all } = await MediaService.getPlaylistFilters(tab);
    playlistFilters[tab] = recommend;
    allPlaylistFilters[tab] = all;
  }
};
const handleLoadMore = async () => {
  await loadPlaylist(false);
};
onMounted(() => {
  loadPlaylist(true);
  EventService.on(`scroll:bottom`, handleLoadMore);
});

onUnmounted(() => {
  EventService.off(`scroll:bottom`, handleLoadMore);
});

const changeTab = (newTab) => {
  tab = newTab;
  result = [];
  currentFilterId = '';
  loadPlaylist(true);
};
const changeFilter = (filterId) => {
  result = [];
  currentFilterId = filterId;
  loadPlaylist(true);
};
const toggleMorePlaylists = () => {
  showMore = !showMore;
};
const showPlaylist = (playlistId) => {
  router.push('/playlist/' + playlistId);
};
const directplaylist = async (list_id) => {
  const data = await MediaService.getPlaylist(list_id);
  const songs = data.tracks;
  l1Player.playTracks(songs);
};
const sourceList = computed(() => MediaService.getSourceList());
</script>

<style>
.playlist-covers .u-cover .bottom svg {
  fill: rgba(200, 200, 200, 0.5);
  stroke-width: 1;
  stroke: #ffffff;
}

.playlist-covers .u-cover .bottom svg:hover {
  fill: rgba(100, 100, 100, 0.5);
}
</style>
