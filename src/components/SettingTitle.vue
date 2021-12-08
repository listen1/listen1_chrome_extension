<template>
  <div class="settings-title">
    <span>{{ props.text }}</span>
  </div>
</template>
<script setup lang="ts">
const props = defineProps<{
  text: string;
}>();
</script>
<style>
.settings-title {
  border-bottom: solid 1px var(--line-default-color);
  padding-bottom: 10px;
  max-width: 800px;
  margin: 0 25px;
  margin-bottom: 10px;
  font-size: 20px;
}
.settings-title:first-of-type {
  margin-top: 20px;
}
</style>
