<template>
  <div class="m-2">
    <div class="settings-title mx-8 mb-3 pb-2">
      <span class="text-xl">{{ title }}</span>
    </div>
    <div class="settings-content mx-7 leading-8">
      <slot></slot>
    </div>
  </div>
</template>
<script setup lang="ts">
const { title } = defineProps<{
  title: string;
}>();
</script>
<style>
.settings-title {
  border-bottom: solid 1px var(--line-default-color);
}
.settings-content {
  max-width: 48rem;
}
</style>
