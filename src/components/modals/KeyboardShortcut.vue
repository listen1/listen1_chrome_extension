<template>
  <DefaultModal>
    <template #header>
      <h3>{{ t('_SHORTCUTS') }}</h3>
    </template>
    <template #body>
      <table class="w-full">
        <tbody>
          <tr v-for="keymap in webKeyMap" :key="keymap.name" class="odd:bg-even even:bg-odd">
            <th class="py-2 pl-2 text-left">
              {{ t(keymap.name) }}
            </th>
            <td class="pr-5 text-center">{{ keymap.key }}</td>
          </tr>
        </tbody>
      </table>
    </template>
    <template #footer><br /></template>
  </DefaultModal>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { webKeyMap } from '../../services/keymap';
import DefaultModal from './DefaultModal.vue';
const { t } = useI18n();
</script>
