<template>
  <!-- content page: 登录 -->
  <div class="page">
    <div class="login">
      <div v-for="source in loginSourceList" :key="source">
        <div v-if="is_login(source)">
          <div class="usercard">
            <img :src="musicAuth[source].avatar" />
            <div class="usercard-title">
              <div class="usercard-nickname">{{ musicAuth[source].nickname }}</div>
              <div class="usercard-info">{{ t(source) }}</div>
            </div>
            <button @click="logout(source)">{{ t('_LOGOUT') }}</button>
          </div>
        </div>
        <div v-if="!is_login(source)">
          <div class="usercard">
            <img src="../images/placeholder.png" />

            <div class="usercard-title">
              <div class="usercard-nickname">{{ t('_NOT_LOGIN_NICKNAME') }}</div>
              <div class="usercard-info">{{ t(source) }}</div>
            </div>

            <button
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
import { useI18n } from 'vue-i18n';
import { inject } from 'vue';
import useAuth from '../composition/auth';

const { t } = useI18n();
const showModal = inject('showModal');

const { musicAuth, is_login, openLogin, loginSourceList, logout } = useAuth();
</script>
