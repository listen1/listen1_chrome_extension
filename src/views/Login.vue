<template>
  <!-- content page: 登录 -->
  <div class="page">
    <div class="login flex flex-col items-center justify-center">
      <div v-for="source in loginSourceList" :key="source">
        <div v-if="is_login(source)">
          <div class="usercard flex items-center w-96 border border-default mb-6">
            <img :src="musicAuth[source].avatar" class="w-16 h-16 m-3" />
            <div class="usercard-title flex-1 h-16 font-semibold">
              <div class="usercard-nickname">{{ musicAuth[source].nickname }}</div>
              <div class="usercard-info text-subtitle">{{ t(source) }}</div>
            </div>
            <button class="m-3 bg-button" @click="logout(source)">{{ t('_LOGOUT') }}</button>
          </div>
        </div>
        <div v-if="!is_login(source)">
          <div class="usercard flex items-center w-96 border border-default mb-6">
            <img src="../images/placeholder.png" class="w-16 h-16 m-3" />

            <div class="usercard-title flex-1 h-16 font-semibold">
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

<script setup>
import { inject } from 'vue';
import { useI18n } from 'vue-i18n';
import useAuth from '../composition/auth';

const { t } = useI18n();
const showModal = inject('showModal');

const { musicAuth, is_login, openLogin, loginSourceList, logout } = useAuth();
</script>
<style>
.page .login {
  min-height: calc(100vh - 192px);
}
</style>
