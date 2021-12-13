<template>
  <DefaultModal>
    <template #header>
      <h3>{{ t('_RECOVER_FROM_GITHUB_GIST') }}</h3>
    </template>
    <template #body>
      <ul class="text-left">
        <li class="cursor-pointer h-24 p-2 hover:bg-dialog-hover" v-for="(backup, index) in myBackup" :key="index" @click="recover(backup.id)">
          <img class="float-left h-20 w-20 mr-4" src="/images/mycover.jpg" />
          <h2 class="flex">{{ backup.id + '\n' + new Date(backup.updated_at).toLocaleString() }}</h2>
        </li>
      </ul>
    </template>
    <template #footer>
      <br />
    </template>
  </DefaultModal>
</template>
<script lang="ts" setup>
import DefaultModal from './DefaultModal.vue';
import { useI18n } from 'vue-i18n';
import GithubClient from '../../services/GithubService';
import notyf from '../../services/notyf';
import iDB from '../../services/DBService';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { t } = useI18n();
const { importMySettingsFromGist, gist2json, listExistBackup } = GithubClient.gist;

let myBackup = $ref([]);
listExistBackup().then((list) => (myBackup = list));

const recover = async (id: string) => {
  const files = importMySettingsFromGist(id);
  const jsonData = await gist2json(files);
  if (jsonData.version !== '3') {
    notyf.error('Only Supported V3 Files for now.');
  } else {
    iDB.transaction('rw', iDB.tables, async () => {
      await Promise.all(iDB.tables.map(async (table) => {
        await table.clear();
        await table.bulkAdd(jsonData[table.name]);
      }));
    });
  }
  emit('close');
};
</script>

<script lang="ts">
export default {};
</script>