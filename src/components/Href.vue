<template>
  <a :href="to" target="_blank" rel="noreferrer">{{ displayName }}</a>
</template>
<script setup lang="ts">
const { to, display } = defineProps<{
  to: string;
  display?: string;
}>();

const displayName = display || to;
</script>
<style scoped>
a {
  color: var(--text-default-color);
}
</style>
