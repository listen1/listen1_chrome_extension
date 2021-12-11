<template>
  <div class="sidebar flex flex-col bg-sidebar flex-none w-56 pl-3">
    <div class="flex-scroll-wrapper">
      <div class="app-region-drag h-12" />
      <SidebarTitle :text="t('_PLATFORM_UNION')"></SidebarTitle>
      <ul>
        <li :class="{ active: $route.name === 'HotPlaylists' }" class="group cursor-pointer" @click="$router.push('/')">
          <SidebarEntry :text="t('_PLAYLISTS')" icon="li-featured-list"></SidebarEntry>
        </li>
      </ul>
      <div v-if="!isChrome || is_login('netease') || is_login('qq')" class="group">
        <SidebarTitle :text="t('_MY_MUSIC')"></SidebarTitle>
      </div>
      <ul>
        <li
          v-if="isElectron()"
          @click="$router.push('/playlist/lmplaylist_reserve')"
          :class="{ active: route.path === '/playlist/lmplaylist_reserve' }"
          class="group">
          <SidebarEntry :text="t('_LOCAL_MUSIC')" icon="li-featured-list"></SidebarEntry>
        </li>
        <li v-if="is_login('netease')" @click="$router.push(`/my_platform/netease`)" :class="{ active: route.path === `/my_platform/netease` }" class="group">
          <SidebarEntry :text="t('_MY_NETEASE')" icon="vue-feather-globe"></SidebarEntry>
        </li>
        <li v-if="is_login('qq')" @click="$router.push(`/my_platform/qq`)" :class="{ active: route.path === `/my_platform/qq` }" class="group">
          <SidebarEntry :text="t('_MY_QQ')" icon="vue-feather-globe"></SidebarEntry>
        </li>
      </ul>
      <SidebarTitle :text="t('_CREATED_PLAYLIST')">
        <template v-slot:right><vue-feather size="1.25rem" type="plus-square" @click="showModal('ParseUrl', {})" /></template>
      </SidebarTitle>
      <ul>
        <DragDropZone
          v-for="(i, index) in myplaylists"
          :key="index"
          :class="{ active: route.path === `/playlist/${i.id}` }"
          class="cursor-pointer"
          :draggable="i.id !== 'myplaylist_redheart'"
          :dragobject="i"
          :dragtitle="i.title"
          :sortable="i.id !== 'myplaylist_redheart'"
          dragtype="application/listen1-myplaylist"
          @drop="onSidebarPlaylistDrop('my', i.id, $event)"
          @click="$router.push(`/playlist/${i.id}`)">
          <SidebarEntry v-if="i.id !== 'myplaylist_redheart'" :text="i.title" icon="vue-feather-disc"></SidebarEntry>
          <SidebarEntry v-if="i.id === 'myplaylist_redheart'" :text="i.title" icon="vue-feather-heart"></SidebarEntry>
        </DragDropZone>
      </ul>

      <SidebarTitle :text="t('_FAVORITED_PLAYLIST')"></SidebarTitle>

      <ul>
        <DragDropZone
          v-for="(i, index) in favoriteplaylists"
          :key="index"
          :draggable="true"
          :class="{ active: route.path === `/playlist/${i.id}` }"
          :dragobject="i"
          :dragtitle="i.title"
          :sortable="true"
          dragtype="application/listen1-favoriteplaylist"
          @click="$router.push(`/playlist/${i.id}`)"
          @drop="onSidebarPlaylistDrop('favorite', i.id, $event)">
          <SidebarEntry :text="i.title" icon="vue-feather-disc"></SidebarEntry>
        </DragDropZone>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, inject } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Playlist } from '../services/DBService';
import $event from '../services/EventService';
import MediaService from '../services/MediaService';
import DragDropZone from '../components/DragDropZone.vue';
import notyf from '../services/notyf';
import useAuth from '../composition/auth';
import useRedHeart from '../composition/redheart';
import { isElectron } from '../provider/lowebutil';
import SidebarEntry from '../components/SidebarEntry.vue';
import SidebarTitle from '../components/SidebarTitle.vue';

import { useRoute } from 'vue-router';
const isChrome = true;
const route = useRoute();
const { t } = useI18n();
const { is_login } = useAuth();

let favoriteplaylists: any = $ref<Playlist[]>([]);
let myplaylists: any = $ref<unknown[]>([]);

const refreshFav = () => {
  MediaService.showFavPlaylist().then((res) => (favoriteplaylists = res));
};
const refreshMy = () => {
  MediaService.showMyPlaylist().then((res) => (myplaylists = res));
};
const onSidebarPlaylistDrop = async (playlistType: string, list_id: string, event: any) => {
  const { data, dragType, direction } = event;

  if (playlistType === 'my' && dragType === 'application/listen1-song') {
    const { addMyPlaylistByUpdateRedHeart } = useRedHeart();
    await addMyPlaylistByUpdateRedHeart(list_id, [data]);
    notyf.success(t('_ADD_TO_PLAYLIST_SUCCESS'));
  } else if (
    (playlistType === 'my' && dragType === 'application/listen1-myplaylist') ||
    (playlistType === 'favorite' && dragType === 'application/listen1-favoriteplaylist')
  ) {
    if (list_id === 'myplaylist_redheart' || data.id === 'myplaylist_redheart') {
      return;
    }
    await MediaService.reorderMyplaylist(playlistType, data.id, list_id, direction);
    if (playlistType === 'my') {
      refreshMy();
    }
    if (playlistType === 'favorite') {
      refreshFav();
    }
  }
};
onMounted(() => {
  refreshMy();
  refreshFav();
});
const showModal: any = inject('showModal');

$event.on('playlist:favorite:update', refreshFav);
$event.on('playlist:my:update', refreshMy);
</script>
<style>
.sidebar ul li.active .sidebar-block,
.sidebar ul li.active:hover .sidebar-block,
.sidebar ul li.dragover .sidebar-block {
  background: var(--sidebar-highlight-background-color);
  color: var(--sidebar-highlight-text-color);
}
/*
avoid hover effect trigger dragleave event
https://stackoverflow.com/questions/19889615/can-an-angular-directive-pass-arguments-to-functions-in-expressions-specified-in
*/
.sidebar ul li * {
  pointer-events: none;
}
</style>
