<template>
  <div class="page page-hot-playlist" ng-controller="PlayListController" ng-init="loadPlaylist();">
    <div class="source-list">
      <template v-for="(source, index) in sourceList" :key="source.name">
        <div class="source-button" :class="{ active: tab === source.name }" @click="changeTab(source.name)">
          {{ t(source.name) }}
        </div>
        <div v-if="index != sourceList.length - 1" class="splitter" />
      </template>
    </div>
    <div class="playlist-filter">
      <div
        v-for="filter in playlistFilters[tab] || []"
        :key="filter.name"
        class="l1-button filter-item"
        ng-class="{'active':filter.id === currentFilterId}"
        @click="changeFilter(filter.id)"
      >
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
                            </div> -->
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, reactive, toRefs } from 'vue';
import MediaService from '../services/MediaService';
import { useRouter } from 'vue-router';
import { l1Player } from '@/services/l1_player';
import { useI18n } from 'vue-i18n';
export default {
  setup() {
    const { t } = useI18n();
    const router = useRouter();
    const data = reactive({
      currentFilterId: '',
      result: [],
      tab: MediaService.getSourceList()[0].name,
      loading: true,
      showMore: false,
      playlistFilters: {},
      allPlaylistFilters: {}
    });

    const loadPlaylist = () => {
      const offset = 0;
      data.showMore = false;

      MediaService.showPlaylistArray(data.tab, offset, data.currentFilterId).then((res) => {
        data.result = res.result;
        data.loading = false;
      });

      if (data.playlistFilters[data.tab] === undefined && data.allPlaylistFilters[data.tab] === undefined) {
        MediaService.getPlaylistFilters(data.tab).then((res) => {
          data.playlistFilters[data.tab] = res.recommend;
          data.allPlaylistFilters[data.tab] = res.all;
        });
      }
    };
    onMounted(loadPlaylist);
    return {
      t,
      ...toRefs(data),
      changeTab: (newTab) => {
        data.tab = newTab;
        data.result = [];
        data.currentFilterId = '';
        loadPlaylist();
      },
      changeFilter: (filterId) => {
        data.result = [];
        data.currentFilterId = filterId;
        loadPlaylist();
      },
      toggleMorePlaylists: () => {
        data.showMore = !data.showMore;
      },
      showPlaylist: (playlistId) => {
        router.push('/playlist/' + playlistId);
      },
      directplaylist: async (list_id) => {
        const data = await MediaService.getPlaylist(list_id);
        const songs = data.tracks;
        l1Player.setNewPlaylist(songs);
        l1Player.play();
      },
      sourceList: computed(() => MediaService.getSourceList())
    };
  }
};
</script>

<style>
</style>