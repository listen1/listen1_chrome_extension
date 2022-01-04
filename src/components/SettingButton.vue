<template>
  <button class="setting-button p-2 mr-1 rounded cursor-pointer leading-[1.4] transition duration-500" :class="{ invert: selected }" @click="emit('click')">
    {{ text }}
  </button>
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
