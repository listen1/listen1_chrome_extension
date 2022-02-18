<template>
  <DefaultModal>
    <template #header>
      <h3>{{ t('_LOGIN') }}</h3>
    </template>
    <template #body>
      <div class="dialog-open-login">
        <p>{{ t('_LOGIN_DIALOG_NOTICE') }}</p>
      </div>
    </template>
    <template #footer>
      <button
        class="btn btn-primary confirm-button bg-button"
        @click="
          $emit('close');
          refreshAuthStatus();
        ">
        {{ t('_LOGIN_SUCCESS') }}
      </button>
      <button class="btn btn-warning warning-button bg-button" @click="openLogin(source)">{{ t('_LOGIN_FAIL_RETRY') }}</button>
    </template>
  </DefaultModal>
</template>
<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import useAuth from '../../composition/auth';
import DefaultModal from './DefaultModal.vue';
const { source } = defineProps<{
  source: string;
}>();
const { openLogin, refreshAuthStatus } = useAuth();

const { t } = useI18n();
</script>
<script lang="ts">
export default {};
</script>
