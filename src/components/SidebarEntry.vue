<template>
  <div
    class="sidebar-block flex h-9 cursor-pointer select-none items-center rounded pl-3 text-default duration-200 group-hover:bg-sidebar-hover group-hover:text-sidebar-hover group-hover:ease-in-out">
    <span v-if="!icon.startsWith('vue-feather-')" :class="'icon text-xl ' + icon" />
    <vue-feather v-if="icon.startsWith('vue-feather-')" size="1.25rem" stroke-width="1" :type="icon.substring('vue-feather-'.length)" />
    <a class="ml-3 w-36 truncate">{{ text }}</a>
  </div>
</template>
<script setup lang="ts">
const { text, icon } = defineProps<{
  text: string;
  icon: string;
}>();
</script>
