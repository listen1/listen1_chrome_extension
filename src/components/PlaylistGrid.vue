<template>
  <ul class="playlist-covers relative m-0 grid grid-cols-3 gap-5 py-0 md:grid-cols-4 lg:grid-cols-5 xl:gap-7">
    <li v-for="i in playlists" :key="i.id" class="min-h-40 group">
      <div class="relative rounded bg-neutral-700 shadow-md xl:rounded-md">
        <div
          class="aspect-square rounded border-[0.5px] border-default bg-cover duration-200 ease-linear group-hover:opacity-60 xl:rounded-md"
          style="background-image: url('/images/mycover.jpg')">
          <img :src="i.cover_img_url" class="m-auto w-full cursor-pointer rounded object-cover xl:rounded-md" @click="showPlaylist(i.id)" />
        </div>
        <div
          class="bottom absolute bottom-3 right-3 h-8 w-8 cursor-pointer opacity-0 duration-200 ease-linear group-hover:opacity-100"
          @click="directplaylist(i.id)">
          <vue-feather type="play-circle" size="2rem" stroke="white"></vue-feather>
        </div>
      </div>
      <div class="desc cursor-pointer">
        <div class="min-h-[8px] px-2 pt-1 text-left text-sm" @click="showPlaylist(i.id)">{{ i.title }}</div>
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
