<template>
  <button
    class="mr-1 cursor-pointer rounded bg-button py-2 px-4 leading-[1.4] text-default hover:bg-button-hover"
    :class="{ invert: selected }"
    @click="emit('click')">
    {{ text }}
  </button>
</template>
<script setup lang="ts">
const emit = defineEmits(['click']);
defineProps<{
  text: string;
  selected?: boolean;
}>();
</script>
