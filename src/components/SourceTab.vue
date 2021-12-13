<template>
  <div class="source-list m-4">
    <template v-for="(source, index) in sources" :key="source.name">
      <div
        class="source-button inline-block cursor-pointer border-b hover:border-active hover:text-default"
        :class="{ 'border-active': tab === source.name, 'border-transparent text-inactive': tab !== source.name }"
        @click="changeTab(source.name)">
        {{ t(source.displayId) }}
      </div>
      <div v-if="index != sources.length - 1" class="splitter inline-block mx-3 -mb-0.5 w-px h-4 bg-neutral-400" />
    </template>
    <svg
      v-show="loading"
      id="loader-1"
      class="searchspinner inline-block w-6 h-6 ml-4 -mt-1"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      x="0px"
      y="0px"
      width="40px"
      height="40px"
      viewBox="0 0 40 40"
      enable-background="new 0 0 40 40"
      xml:space="preserve">
      <path
        opacity="0.2"
        fill="#000"
        d="M20.201,5.169c-8.254,0-14.946,6.692-14.946,14.946c0,8.255,6.692,14.946,14.946,14.946 s14.946-6.691,14.946-14.946C35.146,11.861,28.455,5.169,20.201,5.169z M20.201,31.749c-6.425,0-11.634-5.208-11.634-11.634 c0-6.425,5.209-11.634,11.634-11.634c6.425,0,11.633,5.209,11.633,11.634C31.834,26.541,26.626,31.749,20.201,31.749z" />
      <path fill="#000" d="M26.013,10.047l1.654-2.866c-2.198-1.272-4.743-2.012-7.466-2.012h0v3.312h0 C22.32,8.481,24.301,9.057,26.013,10.047z">
        <animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 20 20" to="360 20 20" dur="0.6s" repeatCount="indefinite" />
      </path>
    </svg>
    <slot name="right"></slot>
  </div>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const { sources, tab, loading } = defineProps<{
  sources: any[];
  tab: string;
  loading: boolean;
}>();
const emits = defineEmits(['click']);

const changeTab = (name: string) => {
  emits('click', name);
};
</script>
