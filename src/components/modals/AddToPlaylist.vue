<template>
  <DefaultModal>
    <template #header>
      <h3>{{ t('_ADD_TO_PLAYLIST') }}</h3>
    </template>
    <template #body>
      <ul class="dialog-playlist text-left">
        <li class="detail-add cursor-pointer h-14 p-2 hover:bg-dialog-hover" @click="showModal('CreatePlaylist', { tracks: [...tracks] })">
          <img class="float-left h-10 w-10 mr-4" src="../../images/mycover.jpg" />
          <h2>{{ t('_CREATE_PLAYLIST') }}</h2>
        </li>
        <li class="cursor-pointer h-14 p-2 hover:bg-dialog-hover" v-for="(playlist, index) in myplaylist" :key="index" @click="addToPlaylist(playlist.id)">
          <img class="float-left h-10 w-10 mr-4" :src="playlist.cover_img_url" />
          <h2>{{ playlist.title }}</h2>
        </li>
      </ul>
    </template>
    <template #footer><br /></template>
  </DefaultModal>
</template>

<script setup lang="ts">
import DefaultModal from './DefaultModal.vue';
import { onMounted, inject, toRaw } from 'vue';
import MediaService from '../../services/MediaService';
import { useI18n } from 'vue-i18n';
import notyf from '../../services/notyf';
import useRedHeart from '../../composition/redheart';

const { t } = useI18n();
let myplaylist: any = $ref<unknown[]>([]);
const showModal: any = inject('showModal');

const addToPlaylist = (playlist: string) => {
  const { addMyPlaylistByUpdateRedHeart } = useRedHeart();
  addMyPlaylistByUpdateRedHeart(playlist, props.tracks.map(toRaw));
  notyf.success(t('_ADD_TO_PLAYLIST_SUCCESS'));
  emit('close');
};

onMounted(() => {
  MediaService.showMyPlaylist().then((res) => (myplaylist = res));
});

const props = defineProps<{
  tracks: unknown[];
}>();
const emit = defineEmits(['close']);
</script>

<script lang="ts">
export default {};
</script>

<style></style>
