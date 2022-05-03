<template>
  <button class="setting-button mr-1 cursor-pointer rounded py-2 px-4 leading-[1.4]" :class="{ invert: selected }" @click="emit('click')">{{ text }}</button>
</template>
<script setup lang="ts">
const emit = defineEmits(['click']);
defineProps<{
  text: string;
  selected?: boolean;
}>();
</script>
<script lang="ts">
export default {};
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
