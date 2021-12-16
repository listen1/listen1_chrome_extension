import type { ManifestV2 } from 'rollup-plugin-chrome-extension';
const mv2: ManifestV2 = {
  name: 'Listen 1 Next',
  manifest_version: 2,
  homepage_url: 'https://github.com/listen1',
  description: 'one for all free music in china',
  permissions: [
    'notifications',
    'unlimitedStorage',
    'cookies',
    'tabs',
    '*://music.163.com/*',
    '*://*.music.163.com/*',
    '*://*.xiami.com/*',
    '*://*.qq.com/*',
    '*://*.kugou.com/',
    '*://*.kuwo.cn/',
    '*://*.bilibili.com/*',
    '*://*.bilivideo.com/*',
    '*://*.migu.cn/*',
    '*://api.github.com/*',
    '*://github.com/*',
    '*://gist.githubusercontent.com/*',
    'webRequest',
    'webRequestBlocking'
  ],
  icons: {
    '128': 'images/logo.png',
    '16': 'images/logo_16.png',
    '48': 'images/logo_48.png'
  },
  background: {
    scripts: ['background.js'],
    persistent: true
  },
  browser_action: {
    default_icon: 'images/logo.png',
    default_title: 'Listen1 Next'
  },
  content_scripts: [{
    "matches": ["https://listen1.github.io/listen1/*"],
    "js": ["oauth_callback.ts"]
  }],
  web_accessible_resources: ['assets/fonts/*', 'images/*', 'index.html'],
};
export default mv2;
