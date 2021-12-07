<template>
  <DefaultModal>
    <template #header>
      <h3>{{ t('_IMPORT_PLAYLIST') }}</h3>
    </template>
    <template #body>
      <ul class="dialog-playlist">
        <li v-for="(playlist, index) in myplaylist" :key="index" ng-class-odd="'odd'" ng-class-even="'even'" @click="mergePlaylist(playlist.id)">
          <img :src="playlist.cover_img_url" />
          <h2>{{ playlist.title }}</h2>
        </li>
      </ul>
    </template>
    <template #footer><br /></template>
  </DefaultModal>
</template>

<script setup lang="ts">
import DefaultModal from './DefaultModal.vue';
import { onMounted } from 'vue';
import MediaService from '../../services/MediaService';
import useRedHeart from '../../composition/redheart';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
let myplaylist: any[] = $ref<unknown[]>([]);
const emit = defineEmits(['close']);
const props = defineProps<{
  list_id: string;
}>();
const mergePlaylist = (playlistId: string) => {
  const { mergePlaylistByUpdateRedHeart } = useRedHeart();
  mergePlaylistByUpdateRedHeart(props.list_id, playlistId);
  emit('close');
};

onMounted(() => {
  MediaService.showMyPlaylist().then((res) => (myplaylist = res));
});
</script>

<script lang="ts">
export default {};
</script>

<style></style>
