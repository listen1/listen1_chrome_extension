import mitt from 'mitt';
import 'notyf/notyf.min.css';
import { createApp } from 'vue';
import VueFeather from 'vue-feather';
import App from './App.vue';
import './assets/css/icon.css';
import './assets/css/index.css';
import i18n from './i18n';
import router from './router';
import { setPrototypeOfLocalStorage } from './utils';
import { initDBService } from './services/DBService';
import { migrateSettings } from './composition/settings';
import { dbMigrate } from './services/DBService';

function prepareApp() {
  setPrototypeOfLocalStorage();

  // init db service
  initDBService();
  if (!localStorage.getItem('V3_MIGRATED')) {
    migrateSettings();
    dbMigrate();
  }
}

prepareApp();

const app = createApp(App);
app
  .use(router)
  .use(i18n)
  .component(VueFeather.name || '', VueFeather)
  .mount('#app');

app.config.globalProperties.$mitt = mitt();
