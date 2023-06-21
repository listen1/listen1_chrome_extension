<template>
  <!-- content page: 快速搜索 -->
  <div class="page">
    <div class="site-wrapper-innerd">
      <div class="cover-container">
        <div class="searchbox">
          <SourceTab class="px-10" :tab="condition.tab" :sources="sourceList" :loading="result.loading" @click="changeSourceTab">
            <template #right>
              <div class="search-type float-right">
                <li
                  class="source-button inline-block cursor-pointer border-b hover:border-active hover:text-default"
                  :class="{ 'border-active': condition.searchType === 0, 'border-transparent text-inactive': condition.searchType !== 0 }"
                  @click="changeSearchType(0)">
                  <a>单曲</a>
                </li>
                <div class="splitter mx-3 -mb-0.5 inline-block h-4 w-px bg-neutral-400" />
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
              class="head bg-inactive -mb-2px group relative flex h-12 items-center border-b-2 border-t-2 border-transparent px-6">
              <div class="title flex flex-2 truncate">
                <a>{{ t('_SONGS') }}</a>
              </div>
              <div class="artist flex-1">
                <a>{{ t('_ARTISTS') }}</a>
              </div>
              <div class="album flex-1">
                <a>{{ t('_ALBUMS') }}</a>
              </div>
              <div class="tool flex w-28 items-center">{{ t('_OPERATION') }}</div>
            </li>
            <li
              v-if="condition.searchType === 1"
              class="head bg-inactive -mb-2px group relative flex h-12 items-center border-b-2 border-t-2 border-transparent px-6">
              <div class="title flex flex-2 truncate">
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
                class="relative flex h-12 items-center px-6 hover:bg-row-hover"
                @mouseenter="song.options = true"
                @mouseleave="song.options = undefined">
                <TrackRow :index="index" :song="song"></TrackRow>
              </li>
            </template>
            <template v-if="condition.searchType === 1">
              <li
                v-for="(playlist, index) in result.tracks"
                :key="playlist.id"
                :class="{ 'bg-even': index % 2 === 0, 'bg-odd': index % 2 !== 0 }"
                class="playlist-result relative flex h-20 items-center px-10 hover:bg-row-hover">
                <div class="title flex-2 truncate">
                  <a class="flex cursor-pointer" @click="$router.push(`/playlist/${playlist.id}`)">
                    <img class="mr-3 block h-16 w-16" :src="playlist.img_url" err-src="https://y.gtimg.cn/mediastyle/global/img/playlist_300.png" />
                    <div>
                      {{ playlist.title }}
                      <span v-if="isAllMusic" class="text-ms mr-3 w-6 rounded border border-solid border-gray-500 px-1 text-center text-gray-500">
                        {{ playlist.source }}
                      </span>
                    </div>
                  </a>
                </div>
                <div class="artist flex-1 truncate">{{ playlist.author }}</div>
                <div class="album flex-1 truncate">{{ playlist.count }}</div>
              </li>
            </template>
          </ul>
          <div v-show="result.totalpage > 1" class="search-pagination p-4 text-center">
            <button class="btn btn-sm btn-pagination bg-button" :disabled="condition.curpage == 1" @click="changeSearchPage(-1)">上一页</button>
            <label class="mx-4">{{ condition.curpage }}/{{ result.totalpage }} 页</label>
            <button class="btn btn-sm btn-pagination bg-button" :disabled="condition.curpage == result.totalpage" @click="changeSearchPage(1)">下一页</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import SourceTab from '../components/SourceTab.vue';
import TrackRow from '../components/TrackRow.vue';
import useSearch from '../composition/search';
import MediaService from '../services/MediaService';

const { t } = useI18n();
const { condition, result } = useSearch();

const changeSearchType = (newValue: number) => {
  condition.searchType = newValue;
  condition.curpage = 1;
};
const changeSourceTab = (newValue: string) => {
  condition.tab = newValue;
  condition.curpage = 1;
};
const changeSearchPage = (offset: number) => {
  condition.curpage += offset;
};

const sourceList = computed(() => [{ name: 'allmusic', displayId: '_ALL_MUSIC' }, ...MediaService.getSourceList().filter((source) => source.searchable)]);
const isAllMusic = computed(() => condition.tab === 'allmusic');
</script>
