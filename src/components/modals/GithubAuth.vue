<template>
  <DefaultModal>
    <template #header>
      <h3>{{ t('_OPENING_GITHUB_PAGE') }}</h3>
    </template>
    <template #body>
      <div>
        <p>{{ t('_CONFIRM_NOTICE_GITHUB') }}</p>
      </div>
    </template>
    <template #footer>
      <button class="btn btn-primary confirm-button" @click="updateAuthStatus()">{{ t('_AUTHORIZED_FINISHED') }}</button>
      <button class="btn btn-warning warning-button" @click="openAuthUrl()">{{ t('_AUTHORIZED_REOPEN') }}</button>
    </template>
  </DefaultModal>
</template>
<script lang="ts" setup>
import DefaultModal from './DefaultModal.vue';
import { useI18n } from 'vue-i18n';
import GithubClient from '../../services/GithubService';
import EventService from '../../services/EventService';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { openAuthUrl } = GithubClient.github;

const updateAuthStatus = () => {
  EventService.emit('github:status');
  emit('close');
};

const { t } = useI18n();
</script>

<script lang="ts">
export default {};
</script>
