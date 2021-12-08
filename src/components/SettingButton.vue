<template>
  <button class="setting-button" @click="emit('click')">{{ props.text }}</button>
</template>
<script setup lang="ts">
const emit = defineEmits(['click']);
const props = defineProps<{
  text: string;
}>();
</script>
<style scoped>
.setting-button {
  padding: 5px;
  background: var(--button-background-color);
  margin-right: 4px;
  color: var(--text-default-color);
  border-radius: 4px;
  cursor: pointer;
  line-height: 1.4;
}
.setting-button:hover {
  background: var(--button-hover-background-color);
}
</style>
