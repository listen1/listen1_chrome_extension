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
      <SettingButton :text="t('_AUTHORIZED_FINISHED')" @click="updateAuthStatus()" />
      <SettingButton :text="t('_AUTHORIZED_REOPEN')" @click="openAuthUrl()" />
    </template>
  </DefaultModal>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import EventService from '../../services/EventService';
import GithubClient from '../../services/GithubService';
import SettingButton from '../SettingButton.vue';
import DefaultModal from './DefaultModal.vue';

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
