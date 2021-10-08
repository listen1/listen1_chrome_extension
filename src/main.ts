import { createApp } from 'vue';
import VueFeather from 'vue-feather';
import App from './App.vue';
import i18n from './i18n';
import router from './router';
import store from './store';
import axios from 'axios';
// import "@/assets/main.css"
import { setPrototypeOfLocalStorage } from './utils';

setPrototypeOfLocalStorage();
if (import.meta.env.DEV) {
  axios.interceptors.request.use((config) => {
    config.url = config.url?.replace('https://', '/').replace('http://', '/');
    return config;
  });
}

createApp(App)
  .use(router)
  .use(i18n)
  .use(store)
  .component(VueFeather.name || '', VueFeather)
  .mount('#app');
