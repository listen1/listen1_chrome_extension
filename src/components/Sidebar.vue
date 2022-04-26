<template>
  <div class="sidebar flex w-56 flex-none flex-col bg-sidebar pl-3">
    <div class="flex-scroll-wrapper flex-1 overflow-y-scroll">
      <div class="app-region-drag h-12" />
      <SidebarTitle :text="t('_PLATFORM_UNION')"></SidebarTitle>
      <ul>
        <li :class="{ active: $route.name === 'HotPlaylists' }" class="group cursor-pointer" @click="$router.push('/')">
          <SidebarEntry :text="t('_PLAYLISTS')" icon="li-featured-list"></SidebarEntry>
        </li>
      </ul>
      <div v-if="!isChrome || is_login('netease') || is_login('qq')" class="group">
        <SidebarTitle class="mt-4" :text="t('_MY_MUSIC')"></SidebarTitle>
      </div>
      <ul>
        <li
          v-if="isElectron()"
          :class="{ active: route.path === '/playlist/lmplaylist_reserve' }"
          class="group cursor-pointer pb-[2px]"
          @click="$router.push('/playlist/lmplaylist_reserve')">
          <SidebarEntry :text="t('_LOCAL_MUSIC')" icon="vue-feather-monitor"></SidebarEntry>
        </li>
        <li
          v-if="is_login('netease')"
          :class="{ active: route.path === `/my_platform/netease` }"
          class="group cursor-pointer pb-[2px]"
          @click="$router.push(`/my_platform/netease`)">
          <SidebarEntry :text="t('_MY_NETEASE')" icon="vue-feather-globe"></SidebarEntry>
        </li>
        <li
          v-if="is_login('qq')"
          :class="{ active: route.path === `/my_platform/qq` }"
          class="group cursor-pointer pb-[2px]"
          @click="$router.push(`/my_platform/qq`)">
          <SidebarEntry :text="t('_MY_QQ')" icon="vue-feather-globe"></SidebarEntry>
        </li>
      </ul>
      <SidebarTitle class="mt-4" :text="t('_CREATED_PLAYLIST')">
        <template #right><vue-feather class="cursor-pointer" size="1.25rem" type="plus-square" @click="showModal('ParseUrl', {})" /></template>
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

      <SidebarTitle class="mt-4" :text="t('_FAVORITED_PLAYLIST')"></SidebarTitle>

      <ul>
        <DragDropZone
          v-for="(i, index) in favoriteplaylists"
          :key="index"
          :draggable="true"
          :class="{ active: route.path === `/playlist/${i.id}` }"
          class="cursor-pointer"
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
import { inject, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import DragDropZone from '../components/DragDropZone.vue';
import SidebarEntry from '../components/SidebarEntry.vue';
import SidebarTitle from '../components/SidebarTitle.vue';
import useAuth from '../composition/auth';
import useRedHeart from '../composition/redheart';
import type { Playlist } from '../services/DBService';
import $event from '../services/EventService';
import MediaService from '../services/MediaService';
import notyf from '../services/notyf';
import { isElectron } from '../utils';
import Entry from './Entry.vue';

const isChrome = !isElectron();
const route = useRoute();
const { t } = useI18n();
const { is_login } = useAuth();

let favoriteplaylists = $ref<Playlist[]>([]);
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
