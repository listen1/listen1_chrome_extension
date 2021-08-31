import { createI18n } from 'vue-i18n';

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
export default i18n;
