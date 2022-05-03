<template>
  <!-- content page: 登录 -->
  <div class="page">
    <div class="login flex flex-col items-center justify-center">
      <div v-for="source in loginSourceList" :key="source">
        <div v-if="is_login(source)">
          <div class="usercard mb-6 flex w-96 items-center border border-default">
            <img :src="musicAuth[source].avatar" class="m-3 h-16 w-16" />
            <div class="usercard-title h-16 flex-1 font-semibold">
              <div class="usercard-nickname">{{ musicAuth[source].nickname }}</div>
              <div class="usercard-info text-subtitle">{{ t(source) }}</div>
            </div>
            <button class="m-3 bg-button" @click="logout(source)">{{ t('_LOGOUT') }}</button>
          </div>
        </div>
        <div v-if="!is_login(source)">
          <div class="usercard mb-6 flex w-96 items-center border border-default">
            <img src="../images/placeholder.png" class="m-3 h-16 w-16" />

            <div class="usercard-title h-16 flex-1 font-semibold">
              <div class="usercard-nickname">{{ t('_NOT_LOGIN_NICKNAME') }}</div>
              <div class="usercard-info text-subtitle">{{ t(source) }}</div>
            </div>

            <button
              class="m-3 bg-button"
              @click="
                openLogin(source);
                showModal('OpenLogin', { source });
              ">
              {{ t('_LOGIN') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { useI18n } from 'vue-i18n';
import useAuth from '../composition/auth';

const { t } = useI18n();
const showModal = inject<any>('showModal');

const { musicAuth, is_login, openLogin, loginSourceList, logout } = useAuth();
</script>
<style>
.page .login {
  min-height: calc(100vh - 192px);
}
</style>
