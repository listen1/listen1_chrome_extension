<template>
  <div
    class="sidebar-block flex items-center text-default h-9 rounded cursor-pointer pl-3 select-none group-hover:bg-sidebar-hover group-hover:text-sidebar-hover group-hover:ease-in-out duration-200">
    <span v-if="!props.icon.startsWith('vue-feather-')" :class="'icon text-xl ' + props.icon" />
    <vue-feather v-if="props.icon.startsWith('vue-feather-')" size="1.25rem" stroke-width="1" :type="props.icon.substring('vue-feather-'.length)" />
    <a class="truncate ml-3 w-36">{{ props.text }}</a>
  </div>
</template>
<script setup lang="ts">
const props = defineProps<{
  text: string;
  icon: string;
}>();
</script>
