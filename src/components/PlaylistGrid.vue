<template>
  <ul class="playlist-covers m-0 py-0 flex relative flex-wrap">
    <li v-for="i in playlists" :key="i.id" class="group w-1/3 md:w-1/5 min-h-40 px-4 sm:w-1/4 mb-3">
      <div class="u-cover flex relative shadow-lg">
        <img :src="i.cover_img_url" class="m-auto cursor-pointer w-full object-cover rounded" @click="showPlaylist(i.id)" />
        <div
          class="bottom opacity-0 group-hover:opacity-100 cursor-pointer absolute w-8 h-8 bottom-3 right-3 ease-linear duration-200"
          @click="directplaylist(i.id)">
          <vue-feather type="play-circle" size="2rem"></vue-feather>
        </div>
      </div>
      <div class="desc cursor-pointer">
        <span class="title flex min-h-8 mt-1" @click="showPlaylist(i.id)">{{ i.title }}</span>
      </div>
    </li>
    <!-- <div class="loading_bottom">
                              <img src="images/loading-1.gif" height="40px" />
          </div>-->
  </ul>
</template>
<script setup lang="ts">
import { useRouter } from 'vue-router';
import { l1Player } from '../services/l1_player';
import MediaService from '../services/MediaService';

const router = useRouter();

defineProps<{
  playlists: any[];
}>();

const showPlaylist = (playlistId: string) => {
  router.push('/playlist/' + playlistId);
};
const directplaylist = async (list_id: string) => {
  const data = await MediaService.getPlaylist(list_id);
  const songs = data.tracks;
  l1Player.playTracks(songs);
};
</script>
