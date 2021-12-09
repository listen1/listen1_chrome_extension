<template>
  <div
    class="sidebar-block flex items-center text-default h-9 rounded-sm cursor-pointer pl-3 select-none group-hover:bg-sidebar-hover group-hover:text-sidebar-hover">
    <span v-if="!props.icon.startsWith('vue-feather-')" :class="'icon ' + props.icon" />
    <vue-feather v-if="props.icon.startsWith('vue-feather-')" size="1.25rem" :type="props.icon.substring('vue-feather-'.length)" />
    <a class="truncate ml-3 w-36">{{ props.text }}</a>
  </div>
</template>
<script setup lang="ts">
const props = defineProps<{
  text: string;
  icon: string;
}>();
</script>
