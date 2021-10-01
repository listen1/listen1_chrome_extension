import { createApp } from 'vue';
import VueFeather from 'vue-feather';
import App from './App.vue';
import i18n from './i18n';
import router from './router';
import store from './store';
// import "@/assets/main.css"

function setPrototypeOfLocalStorage() {
  const proto = Object.getPrototypeOf(localStorage);
  proto.getObject = function getObject(key: any) {
    const value = this.getItem(key);
    return value && JSON.parse(value);
  };
  proto.setObject = function setObject(key: any, value: any) {
    this.setItem(key, JSON.stringify(value));
  };
  Object.setPrototypeOf(localStorage, proto);
}
setPrototypeOfLocalStorage();

createApp(App)
  .use(router)
  .use(i18n)
  .use(store)
  .component(VueFeather.name || '', VueFeather)
  .mount('#app');
