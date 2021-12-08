<template>
  <DefaultModal>
    <template #header>
      <h3>{{ t('_EDIT_PLAYLIST') }}</h3>
    </template>
    <template #body>
      <div class="dialog-editplaylist">
        <div class="form-group">
          <label>{{ t('_PLAYLIST_TITLE') }}</label>
          <input class="form-control" type="text" :placeholder="t('_INPUT_PLAYLIST_TITLE')" v-model="title" />
        </div>
        <div class="form-group">
          <label>{{ t('_PLAYLIST_COVER_IMAGE_URL') }}</label>
          <input class="form-control" type="text" :placeholder="t('_INPUT_PLAYLIST_COVER_IMAGE_URL')" v-model="imageUrl" />
        </div>
      </div>
    </template>
    <template #footer>
      <button class="btn btn-danger remove-button" @click="removeMyPlaylist()">{{ t('_REMOVE_PLAYLIST') }}</button>
      <button class="btn btn-primary confirm-button" @click="editPlaylist()">{{ t('_CONFIRM') }}</button>
      <button class="btn btn-default" @click="$emit('close')">{{ t('_CANCEL') }}</button>
    </template>
  </DefaultModal>
</template>

<script setup lang="ts">
import DefaultModal from './DefaultModal.vue';
import { useI18n } from 'vue-i18n';
import MediaService from '../../services/MediaService';

const { t } = useI18n();
const emit = defineEmits(['close']);

const props = defineProps<{
  list_id: string;
  playlist_title: string;
  cover_img_url: string;
}>();

let title = $ref(props.playlist_title);
let imageUrl = $ref(props.cover_img_url);

const editPlaylist = () => {
  MediaService.editMyPlaylist(props.list_id, title, imageUrl);
  emit('close');
};
const removeMyPlaylist = () => {
  MediaService.removeMyPlaylist(props.list_id, 'my');
  emit('close');
};
</script>

<script lang="ts">
export default {};
</script>

<style></style>
