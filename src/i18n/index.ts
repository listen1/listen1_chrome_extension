import { createI18n } from 'vue-i18n';
import store from '../store';
import en_US from './en_US.json';
import fr_FR from './fr_FR.json';
import zh_CN from './zh_CN.json';
import zh_TC from './zh_TC.json';
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
export const setLocale = (language: string): void => {
  i18n.global.locale.value = language;
  store.dispatch('settings/setState', { language });
  const langMap: {[code: string]: string} = {
    'zh-CN': 'zh-Hans',
    'zh-TC': 'zh-Hant',
    'en-US': 'en',
    'fr-FR': 'fr'
  };
  const htmlLang = langMap[language] || document.documentElement.lang;
  document.documentElement.lang = htmlLang;
};
export default i18n;
