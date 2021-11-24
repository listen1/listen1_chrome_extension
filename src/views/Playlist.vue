<template>
  <div class="page">
    <div class="playlist-detail">
      <div class="detail-head">
        <div class="detail-head-cover">
          <img
            :src="cover_img_url"
            err-src="https://y.gtimg.cn/mediastyle/global/img/singer_300.png"
          />
        </div>
        <div class="detail-head-title">
          <h2>{{ playlist_title }}</h2>
          <div class="playlist-button-list">
            <div class="playlist-button playadd-button">
              <div class="play-list" @click="playMylist(list_id)">
                <span class="icon li-play-s" />
                {{ t('_PLAY_ALL') }}
              </div>
              <!-- <div class="add-list" ng-click="addMylist(list_id)">
                <span class="icon li-add" />
              </div>-->
            </div>
            <!-- <div v-show="is_local" class="playlist-button clone-button" ng-click="addLocalMusic(list_id)">
              <div class="play-list">
                <span class="icon li-songlist" />
                <span>{{ $t('_ADD_LOCAL_SONGS') }}</span>
              </div>
            </div>-->
            <div v-show="!is_mine && !is_local" class="playlist-button clone-button" @click="saveAsMyPlaylist(list_id)">
              <div class="play-list">
                <span class="icon li-songlist" />
                <span>{{ t('_ADD_TO_PLAYLIST') }}</span>
              </div>
            </div>
            <div
              v-show="is_mine && !is_local"
              class="playlist-button edit-button"
              @click="showModal('EditPlaylist', {list_id: list_id, playlist_title: playlist_title, cover_img_url: cover_img_url})"
            >
              <div class="play-list">
                <vue-feather type="edit" />
                <span>{{ t('_EDIT') }}</span>
              </div>
            </div>
            <div v-show="!is_mine && !is_local" class="playlist-button fav-button" @click="favoritePlaylist(list_id)">
              <div class="play-list" :class="{'favorited':is_favorite,'notfavorite':!is_favorite}">
                <vue-feather type="star"></vue-feather>
                <span>{{ t(is_favorite ? '_FAVORITED' : '_FAVORITE') }}</span>
              </div>
            </div>
            <div
              v-show="isChrome && is_favorite && !is_local"
              class="playlist-button edit-button"
              @click="closeWindow();showPlaylist(list_id)"
            >
              <div class="play-list">
                <span class="icon li-loop" />
                <span>{{ t('_REFRESH_PLAYLIST') }}</span>
              </div>
            </div>
            <div
              v-show="!is_mine && !is_local"
              class="playlist-button edit-button"
              @click="openUrl(playlist_source_url)"
            >
              <div class="play-list">
                <span class="icon li-link" />
                <span>{{ t('_ORIGIN_LINK') }}</span>
              </div>
            </div>
            <div
              v-show="is_mine && !is_local"
              class="playlist-button edit-button"
              @click="showModal('ImportPlaylist', {list_id})"
            >
              <div class="play-list">
                 <vue-feather type="git-merge" />
                <span>{{ t('_IMPORT') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ul class="detail-songlist">
        <!-- <div class="playlist-search">
          <svg class="feather playlist-search-icon">
            <use href="#search" />
          </svg>
          <svg class="feather playlist-clear-icon" ng-show="playlistFilter.key!=''" ng-click="clearFilter()">
            <use href="#x" />
          </svg>
          <input class="playlist-search-input" type="text" ng-model="playlistFilter.key" :placeholder="$t('_SEARCH_PLAYLIST')" />
        </div>-->
        <li class="head">
          <div class="title">
            <a>{{ t('_SONGS') + '(' + songs.length + ')' }}</a>
          </div>
          <div class="artist">
            <a>{{ t('_ARTISTS') }}</a>
          </div>
          <div class="album">
            <a>{{ t('_ALBUMS') }}</a>
          </div>
          <div class="tools">{{ t('_OPERATION') }}</div>
        </li>
        <li
          v-for="(song,index) in songs"
          :key="song.id"
          :class="{'even': index % 2 === 0, 'odd': index % 2 !== 0 }"
          draggable="true"
          drag-drop-zone
          drag-zone-object="song"
          drag-zone-title="song.title"
          sortable="is_mine || is_local"
          drag-zone-type="'application/listen1-song'"
          drop-zone-ondrop="onPlaylistSongDrop(list_id, song, arg1, arg2, arg3)"
          @mouseenter="song.options = true"
          @mouseleave="song.options = undefined"
        >
          <div class="title">
            <!-- <a class="disabled" ng-if="song.disabled" ng-click="copyrightNotice()"> song.title </a> -->
            <a add-and-play="song" @click="play(song)">{{ song.title }}</a>
          </div>
          <div class="artist">
            <a @click="showPlaylist(song.artist_id)">{{ song.artist }}</a>
          </div>
          <div class="album">
            <a @click="showPlaylist(song.album_id)">{{ song.album }}</a>
          </div>
          <div class="tools">
            <!-- <a v-show="song.options" title="_ADD_TO_QUEUE" class="detail-add-button" add-without-play="song"><span class="icon li-add" /></a> -->
            <a v-show="song.options" :title="t('_ADD_TO_PLAYLIST')" class="detail-fav-button" @click="showModal('AddToPlaylist', { tracks: [song] })"><span class="icon li-songlist" /></a>
            <!-- <a
              v-show="song.options && (is_mine == '1' || is_local)"
              title="_REMOVE_FROM_PLAYLIST"
              class="detail-delete-button"
              ng-click="removeSongFromPlaylist(song, list_id)"
            >
              <span class="icon li-del" />
            </a>-->
            <a
              v-show="song.options && !is_local"
              :title="t('_ORIGIN_LINK')"
              class="source-button"
              @click="openUrl(song.source_url)"
            >
              <span class="icon li-link" />
            </a>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
/* eslint-disable @typescript-eslint/no-unused-vars */

import { l1Player } from '../services/l1_player';
import { onMounted, inject } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import MediaService from '../services/MediaService';
import notyf from '../services/notyf';
import $event from '../services/EventService';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
let songs = $ref([]);
let cover_img_url = $ref('images/loading.svg');
let playlist_title = $ref('');
let playlist_source_url = $ref('');
let is_mine = $ref(false);
let is_local = $ref(false);
let list_id = $ref('');
let window_type = $ref('list');
const isChrome = true;
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

  window_type = 'list';
};
onMounted(async () => {
  await refreshPlaylist();
});
const play = (song) => {
  l1Player.addTrack(song);
  l1Player.playById(song.id);
};
const playMylist = (listId) => {
  l1Player.setNewPlaylist(songs);
  l1Player.play();
  list_id = listId;
};
const showPlaylist = (playlistId) => {
  router.push('/playlist/' + playlistId);
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
const showModal = inject('showModal');

// TODO: avoid to use event bus to refresh state
// use global ref to keep more clear way to manage state
$event.on(`playlist:id:${listId}:update`, refreshPlaylist);
</script>

<style>
</style>