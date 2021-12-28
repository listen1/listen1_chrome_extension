<template>
  <DefaultModal>
    <template #header>
      <h3>{{ t('_RECOVER_PLAYLIST') }}</h3>
    </template>
    <template #body>
      <ul class="text-left">
        <input ref="uploadInput" type="file" style="display: none" @change="upload" />
        <li class="cursor-pointer h-24 p-2 rounded hover:bg-dialog-hover" @click="uploadInput.click()">
          <img class="float-left h-20 w-20 mr-4 rounded" src="/images/mycover.jpg" />
          <h2>{{ t('_RECOVER_FROM_LOCAL_FILE') }}</h2>
        </li>
        <p class="font-semibold mb-3">{{ t('_RECOVER_FROM_GITHUB_GIST') }}</p>
        <li v-for="(backup, index) in myBackup" :key="index" class="cursor-pointer h-24 p-2 rounded hover:bg-dialog-hover" @click="recover(backup.id)">
          <img class="float-left h-20 w-20 mr-4 rounded" src="/images/mycover.jpg" />
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
import EventService from '../../services/EventService';
import { ref } from 'vue';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { t } = useI18n();
const { importMySettingsFromGist, gist2json, listExistBackup } = GithubClient.gist;

const uploadInput = ref({} as HTMLInputElement);

let myBackup = $ref(<any>[]);
listExistBackup().then((list) => (myBackup = list));

const replaceDB = async (jsonData: any) => {
  if (jsonData.version !== '3') {
    notyf.error('Only Supported V3 Files for now.');
  } else {
    await iDB.transaction('rw', iDB.tables, async () => {
      await Promise.all(
        iDB.tables.map(async (table) => {
          await table.clear();
          await table.bulkAdd(jsonData[table.name]);
        })
      );
    });
  }
};

// const selectFile = () => {
//   $refs.
// }

const upload = async (event: Event) => {
  const target = <HTMLInputElement>event.target;
  if (!target.files) return;
  const fileObject = target.files[0];
  const reader = new FileReader();
  reader.onloadend = (readerEvent) => {
    if (readerEvent.target?.readyState === FileReader.DONE) {
      const data_json = <string>readerEvent.target.result;
      // parse json
      let data: any = null;
      try {
        data = JSON.parse(data_json);
      } catch (e) {
        notyf.warning('备份文件格式错误，请重新选择');
        return;
      }

      replaceDB(data).then(() => {
        EventService.emit(`playlist:my:update`);
        EventService.emit(`playlist:favorite:update`);
        notyf.success('成功导入我的歌单');
      });
    }
  };
  reader.readAsText(fileObject);
  emit('close');
};

const recover = async (id: string) => {
  const files = importMySettingsFromGist(id);
  const jsonData = await gist2json(files);
  replaceDB(jsonData);
  emit('close');
};
</script>

<script lang="ts">
export default {};
</script>
