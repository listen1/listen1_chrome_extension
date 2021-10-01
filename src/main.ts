import { createApp } from 'vue';
import VueFeather from 'vue-feather';
import App from './App.vue';
import i18n from './i18n';
import router from './router';
import store from './store';
// import "@/assets/main.css"
import { setPrototypeOfLocalStorage } from './utils';

setPrototypeOfLocalStorage();

createApp(App)
  .use(router)
  .use(i18n)
  .use(store)
  .component(VueFeather.name || '', VueFeather)
  .mount('#app');
