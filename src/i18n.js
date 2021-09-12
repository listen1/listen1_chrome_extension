import { createI18n } from 'vue-i18n';
import store from './store/index';
import en_US from './i18n/en_US.json';
import fr_FR from './i18n/fr_FR.json';
import zh_CN from './i18n/zh_CN.json';
import zh_TC from './i18n/zh_TC.json';
const messages = {
  'en-US': en_US,
  'fr-FR': fr_FR,
  'zh-CN': zh_CN,
  'zh-TC': zh_TC
};

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN', // set locale
  fallbackLocale: 'en-US', // set fallback locale
  messages // set locale messages
  // If you need to specify other options, you can set other options
  // ...
});
export const setLocale = (language) => {
  i18n.global.locale.value = language;
  store.dispatch('settings/setState', { language });
  let htmlLang;
  switch (language) {
    case 'zh-CN':
      htmlLang = 'zh-Hans';
      break;
    case 'zh-TC':
      htmlLang = 'zh-Hant';
      break;
    case 'en-US':
      htmlLang = 'en';
      break;
    case 'fr-FR':
      htmlLang = 'fr';
      break;
    default:
      break;
  }
  document.documentElement.lang = htmlLang;
};
export default i18n;
