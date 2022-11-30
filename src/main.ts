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

setPrototypeOfLocalStorage();

const app = createApp(App);
app
  .use(router)
  .use(i18n)
  .component(VueFeather.name || '', VueFeather)
  .mount('#app');

app.config.warnHandler = () => {
  //
}

app.config.globalProperties.$mitt = mitt();
