<template>
  <div class="m-2">
    <div class="settings-title pb-2 mb-2 mx-8">
      <span>{{ titleText }}</span>
    </div>
    <div class="settings-content mx-7 mb-7 leading-8">
      <slot></slot>
    </div>
  </div>
</template>
<script setup lang="ts">
const { title: titleText } = defineProps<{
  title: string;
}>();
</script>
<style>
.settings-title {
  border-bottom: solid 1px var(--line-default-color);
  font-size: 1.25rem;
  max-width: 48rem;
}
.settings-title:first-of-type {
  margin-top: 1.25rem;
}
.settings-content {
  max-width: 48rem;
}
</style>
