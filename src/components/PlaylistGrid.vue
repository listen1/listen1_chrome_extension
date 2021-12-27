<template>
  <ul class="playlist-covers m-0 py-0 relative grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-5">
    <li v-for="i in playlists" :key="i.id" class="group min-h-40">
      <div class="relative">
        <div class="aspect-square bg-cover" style="background-image: url('/images/mycover.jpg')">
          <img :src="i.cover_img_url" class="m-auto border border-default cursor-pointer object-cover" @click="showPlaylist(i.id)" />
        </div>
        <div
          class="bottom opacity-0 group-hover:opacity-100 cursor-pointer absolute w-8 h-8 bottom-3 right-3 ease-linear duration-200"
          @click="directplaylist(i.id)">
          <vue-feather type="play-circle" size="2rem"></vue-feather>
        </div>
      </div>
      <div class="desc cursor-pointer">
        <div class="min-h-8 mt-1 px-2" @click="showPlaylist(i.id)">{{ i.title }}</div>
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
