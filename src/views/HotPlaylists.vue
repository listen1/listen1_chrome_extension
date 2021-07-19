<template>
  <div class="page page-hot-playlist" ng-controller="PlayListController" ng-init="loadPlaylist();">
    <div class="source-list">
      <template v-for="(source, index) in sourceList" :key="source.name">
        <div class="source-button" :class="{ active: tab === source.name }" @click="changeTab(source.name)">
          {{ $t(source.name) }}
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
import MediaService from '../services/MediaService';
import { l1Player } from '@/services/l1_player';

export default {
  data() {
    return {
      currentFilterId: '',
      result: [],
      tab: MediaService.getSourceList()[0].name,
      loading: true,
      showMore: false,
      playlistFilters: {},
      allPlaylistFilters: {}
    };
  },
  computed: {
    sourceList() {
      return MediaService.getSourceList();
    }
  },
  mounted() {
    this.loadPlaylist();
  },
  methods: {
    changeTab: function (newTab) {
      this.tab = newTab;
      this.result = [];
      this.currentFilterId = '';

      this.loadPlaylist();
    },
    changeFilter: function (filterId) {
      this.result = [];
      this.currentFilterId = filterId;
      this.loadPlaylist();
    },
    toggleMorePlaylists: function () {
      this.showMore = !this.showMore;
    },
    loadPlaylist: function () {
      const offset = 0;
      this.showMore = false;
      MediaService.showPlaylistArray(this.tab, offset, this.currentFilterId).success((res) => {
        this.result = res.result;
        this.loading = false;
      });

      if (this.playlistFilters[this.tab] === undefined && this.allPlaylistFilters[this.tab] === undefined) {
        MediaService.getPlaylistFilters(this.tab).success((res) => {
          this.playlistFilters[this.tab] = res.recommend;
          this.allPlaylistFilters[this.tab] = res.all;
        });
      }
    },
    showPlaylist: function (playlistId) {
      this.$router.push('/playlist/' + playlistId);
    },
    directplaylist(list_id) {
      MediaService.getPlaylist(list_id).then((data) => {
        this.songs = data.tracks;
        this.current_list_id = list_id;
        l1Player.setNewPlaylist(this.songs);
        l1Player.play();
      });
    }
  }
};
</script>

<style>
</style>