import { createApp } from 'vue';
import VueFeather from 'vue-feather';
import App from './App.vue';
import i18n from './i18n';
import router from './router';
import store from './store';

import { setPrototypeOfLocalStorage } from './utils';

if ('serviceWorker' in navigator) {
  // Use the window load event to keep the page load performant
  window.addEventListener('load', () => {
    // let sw = 'sw.js';
    if(import.meta.env.DEV) {
      const sw = 'sw.ts';
      navigator.serviceWorker.register(sw, { type: 'module' });
    }
    
  });
}

setPrototypeOfLocalStorage();

createApp(App)
  .use(router)
  .use(i18n)
  .use(store)
  .component(VueFeather.name || '', VueFeather)
  .mount('#app');
