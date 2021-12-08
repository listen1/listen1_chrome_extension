<template>
  <div class="page page-hot-playlist">
    <div class="source-list">
      <template v-for="(source, index) in sourceList" :key="source.name">
        <div class="source-button" :class="{ active: tab === source.name }" @click="changeTab(source.name)">{{ t(source.name) }}</div>
        <div v-if="index != sourceList.length - 1" class="splitter" />
      </template>
    </div>
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
        <ul class="playlist-covers">
          <li v-for="i in result" :key="i.id">
            <div class="u-cover">
              <img :src="i.cover_img_url" @click="showPlaylist(i.id)" />
              <div class="bottom" @click="directplaylist(i.id)">
                <vue-feather type="play-circle"></vue-feather>
              </div>
            </div>
            <div class="desc">
              <span class="title" @click="showPlaylist(i.id)">{{ i.title }}</span>
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

<style></style>
