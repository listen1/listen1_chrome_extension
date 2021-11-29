<template>
  <div class="sidebar">
    <div class="flex-scroll-wrapper">
      <div class="menu-control" />
      <div class="menu-title">
        <div class="title">{{ t('_PLATFORM_UNION') }}</div>
      </div>
      <ul class="nav masthead-nav">
        <li :class="{ active: $route.name === 'HotPlaylists' }" @click="$router.push('/')">
          <div class="sidebar-block">
            <span class="icon li-featured-list" />
            <a>{{ t('_PLAYLISTS') }}</a>
          </div>
        </li>
      </ul>
      <div v-if="!isChrome || is_login('netease') || is_login('qq')" class="menu-title">
        <div class="title">{{ t('_MY_MUSIC') }}</div>
      </div>
      <ul class="nav masthead-nav">
        <li
          v-if="isElectron()"
          @click="$router.push('/playlist/lmplaylist_reserve')"
          :class="{ active: route.path === '/playlist/lmplaylist_reserve' }"
        >
          <div class="sidebar-block">
            <span class="icon li-featured-list" />
            <a>{{ t('_LOCAL_MUSIC') }}</a>
          </div>
        </li>
        <li
          v-if="is_login('netease')"
          @click="$router.push(`/my_platform/netease`)"
          :class="{ active: route.path === `/my_platform/netease` }"
        >
          <div class="sidebar-block">
            <vue-feather type="globe" />
            <a>{{ t('_MY_NETEASE') }}</a>
          </div>
        </li>
        <li
          v-if="is_login('qq')"
          @click="$router.push(`/my_platform/qq`)"
          :class="{ active: route.path === `/my_platform/qq` }"
        >
          <div class="sidebar-block">
            <vue-feather type="globe" />
            <a>{{ t('_MY_QQ') }}</a>
          </div>
        </li>
      </ul>
      <div class="menu-title">
        <div class="title">{{ t('_CREATED_PLAYLIST') }}</div>
        <vue-feather type="plus-square" @click="showModal('ParseUrl', {})" />
      </div>
      <ul class="nav masthead-nav">
        <DragDropZone
          v-for="(i, index) in myplaylists"
          :key="index"
          :class="{ active: route.path === `/playlist/${i.id}` }"
          :dragobject="i"
          :dragtitle="i.title"
          :sortable="true"
          dragtype="application/listen1-myplaylist"
          @drop="onSidebarPlaylistDrop('my', i.id, $event)"
          @click="$router.push(`/playlist/${i.id}`)">
          <div class="sidebar-block">
            <vue-feather type="disc" />
            <a>{{ i.title }}</a>
          </div>
        </DragDropZone>
      </ul>
      <div class="menu-title">
        <div class="title">{{ t('_FAVORITED_PLAYLIST') }}</div>
      </div>
      <ul class="nav masthead-nav">
        <DragDropZone
          v-for="(i, index) in favoriteplaylists"
          :key="index"
          :class="{ active: route.path === `/playlist/${i.id}` }"
          :dragobject="i"
          :dragtitle="i.title"
          :sortable="true"
          dragtype="application/listen1-favoriteplaylist"
          @click="$router.push(`/playlist/${i.id}`)"
          @drop="onSidebarPlaylistDrop('favorite', i.id, $event)">
          <div class="sidebar-block">
            <vue-feather type="disc" />
            <a>{{ i.title }}</a>
          </div>
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
import { isElectron } from '../provider/lowebutil';

import { useRoute } from 'vue-router';
const isChrome = true;
const route = useRoute();
const { t } = useI18n();
const {is_login} = useAuth();

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
    await MediaService.addMyPlaylist(list_id, [data]);
    notyf.success(t('_ADD_TO_PLAYLIST_SUCCESS'));
  } else if (
    (playlistType === 'my' && dragType === 'application/listen1-myplaylist') ||
    (playlistType === 'favorite' && dragType === 'application/listen1-favoriteplaylist')
  ) {
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
