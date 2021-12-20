<template>
  <DefaultModal>
    <template #header>
      <h3>{{ t('_PLAYLIST_LINK') }}</h3>
    </template>
    <template #body>
      <div class="dialog-open-url">
        <input
          v-model="url"
          class="form-control h-10 w-80 pl-3 rounded-sm border-none bg-search-input text-default"
          type="text"
          :placeholder="t('_EXAMPLE') + 'https://www.xiami.com/collect/198267231'" />
      </div>
    </template>
    <template #footer>
      <button class="btn btn-primary confirm-button bg-button" @click="openUrl()">{{ t('_CONFIRM') }}</button>
      <button class="btn btn-default bg-button" @click="$emit('close')">{{ t('_CANCEL') }}</button>
    </template>
  </DefaultModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import MediaService from '../../services/MediaService';
import DefaultModal from './DefaultModal.vue';

const router = useRouter();
const { t } = useI18n();
let url = $ref('');
const emit = defineEmits(['close']);

const showPlaylist = (playlistId: string) => {
  router.push('/playlist/' + playlistId);
};

const openUrl = async () => {
  const result = await MediaService.parseURL(url);
  if (result !== null) {
    showPlaylist(result.id);
  }
  emit('close');
};
</script>

<script lang="ts">
export default {};
</script>

<style></style>
