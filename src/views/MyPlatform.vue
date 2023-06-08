<template>
  <!-- my platform window-->
  <div class="page page-hot-playlist mx-auto my-0 md:max-w-4xl lg:max-w-5xl xl:max-w-[1150px]">
    <SourceTab :sources="platformSourceList" :tab="tab" :loading="false" @click="changeTab"></SourceTab>
    <div id="hotplaylist" class="site-wrapper-innerd">
      <div id="playlist-content" class="cover-container">
        <PlaylistGrid :playlists="myPlatformPlaylists"></PlaylistGrid>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import PlaylistGrid from '../components/PlaylistGrid.vue';
import SourceTab from '../components/SourceTab.vue';
import useAuth from '../composition/auth';
import MediaService from '../services/MediaService';

const route = useRoute();
const { getMusicAuth } = useAuth();
const { platformId } = route.params;

const platformSourceList = [
  {
    name: 'my_created_playlist',
    displayId: '_MY_CREATED_PLAYLIST'
  },
  {
    name: 'my_favorite_playlist',
    displayId: '_MY_FAVORITE_PLAYLIST'
  },
  {
    name: 'recommend_playlist',
    displayId: '_RECOMMEND_PLAYLIST'
  }
];
let tab = $ref(platformSourceList[0].name);
let myPlatformUser = getMusicAuth(platformId as string);
let myPlatformPlaylists = $ref([]);
onMounted(async () => {
  await loadPlatformPlaylists();
});

const loadPlatformPlaylists = async () => {
  if (myPlatformUser.platform === undefined) {
    return;
  }
  let getPlaylistFn = MediaService.getUserCreatedPlaylist;
  if (tab === 'recommend_playlist') {
    getPlaylistFn = MediaService.getRecommendPlaylist;
  } else if (tab === 'my_favorite_playlist') {
    getPlaylistFn = MediaService.getUserFavoritePlaylist;
  }
  const user = myPlatformUser;
  const response = await getPlaylistFn(user.platform, {
    user_id: user.user_id
  });
  const { data } = response;
  myPlatformPlaylists = data.playlists;
};
const changeTab = (newTab: string) => {
  tab = newTab;
  loadPlatformPlaylists();
};
</script>
