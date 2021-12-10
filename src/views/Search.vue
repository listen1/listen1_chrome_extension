<template>
  <!-- content page: 快速搜索 -->
  <div class="page">
    <div class="site-wrapper-innerd">
      <div class="cover-container">
        <div class="searchbox">
          <SourceTab :tab="condition.tab" :sources="sourceList" @click="changeSourceTab" :loading="result.loading">
            <template v-slot:right>
              <div class="search-type float-right">
                <li
                  class="source-button inline-block cursor-pointer border-b hover:border-active hover:text-default"
                  :class="{ 'border-active': condition.searchType === 0, 'border-transparent text-inactive': condition.searchType !== 0 }"
                  @click="changeSearchType(0)">
                  <a>单曲</a>
                </li>
                <div class="splitter inline-block mx-3 -mb-0.5 w-px h-4 bg-neutral-400" />
                <li
                  class="source-button inline-block cursor-pointer border-b hover:border-active hover:text-default"
                  :class="{ 'border-active': condition.searchType === 1, 'border-transparent text-inactive': condition.searchType !== 1 }"
                  @click="changeSearchType(1)">
                  <a>歌单</a>
                </li>
              </div>
            </template>
          </SourceTab>

          <ul class="detail-songlist">
            <li v-if="condition.searchType === 0" class="head">
              <div class="title">
                <a>{{ t('_SONGS') }}</a>
              </div>
              <div class="artist">
                <a>{{ t('_ARTISTS') }}</a>
              </div>
              <div class="album">
                <a>{{ t('_ALBUMS') }}</a>
              </div>
              <div class="tools">{{ t('_OPERATION') }}</div>
            </li>
            <li v-if="condition.searchType === 1" class="head">
              <div class="title">
                <a>{{ t('_PLAYLIST_TITLE') }}</a>
              </div>
              <div class="artist">
                <a>{{ t('_PLAYLIST_AUTHOR') }}</a>
              </div>
              <div class="album">
                <a>{{ t('_PLAYLIST_SONG_COUNT') }}</a>
              </div>
            </li>
            <template v-if="condition.searchType === 0">
              <li
                v-for="(song, index) in result.tracks"
                :key="song.id"
                :class="{ even: index % 2 === 0, odd: index % 2 !== 0 }"
                @mouseenter="song.options = true"
                @mouseleave="song.options = undefined">
                <div class="title">
                  <!-- <a ng-if="song.disabled" class="disabled" ng-click="copyrightNotice()"> song.title |limitTo:30</a> -->
                  <a add-and-play="song" @click="play(song)">
                    <!-- <span ng-if="isActiveTab('allmusic')" class="source">{{ song.sourceName }}</span> -->
                    {{ song.title }}
                  </a>
                </div>
                <div class="artist">
                  <a @click="$router.push(`/playlist/${song.artist_id}`)">{{ song.artist }}</a>
                </div>
                <div class="album">
                  <a @click="$router.push(`/playlist/${song.album_id}`)">{{ song.album }}</a>
                </div>

                <div class="tools">
                  <a v-show="song.options" :title="t('_ADD_TO_QUEUE')" class="detail-add-button" add-without-play="song"><span class="icon li-add" /></a>
                  <a v-show="song.options" :title="t('_ADD_TO_PLAYLIST')" class="detail-fav-button" @click="showModal('AddToPlaylist', { tracks: [song] })">
                    <span class="icon li-songlist" />
                  </a>
                  <a
                    v-show="song.options && is_mine == '1'"
                    title="_REMOVE_FROM_PLAYLIST"
                    class="detail-delete-button"
                    ng-click="removeSongFromPlaylist(song, list_id)">
                    <span class="icon li-del" />
                  </a>
                  <a v-show="song.options" :title="t('_ORIGIN_LINK')" class="source-button" @click="openUrl(song.source_url)"><span class="icon li-link" /></a>
                </div>
              </li>
            </template>
            <template v-if="condition.searchType === 1">
              <li v-for="playlist in result.tracks" :key="playlist.id" ng-class-odd="'odd'" ng-class-even="'even'" class="playlist-result">
                <div class="title">
                  <a @click="$router.push(`/playlist/${playlist.id}`)">
                    <img :src="playlist.img_url" err-src="https://y.gtimg.cn/mediastyle/global/img/playlist_300.png" />
                    <div>
                      {{ playlist.title }}
                      <!-- <span ng-if="isActiveTab('allmusic')" class="source playlist">{{playlist.sourceName}}</span> -->
                    </div>
                  </a>
                </div>
                <div class="artist">{{ playlist.author }}</div>
                <div class="album">{{ playlist.count }}</div>
              </li>
            </template>
          </ul>
          <div v-show="result.totalpage > 1" class="search-pagination">
            <button class="btn btn-sm btn-pagination" :disabled="condition.curpage == 1" @click="changeSearchPage(-1)">上一页</button>
            <label>{{ condition.curpage }}/{{ result.totalpage }} 页</label>
            <button class="btn btn-sm btn-pagination" :disabled="condition.curpage == result.totalpage" @click="changeSearchPage(1)">下一页</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, toRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import useSearch from '../composition/search';
import { l1Player } from '../services/l1_player';
import MediaService from '../services/MediaService';
import SourceTab from '../components/SourceTab.vue';

const showModal = inject('showModal');

const { t } = useI18n();
const { condition, result } = useSearch();

const changeSearchType = (newValue) => {
  condition.searchType = newValue;
  condition.curpage = 1;
};
const changeSourceTab = (newValue) => {
  condition.tab = newValue;
  condition.curpage = 1;
};
const changeSearchPage = (offset) => {
  condition.curpage += offset;
};
const play = (song) => {
  l1Player.addTrack(toRaw(song));
  l1Player.playById(song.id);
};
const openUrl = (url) => {
  window.open(url, '_blank').focus();
};
const sourceList = computed(() => [{ name: 'allmusic', displayId: '_ALL_MUSIC' }, ...MediaService.getSourceList()]);
</script>

<style></style>
