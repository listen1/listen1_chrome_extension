<template>
  <div class="toggle overflow-hidden grid grid-flow-col w-fit divide-x divide-y-0 divide-solid rounded-lg">
    <SettingButton v-for="(button, index) in options" :key="index" class="rounded-none mr-auto" :text="button.text" @click="emit('change', button.value)" />
    <!-- <SettingButton text="No" /> -->
  </div>
</template>
<script setup lang="ts">
import SettingButton from './SettingButton.vue';
const emit = defineEmits(['change']);
const { options } = defineProps<{
  options: {
    text: string;
    value?: any;
  }[];
}>();
</script>
<script lang="ts">
export default {};
</script>
<style>
.toggle {
  border-color: var(--text-default-color);
}
</style>
