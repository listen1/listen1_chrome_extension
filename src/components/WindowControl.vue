<template>
  <span v-if="isWin()" class="inline-block w-[calc(100vw-env(titlebar-area-width))]"></span>
  <div v-if="isLinux()" class="border-l border-default">
    <div class="app-region-nodrag group ml-4 inline-block h-5 w-5 cursor-pointer overflow-hidden" @click="sendControl('window_min')">
      <vue-feather size="1.25rem" class="icon opacity-50 group-hover:opacity-100" type="minus" />
    </div>
    <vue-feather size="1.25rem" class="icon ml-4 opacity-50 hover:opacity-100" type="square" @click="sendControl('window_max')" />
    <vue-feather size="1.25rem" class="icon ml-4 mr-4 opacity-50 hover:opacity-100" type="x" @click="sendControl('window_close')" />
  </div>
</template>
<script setup>
import { isLinux, isWin } from '../utils';

const sendControl = (message) => {
  window.api?.sendControl(message);
};
</script>
