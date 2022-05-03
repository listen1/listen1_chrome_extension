<template>
  <div class="flex h-8 select-none items-center pl-3 text-sm text-link">
    <div class="title flex-1">{{ text }}</div>
    <slot name="right"></slot>
  </div>
</template>
<script setup lang="ts">
defineProps<{
  text: string;
}>();
</script>
