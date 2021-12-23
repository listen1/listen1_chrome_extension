<template>
  <div
    class="sidebar-block flex items-center text-default h-9 rounded cursor-pointer pl-3 select-none group-hover:bg-sidebar-hover group-hover:text-sidebar-hover group-hover:ease-in-out duration-200">
    <slot></slot>
    <a class="truncate ml-2 w-48">{{ text }}</a>
  </div>
</template>
<script setup lang="ts">
defineProps<{
  text: string;
}>();
</script>
