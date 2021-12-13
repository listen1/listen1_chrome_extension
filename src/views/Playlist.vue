<template>
  <div class="page">
    <div class="playlist-detail">
      <div class="detail-head flex">
        <div class="detail-head-cover w-48 mx-8 mt-8 mb-1">
          <img :src="cover_img_url" class="h-48 w-48" err-src="https://y.gtimg.cn/mediastyle/global/img/singer_300.png" />
        </div>
        <div class="detail-head-title flex-1">
          <h2 class="h-10 my-7 text-3xl font-semibold">{{ playlist_title }}</h2>
          <div class="playlist-button-list flex flex-wrap">
            <IconButton @click="playMylist(list_id)" icon="li-play-s" icon-class="text-important">
              <template v-slot:main>
                {{ t('_PLAY_ALL') }}
              </template>
              <template v-slot:right>
                <div class="add-list border-l border-button flex items-center justify-center w-8 hover:bg-button-hover" @click="addMylist(list_id)">
                  <span class="icon li-add" />
                </div>
              </template>
            </IconButton>
            <IconButton v-show="is_local" @click="addLocalMusic(list_id)" icon="li-songlist">{{ t('_ADD_LOCAL_SONGS') }}</IconButton>
            <IconButton v-show="!is_mine && !is_local" @click="saveAsMyPlaylist(list_id)" icon="li-songlist">{{ t('_ADD_TO_PLAYLIST') }}</IconButton>
            <IconButton
              v-show="is_mine && !is_local && list_id != 'myplaylist_redheart'"
              @click="showModal('EditPlaylist', { list_id: list_id, playlist_title: playlist_title, cover_img_url: cover_img_url })"
              icon="vue-feather-edit">
              {{ t('_EDIT') }}
            </IconButton>
            <IconButton
              v-show="!is_mine && !is_local"
              :icon-class="is_favorite ? 'filled-yellow' : ''"
              @click="favoritePlaylist(list_id)"
              icon="vue-feather-star">
              {{ t(is_favorite ? '_FAVORITED' : '_FAVORITE') }}
            </IconButton>

            <IconButton v-show="!is_mine && !is_local" @click="openUrl(playlist_source_url)" icon="li-link">
              {{ t('_ORIGIN_LINK') }}
            </IconButton>
            <IconButton v-show="is_mine" @click="showModal('ImportPlaylist', { list_id })" icon="vue-feather-git-merge">
              {{ t('_IMPORT') }}
            </IconButton>
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
        <li class="head border-t-2 border-b-2 border-transparent text-inactive -mb-2px group flex relative items-center px-6 h-12">
          <div class="title flex-2 truncate flex">
            <a>{{ t('_SONGS') + '(' + songs.length + ')' }}</a>
          </div>
          <div class="artist flex-1 truncate">
            <a>{{ t('_ARTISTS') }}</a>
          </div>
          <div class="album flex-1 truncate">
            <a>{{ t('_ALBUMS') }}</a>
          </div>
          <div class="tools flex items-center w-28">{{ t('_OPERATION') }}</div>
        </li>
        <DragDropZone
          v-for="(song, index) in songs"
          :key="song.id"
          :draggable="true"
          :class="{ 'bg-even': index % 2 === 0, 'bg-odd': index % 2 !== 0 }"
          class="flex relative items-center px-6 h-12 hover:bg-row-hover"
          :dragobject="song"
          :dragtitle="song.title"
          :sortable="is_mine || is_local"
          dragtype="application/listen1-song"
          @drop="onPlaylistSongDrop(list_id, song, $event)"
          @mouseenter="song.options = true"
          @mouseleave="song.options = undefined">
          <TrackRow :song="song" :is_local="is_local" :is_mine="is_mine" :list_id="list_id"></TrackRow>
        </DragDropZone>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { l1Player } from '../services/l1_player';
import { onMounted, inject, toRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import MediaService from '../services/MediaService';
import notyf from '../services/notyf';
import $event from '../services/EventService';
import DragDropZone from '../components/DragDropZone.vue';
import useRedHeart from '../composition/redheart';
import TrackRow from '../components/TrackRow.vue';
import IconButton from '../components/IconButton.vue';

const { t } = useI18n();

const route = useRoute();
const { addMyPlaylistByUpdateRedHeart } = useRedHeart();
let songs = $ref([]);
let cover_img_url = $ref('images/loading.svg');
let playlist_title = $ref('');
let playlist_source_url = $ref('');
let is_mine = $ref(false);
let is_local = $ref(false);
let list_id = $ref('');

let is_favorite = $ref(false);
const { listId } = route.params;

const refreshPlaylist = async () => {
  const data = await MediaService.getPlaylist(listId);
  if (data.status === '0') {
    notyf.info(data.reason);
    // this.popWindow();
    return;
  }
  songs = data.tracks;
  cover_img_url = data.info.cover_img_url;
  playlist_title = data.info.title;
  playlist_source_url = data.info.source_url;
  list_id = data.info.id;
  is_mine = data.info.id.slice(0, 2) === 'my';
  is_local = data.info.id.slice(0, 2) === 'lm';

  is_favorite = await MediaService.isMyPlaylist(data.info.id);
};
onMounted(async () => {
  await refreshPlaylist();
});

const playMylist = (listId) => {
  l1Player.playTracks(toRaw(songs));
  list_id = listId;
};
const openUrl = (url) => {
  window.open(url, '_blank').focus();
};
const favoritePlaylist = async (list_id) => {
  if (is_favorite) {
    await removeFavoritePlaylist(list_id);
    is_favorite = false;
  } else {
    await addFavoritePlaylist(list_id);
    is_favorite = true;
  }
};
const addFavoritePlaylist = async (list_id) => {
  await MediaService.clonePlaylist(list_id, 'favorite');
  notyf.success(t('_FAVORITE_PLAYLIST_SUCCESS'));
};
const removeFavoritePlaylist = async (list_id) => {
  await MediaService.removeMyPlaylist(list_id, 'favorite');
  notyf.success(t('_UNFAVORITE_PLAYLIST_SUCCESS'));
};
const saveAsMyPlaylist = async (list_id) => {
  await MediaService.clonePlaylist(list_id, 'my');
  notyf.success(t('_ADD_TO_PLAYLIST_SUCCESS'));
};

const onPlaylistSongDrop = async (list_id, song, event) => {
  const { data, dragType, direction } = event;

  if (dragType === 'application/listen1-song') {
    // insert song
    await MediaService.insertTrackToMyPlaylist(list_id, data, song, direction);
    await refreshPlaylist();
  }
};
const showModal = inject('showModal');
// TODO: avoid to use event bus to refresh state
// use global ref to keep more clear way to manage state
$event.on(`playlist:id:${listId}:update`, refreshPlaylist);

const addLocalMusic = (list_id) => {
  window.api.chooseLocalFile(list_id);
  window.api.ipcOnce('chooseLocalFile')(async (message) => {
    const { tracks } = message;
    await addMyPlaylistByUpdateRedHeart(list_id, tracks);
    await refreshPlaylist();
  });
};
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
