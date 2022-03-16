import type { ManifestV2, ManifestV3 } from 'rollup-plugin-chrome-extension';
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
    '*://*.taihe.com/*',
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
    scripts: ['background.ts'],
    persistent: true
  },
  browser_action: {
    default_icon: 'images/logo.png',
    default_title: 'Listen1 Next'
  },
  content_scripts: [
    {
      matches: ['https://listen1.github.io/listen1/*'],
      js: ['oauth_callback.ts']
    }
  ],
  web_accessible_resources: ['assets/fonts/*', 'images/*', 'index.html']
};
const mv3: ManifestV3 = {
  name: 'Listen 1',
  version: '3.0.0',
  manifest_version: 3,
  homepage_url: 'https://github.com/listen1',
  description: 'One for all free music in China',
  background: {
    service_worker: 'serviceWorker.ts'
  },
  action: {
    default_icon: { '128': 'images/logo.png' },
    default_title: 'Listen 1'
  },
  icons: { '128': 'images/logo.png', '16': 'images/logo_16.png', '48': 'images/logo_48.png' },
  permissions: ['notifications', 'unlimitedStorage', 'cookies', 'declarativeNetRequest', 'tabs'],
  host_permissions: [
    '*://music.163.com/*',
    '*://*.music.163.com/*',
    '*://*.qq.com/*',
    '*://*.kugou.com/*',
    '*://*.kuwo.cn/*',
    '*://*.bilibili.com/*',
    '*://*.bilivideo.com/*',
    '*://*.migu.cn/*',
    '*://*.taihe.com/*',
    '*://api.github.com/*',
    '*://github.com/*',
    '*://gist.githubusercontent.com/*'
  ],
  declarative_net_request: {
    rule_resources: [
      {
        id: 'ruleset_1',
        enabled: true,
        path: 'rules.json'
      }
    ]
  },
  //it seem that rollup chrome extension will append `import-` on content script while not changing the original name, so make a copy here
  web_accessible_resources: [{ resources: ['images/*', 'rules.json', 'import-oauth_callback.js'], matches: ['<all_urls>'] }],
  content_scripts: [
    {
      matches: ['https://listen1.github.io/listen1/*'],
      js: ['oauth_callback.ts']
    }
  ]
};
export default process.env.mv3 ? mv3 : mv2;
