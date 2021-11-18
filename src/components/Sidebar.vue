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
          v-if="!isChrome"
          @click="showPlaylist('lmplaylist_reserve')"
          :class="{ active: window_type == 'list' && '/playlist?list_id=lmplaylist_reserve' === getCurrentUrl() }">
          <div class="sidebar-block">
            <span class="icon li-featured-list" />
            <a>{{ t('_LOCAL_MUSIC') }}</a>
          </div>
        </li>
        <li
          v-if="is_login('netease')"
          @click="showTag(6, { platform: 'netease', user: musicAuth.netease })"
          :class="{ active: current_tag == 6 && tag_params.platform == 'netease' && window_url_stack.length == 0 }">
          <div class="sidebar-block">
            <vue-feather type="globe" />
            <a>{{ t('_MY_NETEASE') }}</a>
          </div>
        </li>
        <li
          v-if="is_login('qq')"
          @click="showTag(6, { platform: 'qq', user: musicAuth.qq })"
          :class="{ active: current_tag == 6 && tag_params.platform == 'qq' && window_url_stack.length == 0 }">
          <div class="sidebar-block">
            <vue-feather type="globe" />
            <a>{{ t('_MY_QQ') }}</a>
          </div>
        </li>
      </ul>
      <div class="menu-title" ng-init="loadMyPlaylist();">
        <div class="title">
          {{ t('_CREATED_PLAYLIST') }}
        </div>
        <vue-feather type="plus-square" />
      </div>
      <ul class="nav masthead-nav">
        <li
          v-for="(i, index) in myplaylists"
          :key="index"
          :class="{ active: window_type == 'list' && '/playlist/' + i.id === $router.currentRoute.path }"
          @click="$router.push(`/playlist/${i.id}`)"
          drag-drop-zone
          drag-zone-type="'application/listen1-myplaylist'"
          drop-zone-ondrop="onSidebarPlaylistDrop('my', i.info.id, arg1, arg2, arg3)"
          draggable="true"
          sortable="true"
          drag-zone-object="i"
          drag-zone-title="i.info.title">
          <div class="sidebar-block">
            <vue-feather type="disc" />
            <a>{{ i.title }}</a>
          </div>
        </li>
      </ul>
      <div class="menu-title">
        <div class="title">
          {{ t('_FAVORITED_PLAYLIST') }}
        </div>
      </div>
      <ul class="nav masthead-nav">
        <li
          v-for="(i, index) in favoriteplaylists"
          :key="index"
          :class="{ active: window_type == 'list' && '/playlist/' + i.id === $router.currentRoute.path }"
          @click="$router.push(`/playlist/${i.id}`)"
          drag-drop-zone
          drag-zone-type="'application/listen1-favoriteplaylist'"
          drop-zone-ondrop="onSidebarPlaylistDrop('favorite', i.info.id, arg1, arg2, arg3)"
          draggable="true"
          sortable="true"
          drag-zone-object="i"
          drag-zone-title="i.info.title">
          <div class="sidebar-block">
            <vue-feather type="disc" />
            <a>{{ i.title }}</a>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
</script>

<script setup lang="ts">
import { onMounted } from '@vue/runtime-core';
import { useI18n } from 'vue-i18n';
import MediaService from '../services/MediaService';
import $event from '../services/EventService';

const isChrome = true;

const { t } = useI18n();
const is_login = (platform: string) => {
  return false;
};
let favoriteplaylists = $ref<unknown[]>([]);

const refreshFav = () => {
  MediaService.showFavPlaylist().then((res) => (favoriteplaylists = res));
};
const refreshMy = () => {
  MediaService.showMyPlaylist().then((res) => (favoriteplaylists = res));
};

onMounted(() => {
  MediaService.showFavPlaylist().then((res) => (favoriteplaylists = res));
});

$event.on('playlist:favorite:update', refreshFav);
$event.on('playlist:my:update', refreshMy);
</script>

<style>
</style>