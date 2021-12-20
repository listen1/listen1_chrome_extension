<template>
  <DefaultModal>
    <template #header>
      <h3>{{ t('_EDIT_PLAYLIST') }}</h3>
    </template>
    <template #body>
      <div class="dialog-editplaylist">
        <div class="form-group">
          <label>{{ t('_PLAYLIST_TITLE') }}</label>
          <input
            v-model="title"
            class="form-control h-10 w-80 pl-3 rounded-sm border-none bg-search-input text-default"
            type="text"
            :placeholder="t('_INPUT_PLAYLIST_TITLE')" />
        </div>
        <div class="form-group">
          <label>{{ t('_PLAYLIST_COVER_IMAGE_URL') }}</label>
          <input
            v-model="imageUrl"
            class="form-control h-10 w-80 pl-3 rounded-sm border-none bg-search-input text-default"
            type="text"
            :placeholder="t('_INPUT_PLAYLIST_COVER_IMAGE_URL')" />
        </div>
      </div>
    </template>
    <template #footer>
      <button class="btn btn-danger remove-button bg-button" @click="removeMyPlaylist()">{{ t('_REMOVE_PLAYLIST') }}</button>
      <button class="btn btn-primary confirm-button bg-button" @click="editPlaylist()">{{ t('_CONFIRM') }}</button>
      <button class="btn btn-default bg-button" @click="$emit('close')">{{ t('_CANCEL') }}</button>
    </template>
  </DefaultModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import MediaService from '../../services/MediaService';
import DefaultModal from './DefaultModal.vue';

const { t } = useI18n();
const emit = defineEmits(['close']);

const { list_id, playlist_title, cover_img_url } = defineProps<{
  list_id: string;
  playlist_title: string;
  cover_img_url: string;
}>();

let title = $ref(playlist_title);
let imageUrl = $ref(cover_img_url);

const editPlaylist = () => {
  MediaService.editMyPlaylist(list_id, title, imageUrl);
  emit('close');
};
const removeMyPlaylist = () => {
  MediaService.removeMyPlaylist(list_id, 'my');
  emit('close');
};
</script>

<script lang="ts">
export default {};
</script>

<style></style>
