<template>
  <div class="flex items-center h-8 text-sm text-link pl-3 select-none mt-4">
    <div class="title flex-1">{{ props.text }}</div>
    <slot name="right"></slot>
  </div>
</template>
<script setup lang="ts">
const props = defineProps<{
  text: string;
}>();
</script>
