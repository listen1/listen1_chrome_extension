<template>
  <div class="page page-hot-playlist max-w-5xl my-0 mx-auto">
    <SourceTab :sources="sourceList" :tab="tab" @click="changeTab" :loading="false"></SourceTab>
    <div class="playlist-filter mx-4 mb-4 leading-8">
      <div
        v-for="filter in playlistFilters[tab] || []"
        :key="filter.name"
        class="l1-button filter-item mr-3 px-4 py-1"
        :class="{ 'font-semibold': filter.id === currentFilterId }"
        @click="changeFilter(filter.id)">
        {{ filter.name }}
      </div>
      <div v-show="playlistFilters[tab] && playlistFilters[tab].length > 0" class="l1-button filter-item px-4 py-1" @click="toggleMorePlaylists()">更多...</div>
    </div>
    <div v-show="showMore" class="all-playlist-filter px-4">
      <div v-for="category in allPlaylistFilters[tab] || []" :key="category.category" class="category flex mb-4">
        <div class="category-title w-16 text-lg flex-none pl-4 font-semibold">{{ category.category }}</div>
        <div class="category-filters flex flex-wrap ml-4">
          <div v-for="filter in category.filters" :key="filter.name" class="filter-item flex min-w-24 rounded-sm hover:bg-button">
            <span class="flex items-center justify-center cursor-pointer px-4 py-1" @click="changeFilter(filter.id)">{{ filter.name }}</span>
          </div>
        </div>
      </div>
    </div>
    <div id="hotplaylist" class="site-wrapper-innerd">
      <div id="playlist-content" class="cover-container">
        <PlaylistGrid :playlists="result"></PlaylistGrid>
      </div>
    </div>
  </div>
</template>
<script setup>
/* eslint-disable @typescript-eslint/no-unused-vars */
import { computed, onMounted, onUnmounted } from 'vue';
import PlaylistGrid from '../components/PlaylistGrid.vue';
import SourceTab from '../components/SourceTab.vue';
import EventService from '../services/EventService';
import MediaService from '../services/MediaService';

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
.l1-button {
  background-color: var(--button-background-color);
  color: var(--text-default-color);
  border-radius: var(--default-border-radius);
  padding: 5px;
  margin-right: 4px;
  color: var(--text-default-color);
  cursor: pointer;
  display: inline-block;
}
.l1-button:hover {
  background: var(--button-hover-background-color);
}
</style>
