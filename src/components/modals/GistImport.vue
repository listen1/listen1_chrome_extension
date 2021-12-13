<template>
  <DefaultModal>
    <template #header>
      <h3>{{ t('_RECOVER_FROM_GITHUB_GIST') }}</h3>
    </template>
    <template #body>
      <ul class="dialog-backuplist">
        <li v-for="(backup, index) in myBackup" :key="index" ng-class-odd="'odd'" ng-class-even="'even'" @click="recover(backup.id)">
          <img src="/images/mycover.jpg" />
          <h2>{{ backup.id }} {{ backup.description }}</h2>
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