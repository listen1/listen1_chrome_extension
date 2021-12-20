<template>
  <DefaultModal>
    <template #header>
      <h3>{{ t('_CREATE_PLAYLIST') }}</h3>
    </template>
    <template #body>
      <div class="dialog-newplaylist">
        <input v-model="newlistTitle" class="form-control" type="text" :placeholder="t('_INPUT_NEW_PLAYLIST_TITLE')" />
      </div>
    </template>
    <template #footer>
      <button class="btn btn-primary confirm-button bg-button" @click="createAndAddPlaylist()">{{ t('_CONFIRM') }}</button>
      <button class="btn btn-default bg-button" @click="$emit('close')">{{ t('_CANCEL') }}</button>
    </template>
  </DefaultModal>
</template>

<script setup lang="ts">
import { toRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import MediaService from '../../services/MediaService';
import DefaultModal from './DefaultModal.vue';

const { t } = useI18n();
let newlistTitle = $ref('');

const createAndAddPlaylist = () => {
  MediaService.createMyPlaylist(newlistTitle, tracks.map(toRaw));
  emit('close');
};

const { tracks } = defineProps<{
  tracks: unknown[];
}>();
const emit = defineEmits(['close']);
</script>

<script lang="ts">
export default {};
</script>

<style></style>
