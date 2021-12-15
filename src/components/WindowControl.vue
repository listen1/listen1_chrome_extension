<template>
  <div v-if="isWin() || isLinux()" class="border-l border-default">
    <div class="inline-block w-6 h-6 ml-4 overflow-hidden cursor-pointer group app-region-nodrag" @click="sendControl('window_min')">
      <vue-feather size="1.25rem" class="icon opacity-50 group-hover:opacity-100 -mb-3" type="minus" />
    </div>
    <vue-feather size="1.25rem" class="icon opacity-50 hover:opacity-100 ml-4" type="square" @click="sendControl('window_max')" />
    <vue-feather size="1.25rem" class="icon opacity-50 hover:opacity-100 ml-4 mr-4" type="x" @click="sendControl('window_close')" />
  </div>
</template>
<script setup>
import { isLinux, isWin } from '../provider/lowebutil';

const sendControl = (message) => {
  window.api?.sendControl(message);
};
</script>
