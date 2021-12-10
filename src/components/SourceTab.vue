<template>
  <div class="source-list m-4">
    <template v-for="(source, index) in props.sources" :key="source.name">
      <div
        class="source-button inline-block cursor-pointer border-b hover:border-active hover:text-default"
        :class="{ 'border-active': tab === source.name, 'border-transparent text-inactive': tab !== source.name }"
        @click="changeTab(source.name)">
        {{ t(source.name) }}
      </div>
      <div v-if="index != props.sources.length - 1" class="splitter inline-block mx-3 -mb-0.5 w-px h-4 bg-neutral-400" />
    </template>
  </div>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const props = defineProps<{
  sources: any[];
  tab: string;
}>();
const emits = defineEmits(['click']);

const changeTab = (name: string) => {
  emits('click', name);
};
</script>
