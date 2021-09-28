<template>
  <!-- content page: 登录 -->
  <div class="page">
    <div class="login">
      <div ng-repeat="source in loginSourceList">
        <div ng-show="is_login(source)">
          <div class="usercard">
            <img ng-src="musicAuth[source].avatar" />
            <div class="usercard-title">
              <div class="usercard-nickname">musicAuth[source].nickname</div>
              <div class="usercard-info">source</div>
            </div>
            <button ng-click="logout(source)">{{ t('_LOGOUT') }}</button>
          </div>
        </div>
        <div ng-show="!is_login(source)">
          <div class="usercard">
            <img src="../images/placeholder.png" />

            <div class="usercard-title">
              <div class="usercard-nickname">{{ t('_NOT_LOGIN_NICKNAME') }}</div>
              <div class="usercard-info">source</div>
            </div>

            <button ng-click=" openLogin(source);showDialog(11, source);">{{ t('_LOGIN') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
</script>

<style>
</style>