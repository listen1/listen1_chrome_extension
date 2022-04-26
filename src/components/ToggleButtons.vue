<template>
  <div class="toggle grid w-fit grid-flow-col divide-x divide-y-0 divide-solid overflow-hidden rounded-lg">
    <SettingButton
      v-for="(button, index) in options"
      :key="index"
      class="mr-auto whitespace-pre rounded-none decoration-2 underline-offset-4"
      :text="button.text"
      :selected="selected === index"
      @click="emit('change', button.value)" />
  </div>
</template>
<script setup lang="ts">
import SettingButton from './SettingButton.vue';
const emit = defineEmits(['change']);
const { options, selected } = defineProps<{
  options: {
    text: string;
    value?: any;
  }[];
  selected?: number;
}>();
</script>
<script lang="ts">
export default {};
</script>
<style>
.toggle {
  border-color: var(--text-default-color);
  text-decoration-color: var(--text-default-color);
}
</style>
