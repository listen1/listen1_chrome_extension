<template>
  <div v-if="isWin()" class="win-control border-default -mt-5 -mr-2">
    <button @click="sendControl('window_min')">
      <span class="win-icon win-min self-center text-center items-center" />
    </button>
    <button @click="sendControl('window_max')">
      <span class="win-icon win-max self-center text-center items-center" />
    </button>
    <button class="hover:bg-[#d03726]" @click="sendControl('window_close')">
      <span class="win-icon win-close" />
    </button>
  </div>
  <div v-if="isLinux()" class="border-l border-default">
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
<style>
.win-control button {
  -webkit-app-region: no-drag;
  display: inline-block;
  position: relative;
  width: 45px;
  height: 100%;
  padding: 0;
  margin: 0;
  overflow: hidden;
  border: none;
  box-shadow: none;
  border-radius: 0;
  color: #a0a0a0;
  background-color: transparent;
  transition: background-color 0.25s ease;
  line-height: 10px;
}
.win-icon:before {
  font-family: 'Segoe Fluent Icons', 'Segoe MDL2 Assets', sans-serif !important;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
.win-min:before {
  content: '\e921';
}
.win-max:before {
  content: '\e922';
}
.win-close:before {
  content: '\e8bb';
}
</style>
