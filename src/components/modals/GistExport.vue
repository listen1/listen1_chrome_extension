<template>
  <DefaultModal>
    <template #header>
      <h3>{{ t('_EXPORT_TO_GITHUB_GIST') }}</h3>
    </template>
    <template #body>
      <ul class="text-left">
        <li class="cursor-pointer h-24 p-2 hover:bg-dialog-hover" @click="backup(null, true)">
          <img class="float-left h-20 w-20 mr-4" src="/images/mycover.jpg" />
          <h2>{{ t('_CREATE_PUBLIC_BACKUP') }}</h2>
        </li>
        <li class="cursor-pointer h-24 p-2 hover:bg-dialog-hover" @click="backup(null, false)">
          <img class="float-left h-20 w-20 mr-4" src="/images/mycover.jpg" />
          <h2>{{ t('_CREATE_PRIVATE_BACKUP') }}</h2>
        </li>
        <li
          v-for="(backup, index) in myBackup" :key="index"
          class="cursor-pointer h-24 p-2 hover:bg-dialog-hover"
          @click="backup(backup.id, backup.public)">
          <img class="float-left h-20 w-20 mr-4" src="/images/mycover.jpg" />
          <h2 class="flex">{{ backup.id + '\n' + new Date(backup.updated_at).toLocaleString() }}</h2>
        </li>
      </ul>
    </template>
    <template #footer>
      <br>
    </template>
  </DefaultModal>
</template>
<script lang="ts" setup>
import DefaultModal from './DefaultModal.vue';
import { useI18n } from 'vue-i18n';
import GithubClient from '../../services/GithubService';
import iDB from '../../services/DBService';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { t } = useI18n();
const { backupMySettings2Gist, json2gist, listExistBackup } = GithubClient.gist;

let myBackup = $ref([]);
listExistBackup().then(list => myBackup = list);

const backup = async (id: string, isPublic: boolean) => {
  const dbJson: Record<string, unknown> = {};
  await Promise.all(iDB.tables.map(async (table) => {
    dbJson[table.name] = await table.toArray();
  }));
  dbJson.version = '3';
  const gistFiles = json2gist(dbJson);
  backupMySettings2Gist(gistFiles, id, isPublic);
  emit('close');
}
</script>

<script lang="ts">
export default {};
</script>