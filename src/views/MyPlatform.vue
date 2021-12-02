<template>
  <!-- my platform window-->
  <div class="page page-hot-playlist">
    <div class="source-list">
      <template v-for="(source, index) in platformSourceList" :key="source.name">
        <div class="source-button" :class="{ active: tab === source.name }" @click="changeTab(source.name)">{{ t(source.displayId) }}</div>
        <div v-if="index != platformSourceList.length - 1" class="splitter" />
      </template>
    </div>
    <div id="hotplaylist" class="site-wrapper-innerd">
      <div id="playlist-content" class="cover-container">
        <ul class="playlist-covers">
          <li v-for="i in myPlatformPlaylists" :key="i">
            <div class="u-cover">
              <img :src="i.cover_img_url" @click="showPlaylist(i.id)" />
              <div class="bottom" @click="directplaylist(i.id)">
                <vue-feather type="play-circle"></vue-feather>
              </div>
            </div>
            <div class="desc">
              <span class="title" @click="showPlaylist(i.id)">{{ i.title }}</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { l1Player } from '../services/l1_player';
import { useRouter, useRoute } from 'vue-router';
import MediaService from '../services/MediaService';
import useAuth from '../composition/auth';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
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
let myPlatformUser = getMusicAuth(platformId);
let myPlatformPlaylists = $ref([]);
onMounted(async () => {
  await loadPlatformPlaylists();
});
const showPlaylist = (playlistId) => {
  router.push('/playlist/' + playlistId);
};
const directplaylist = async (list_id) => {
  const data = await MediaService.getPlaylist(list_id);
  const songs = data.tracks;
  l1Player.playTracks(songs);
};
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
const changeTab = (newTab) => {
  tab = newTab;
  loadPlatformPlaylists();
};
</script>

<style></style>
