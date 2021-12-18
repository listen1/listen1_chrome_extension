<template>
  <div class="title flex-2 flex overflow-hidden items-center max-h-12">
    <!-- <a class="disabled" ng-if="song.disabled" ng-click="copyrightNotice()"> song.title </a> -->
    <vue-feather
      class="cursor-pointer flex-none"
      v-if="!isRedHeart(song.id)"
      type="heart"
      size="18"
      stroke-width="1"
      stroke="#666666"
      @click="setRedHeart(toRaw(song), true)" />
    <vue-feather
      class="cursor-pointer flex-none"
      v-if="isRedHeart(song.id)"
      type="heart"
      fill="red"
      stroke="red"
      size="18"
      @click="setRedHeart(toRaw(song), false)" />

    <a @click="play(song)" class="cursor-pointer ml-3 truncate flex-1 min-w-0">{{ song.title }}</a>
  </div>
  <div class="artist flex-1 truncate">
    <a class="cursor-pointer" @click="$router.push(`/playlist/${song.artist_id}`)">{{ song.artist }}</a>
  </div>
  <div class="album flex-1 truncate">
    <a class="cursor-pointer" @click="$router.push(`/playlist/${song.album_id}`)">{{ song.album }}</a>
  </div>
  <div class="tools w-28 flex items-center">
    <a v-show="song.options" :title="t('_ADD_TO_QUEUE')" class="detail-add-button cursor-pointer mr-3" @click="addToPlay(song)"><span class="icon li-add" /></a>
    <a
      v-show="song.options"
      :title="t('_ADD_TO_PLAYLIST')"
      class="detail-fav-button cursor-pointer mr-3"
      @click="showModal('AddToPlaylist', { tracks: [song] })">
      <span class="icon li-songlist" />
    </a>
    <a
      v-show="song.options && (is_mine == '1' || is_local)"
      :title="t('_REMOVE_FROM_PLAYLIST')"
      class="detail-delete-button cursor-pointer mr-3"
      @click="removeSongFromPlaylist(song.id, list_id)">
      <span class="icon li-del" />
    </a>
    <a v-show="song.options && !is_local" :title="t('_ORIGIN_LINK')" class="source-button cursor-pointer mr-3" @click="openUrl(song.source_url)">
      <span class="icon li-link" />
    </a>
  </div>
</template>
<script setup lang="ts">
const { song, is_mine, is_local, list_id } = defineProps<{
  song: any;
  is_mine?: string;
  is_local?: string;
  list_id?: string;
}>();
import { inject, toRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import useRedHeart from '../composition/redheart';
import { l1Player } from '../services/l1_player';
import notyf from '../services/notyf';

const { isRedHeart, setRedHeart, removeTrackFromMyPlaylistByUpdateRedHeart } = useRedHeart();

const showModal = inject('showModal') as CallableFunction;

const { t } = useI18n();

const play = (song: any) => {
  l1Player.addTrack(toRaw(song));
  l1Player.playById(song.id);
};
const openUrl = (url: string) => {
  window.open(url, '_blank')?.focus();
};
const addToPlay = (song: any) => {
  l1Player.addTrack(toRaw(song));
  notyf.success(t('_ADD_TO_QUEUE_SUCCESS'));
};
const removeSongFromPlaylist = async (track_id: string, list_id?: string) => {
  if (!list_id) {
    return;
  }
  await removeTrackFromMyPlaylistByUpdateRedHeart(track_id, list_id);
  notyf.success(t('_REMOVE_SONG_FROM_PLAYLIST_SUCCESS'));
};
</script>
