<template>
  <div class="playlist-button clone-button mr-6 mb-6 flex h-8 cursor-pointer rounded border border-button" @click="onclick">
    <div class="play-list flex flex-1 items-center px-6 hover:bg-button-hover">
      <span v-if="!icon.startsWith('vue-feather-')" :class="'icon mr-4 ' + icon + ' ' + (iconClass ? iconClass : '')" />
      <vue-feather
        v-if="icon.startsWith('vue-feather-')"
        :class="'mr-4 ' + (iconClass ? iconClass : '')"
        size="1.25rem"
        stroke-width="1"
        :type="icon.substring('vue-feather-'.length)" />
      <span>
        <slot></slot>
        <slot name="main"></slot>
      </span>
    </div>
    <slot name="right"></slot>
  </div>
</template>
<script setup lang="ts">
defineProps<{
  icon: string;
  iconClass?: string;
}>();
const emits = defineEmits(['click']);
const onclick = () => {
  emits('click');
};
</script>
<style>
.filled-yellow svg {
  /* fill-yellow-500 */
  fill: #eab308;
  stroke: none;
}
</style>
