import { createApp } from 'vue';
import VueFeather from 'vue-feather';
import mitt from 'mitt';
import App from './App.vue';
import i18n from './i18n';
import router from './router';

import 'notyf/notyf.min.css';
import './assets/css/icon.css';
import './assets/css/index.css';

import { setPrototypeOfLocalStorage } from './utils';

setPrototypeOfLocalStorage();

const app = createApp(App);
app
  .use(router)
  .use(i18n)
  .component(VueFeather.name || '', VueFeather)
  .mount('#app');

app.config.globalProperties.$mitt = mitt();
