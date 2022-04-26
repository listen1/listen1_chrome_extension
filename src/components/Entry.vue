<template>
  <div
    class="sidebar-block flex h-9 cursor-pointer select-none items-center rounded pl-3 text-default duration-200 group-hover:bg-sidebar-hover group-hover:text-sidebar-hover group-hover:ease-in-out">
    <slot></slot>
    <a class="ml-2 w-48 truncate">{{ text }}</a>
  </div>
</template>
<script setup lang="ts">
defineProps<{
  text: string;
}>();
</script>
