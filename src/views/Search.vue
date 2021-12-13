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

          <ul class="detail-songlist px-8">
            <li
              v-if="condition.searchType === 0"
              class="head border-t-2 border-b-2 border-transparent bg-inactive -mb-2px group flex relative items-center px-6 h-12">
              <div class="title flex-2 truncate flex">
                <a>{{ t('_SONGS') }}</a>
              </div>
              <div class="artist flex-1">
                <a>{{ t('_ARTISTS') }}</a>
              </div>
              <div class="album flex-1">
                <a>{{ t('_ALBUMS') }}</a>
              </div>
              <div class="tool flex items-center w-28">{{ t('_OPERATION') }}</div>
            </li>
            <li
              v-if="condition.searchType === 1"
              class="head border-t-2 border-b-2 border-transparent bg-inactive -mb-2px group flex relative items-center px-6 h-12">
              <div class="title flex-2 truncate flex">
                <a>{{ t('_PLAYLIST_TITLE') }}</a>
              </div>
              <div class="artist flex-1">
                <a>{{ t('_PLAYLIST_AUTHOR') }}</a>
              </div>
              <div class="album flex-1">
                <a>{{ t('_PLAYLIST_SONG_COUNT') }}</a>
              </div>
            </li>
            <template v-if="condition.searchType === 0">
              <li
                v-for="(song, index) in result.tracks"
                :key="song.id"
                :class="{ 'bg-even': index % 2 === 0, 'bg-odd': index % 2 !== 0 }"
                class="flex relative items-center px-6 h-12 hover:bg-row-hover"
                @mouseenter="song.options = true"
                @mouseleave="song.options = undefined">
                <TrackRow :song="song"></TrackRow>
              </li>
            </template>
            <template v-if="condition.searchType === 1">
              <li
                v-for="playlist in result.tracks"
                :key="playlist.id"
                :class="{ 'bg-even': index % 2 === 0, 'bg-odd': index % 2 !== 0 }"
                class="playlist-result flex relative items-center px-10 h-20 hover:bg-row-hover">
                <div class="title flex-2 truncate">
                  <a @click="$router.push(`/playlist/${playlist.id}`)" class="cursor-pointer flex">
                    <img class="h-16 w-16 block mr-3" :src="playlist.img_url" err-src="https://y.gtimg.cn/mediastyle/global/img/playlist_300.png" />
                    <div>
                      {{ playlist.title }}
                      <!-- <span ng-if="isActiveTab('allmusic')" class="source playlist">{{playlist.sourceName}}</span> -->
                    </div>
                  </a>
                </div>
                <div class="artist flex-1 truncate">{{ playlist.author }}</div>
                <div class="album flex-1 truncate">{{ playlist.count }}</div>
              </li>
            </template>
          </ul>
          <div v-show="result.totalpage > 1" class="search-pagination text-center p-4">
            <button class="btn btn-sm btn-pagination bg-button" :disabled="condition.curpage == 1" @click="changeSearchPage(-1)">上一页</button>
            <label class="mx-4">{{ condition.curpage }}/{{ result.totalpage }} 页</label>
            <button class="btn btn-sm btn-pagination bg-button" :disabled="condition.curpage == result.totalpage" @click="changeSearchPage(1)">下一页</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import SourceTab from '../components/SourceTab.vue';
import TrackRow from '../components/TrackRow.vue';
import useSearch from '../composition/search';
import MediaService from '../services/MediaService';

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

const sourceList = computed(() => [{ name: 'allmusic', displayId: '_ALL_MUSIC' }, ...MediaService.getSourceList()]);
</script>

<style>
ul.detail-songlist li a span.source {
  border: solid 1px #ccc;
  border-radius: 4px;
  margin-right: 10px;
  display: inline-block;
  padding: 0 4px;
  color: #ccc;
  font-size: 12px;
  width: 24px;
  text-align: center;
}
ul.detail-songlist li a span.source.playlist {
  margin-left: 10px;
  margin-right: 0;
}
</style>
