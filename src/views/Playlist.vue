<template>
  <div class="page">
    <div class="playlist-detail">
      <div class="detail-head flex">
        <div class="detail-head-cover mx-8 mb-1 mt-8 w-52">
          <img :src="cover_img_url" class="w-52 rounded border-[0.5px] border-default" err-src="https://y.gtimg.cn/mediastyle/global/img/singer_300.png" />
        </div>
        <div class="detail-head-title flex-1">
          <h2 class="mb-4 mt-7 h-10 text-3xl font-semibold">{{ playlist_title }}</h2>
          <div class="playlist-button-list flex flex-wrap">
            <IconButton icon="li-play-s" icon-class="text-important" @click="playMylist()">
              <template #main>
                {{ t('_PLAY_ALL') }}
              </template>
              <template #right>
                <div class="add-list flex w-8 items-center justify-center rounded-r border-l border-button hover:bg-button-hover" @click="addMylist(listId)">
                  <span class="icon li-add" />
                </div>
              </template>
            </IconButton>
            <IconButton v-show="is_local" icon="li-songlist" @click="addLocalMusic(listId)">{{ t('_ADD_LOCAL_SONGS') }}</IconButton>
            <IconButton v-show="!is_mine && !is_local" icon="li-songlist" @click="saveAsMyPlaylist(listId)">{{ t('_ADD_TO_PLAYLIST') }}</IconButton>
            <IconButton
              v-show="is_mine && !is_local && listId != 'myplaylist_redheart'"
              icon="vue-feather-edit"
              @click="showModal('EditPlaylist', { list_id: listId, playlist_title: playlist_title, cover_img_url: cover_img_url })">
              {{ t('_EDIT') }}
            </IconButton>
            <IconButton
              v-show="!is_mine && !is_local"
              :icon-class="is_favorite ? 'filled-yellow' : ''"
              icon="vue-feather-star"
              @click="favoritePlaylist(listId)">
              {{ t(is_favorite ? '_FAVORITED' : '_FAVORITE') }}
            </IconButton>

            <IconButton v-show="!is_mine && !is_local" icon="li-link" @click="openUrl(playlist_source_url)">
              {{ t('_ORIGIN_LINK') }}
            </IconButton>
            <IconButton v-show="is_mine" icon="vue-feather-git-merge" @click="showModal('ImportPlaylist', { list_id: listId })">
              {{ t('_IMPORT') }}
            </IconButton>
          </div>
          <h3 v-if="!showMore" class="mb-2 max-h-36 max-w-2xl overflow-hidden whitespace-pre-line text-sm">
            {{ description.slice(0, MAX_BRIEF_LENGTH) }}
            <span v-if="description.length > MAX_BRIEF_LENGTH">...</span>
          </h3>
          <h3 v-if="showMore" class="mb-2 max-w-2xl whitespace-pre-line text-sm">{{ description }}</h3>
          <div v-if="description.length > MAX_BRIEF_LENGTH" class="max-w-2xl">
            <a class="flex cursor-pointer justify-end" @click="showMore = !showMore">
              <div class="flex items-center text-sm">
                <div v-if="!showMore">展开</div>
                <div v-if="showMore">收起</div>
                <vue-feather size="1.25rem" :type="showMore ? 'chevron-up' : 'chevron-down'" stroke="#cccccc" />
              </div>
            </a>
          </div>
        </div>
      </div>

      <ul class="detail-songlist px-8 pb-10">
        <!-- <div class="playlist-search">
          <svg class="feather playlist-search-icon">
            <use href="#search" />
          </svg>
          <svg class="feather playlist-clear-icon" ng-show="playlistFilter.key!=''" ng-click="clearFilter()">
            <use href="#x" />
          </svg>
          <input class="playlist-search-input" type="text" ng-model="playlistFilter.key" :placeholder="$t('_SEARCH_PLAYLIST')" />
        </div>-->
        <li class="head -mb-2px group relative flex h-12 items-center border-b-2 border-t-2 border-transparent px-6 text-inactive">
          <div class="w-8 flex-none">
            <span>No.</span>
          </div>
          <div class="title flex flex-2 truncate">
            <div class="mx-4 w-5 flex-none"></div>
            <a>{{ t('_SONGS') + '(' + songs.length + ')' }}</a>
          </div>
          <div class="artist flex-1 truncate">
            <a>{{ t('_ARTISTS') }}</a>
          </div>
          <div class="album flex-1 truncate">
            <a>{{ t('_ALBUMS') }}</a>
          </div>
          <div class="tools flex w-28 items-center">{{ t('_OPERATION') }}</div>
        </li>
        <DragDropZone
          v-for="(song, index) in songs"
          :key="song.id"
          :draggable="true"
          :class="{ 'bg-even': index % 2 === 0, 'bg-odd': index % 2 !== 0 }"
          class="relative flex h-12 items-center px-6 hover:bg-row-hover"
          :dragobject="song"
          :dragtitle="song.title"
          :sortable="is_mine || is_local"
          dragtype="application/listen1-song"
          @drop="onPlaylistSongDrop(listId, song, $event)"
          @mouseenter="song.options = true"
          @mouseleave="song.options = undefined">
          <TrackRow :index="index" :song="song" :is-local="is_local" :is-mine="is_mine" :list-id="listId"></TrackRow>
        </DragDropZone>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, onMounted, toRaw, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import DragDropZone from '../components/DragDropZone.vue';
import IconButton from '../components/IconButton.vue';
import TrackRow from '../components/TrackRow.vue';
import useRedHeart from '../composition/redheart';
import $event from '../services/EventService';
import { l1Player } from '../services/l1_player';
import MediaService from '../services/MediaService';
import notyf from '../services/notyf';

const { t } = useI18n();
const route = useRoute();
const { addMyPlaylistByUpdateRedHeart } = useRedHeart();

let listId = $ref('');
let is_mine = computed(() => listId && listId.slice(0, 2) === 'my');
let is_local = computed(() => listId && listId.slice(0, 2) === 'lm');

let songs = $ref([]);
let cover_img_url = $ref('images/loading.svg');
let playlist_title = $ref('');
let playlist_source_url = $ref('');
let is_favorite = $ref(false);
let description = $ref('');
const MAX_BRIEF_LENGTH = 120;
let showMore = $ref(false);

const refreshPlaylist = async () => {
  const data = await MediaService.getPlaylist(listId);
  if (data.status === '0') {
    notyf.info(data.reason);
    return;
  }
  songs = data.tracks;
  cover_img_url = data.info.cover_img_url;
  playlist_title = data.info.title;
  playlist_source_url = data.info.source_url;
  description = data.info.description || '';
};

onMounted(async () => {
  listId = route.params.listId;
  is_favorite = await MediaService.isMyPlaylist(listId);
  await refreshPlaylist();
});

const playMylist = () => {
  //@ts-ignore not assignable error?
  l1Player.playTracks(toRaw(songs));
};

const openUrl = (url) => {
  window.open(url, '_blank')?.focus();
};

const favoritePlaylist = async (listId) => {
  if (is_favorite) {
    await removeFavoritePlaylist(listId);
    is_favorite = false;
  } else {
    await addFavoritePlaylist(listId);
    is_favorite = true;
  }
};

const addFavoritePlaylist = async (listId) => {
  await MediaService.clonePlaylist(listId, 'favorite');
  notyf.success(t('_FAVORITE_PLAYLIST_SUCCESS'));
};

const removeFavoritePlaylist = async (listId) => {
  await MediaService.removeMyPlaylist(listId, 'favorite');
  notyf.success(t('_UNFAVORITE_PLAYLIST_SUCCESS'));
};

const saveAsMyPlaylist = async (listId) => {
  await MediaService.clonePlaylist(listId, 'my');
  notyf.success(t('_ADD_TO_PLAYLIST_SUCCESS'));
};

const onPlaylistSongDrop = async (listId, song, event) => {
  const { data, dragType, direction } = event;

  if (dragType === 'application/listen1-song') {
    // insert song
    await MediaService.insertTrackToMyPlaylist(listId, data, song, direction);
    await refreshPlaylist();
  }
};

const showModal = inject('showModal');
// TODO: avoid to use event bus to refresh state
// use global ref to keep more clear way to manage state
$event.on(`playlist:id:${listId}:update`, refreshPlaylist);

const addLocalMusic = (listId) => {
  window.api.chooseLocalFile(listId);
  window.api.ipcOnce('chooseLocalFile')(async (message) => {
    const { tracks } = message;
    await addMyPlaylistByUpdateRedHeart(listId, tracks);
    await refreshPlaylist();
  });
};

watch(
  () => route.path,
  async () => {
    listId = route.params.listId;
    is_favorite = await MediaService.isMyPlaylist(listId);
    await refreshPlaylist();
  }
);
</script>
<style>
/* 

ul.detail-songlist .playlist-search {
  position: absolute;
  right: 0;
  top: -30px;
}
ul.detail-songlist .playlist-search .playlist-search-icon {
  width: 14px;
  position: absolute;
  left: 7px;
  top: 1px;
}
ul.detail-songlist .playlist-search .playlist-clear-icon {
  width: 14px;
  position: absolute;
  left: 158px;
}
ul.detail-songlist .playlist-search .playlist-search-input {
  margin-right: 28px;
  margin-bottom: 10px;
  border: none;
  height: 24px;
  border-radius: 12px;
  padding: 0 30px;
  background: var(--content-background-color);
  color: #bbbbbb;
  width: 120px;
}
ul.detail-songlist .playlist-search .playlist-search-input:hover {
  background-color: var(--songlist-odd-background-color);
}
ul.detail-songlist .playlist-search .playlist-search-input::placeholder {
  color: #bbbbbb;
} */
</style>
