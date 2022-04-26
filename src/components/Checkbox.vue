<template>
  <div class="inline-block cursor-pointer align-middle" @click="emit('change', !checked)">
    <div
      class="flex items-center justify-center rounded-sm border border-solid border-slate-300 transition duration-200"
      :class="{ 'border-slate-300': !checked, 'border-sky-500': checked, 'bg-sky-500': checked, 'mr-2': text != undefined }">
      <vue-feather :stroke="checked ? 'white' : 'transparent'" type="check" :size="size || '1rem'"></vue-feather>
    </div>
  </div>
  <span class="cursor-pointer select-none" @click="emit('change', !checked)">{{ text }}</span>
</template>
<script setup lang="ts">
const emit = defineEmits(['change']);
defineProps<{
  checked: boolean;
  size?: string;
  text?: string;
}>();
</script>
