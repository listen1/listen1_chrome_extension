<template>
  <button class="setting-button p-[5px] mr-1 rounded cursor-pointer leading-[1.4]" @click="emit('click')">{{ props.text }}</button>
</template>
<script setup lang="ts">
const emit = defineEmits(['click']);
const props = defineProps<{
  text: string;
}>();
</script>
<style>
.setting-button {
  background: var(--button-background-color);
  color: var(--text-default-color);
}
.setting-button:hover {
  background: var(--button-hover-background-color);
}
</style>
