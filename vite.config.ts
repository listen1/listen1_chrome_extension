import vueI18n from '@intlify/vite-plugin-vue-i18n';
import vue from '@vitejs/plugin-vue';
import { chromeExtension, simpleReloader } from 'rollup-plugin-chrome-extension';
import zip from 'rollup-plugin-zip';
import { defineConfig, build, ProxyOptions } from 'vite';
import HeaderRules from './headerRules.json';

const { NODE_ENV, BUILD_ELECTRON } = process.env;
const production = NODE_ENV === 'production';
if (process.argv.includes('-w') || process.argv.includes('--watch')) process.env.ROLLUP_WATCH = 'true';

const chromeExtPlugin = chromeExtension();

if (BUILD_ELECTRON) {
  build({
    configFile: 'vite-electron.config.ts',
  });
}

const proxyOptions: { [re: string]: ProxyOptions } = {};
// @ts-ignore: Known JSON
HeaderRules.forEach(rule => {
  rule.pattern.forEach(p => {
    const url = `/${p}`;
    const headers: { [name: string]: string } = {};
    proxyOptions[url] = {
      target: `https://${p.replace('/', '')}`,
      hostRewrite: p.replace('/', ''),
      headers,
      rewrite: (path) => path.replace(/^\/[^/]*\//, '/'),
      secure: false,
      followRedirects: true,
    }

    Object.entries(rule.headers).forEach(([k, v]) =>
      // @ts-ignore: Known JSON
      headers[k.toLowerCase()] = v);
    headers.host = p.replace('/', '');
    if (!headers.origin && headers.referer)
      headers.origin = proxyOptions[url].headers.referer;
  });
});
// console.log(Object.keys(proxyOptions));

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      'vue-i18n': 'vue-i18n/dist/vue-i18n.runtime.esm-bundler.js'
    },
  },
  base: '',
  root: 'src/',
  define: {
    __VUE_I18N_FULL_INSTALL__: 'false',
    __VUE_I18N_LEGACY_API__: 'false',
    __VUE_I18N_PROD_DEVTOOLS__: 'false',
    __INTLIFY_PROD_DEVTOOLS__: 'false',
    __VUE_OPTIONS_API__: 'false',
    __VUE_PROD_DEVTOOLS__: 'false'
  },
  plugins: [
    {
      name: 'inject-css',
      buildStart() {
        const $ = chromeExtPlugin._plugins.html.cache.html$[0];
        $('head').last().append($('<link rel="stylesheet" href="assets/main.css">'));
      },
    },
    // @ts-ignore: Type Mismatch Error
    chromeExtPlugin,
    vueI18n({ include: 'src/i18n/*.json', runtimeOnly: true }),
    vue({ refTransform: true }),
    // @ts-ignore: Type Mismatch Error
    simpleReloader(),
    // @ts-ignore: Type Mismatch Error
    production && zip({ dir: 'artifacts' })
  ],
  server: {
    proxy: proxyOptions
    // {  
    // '^/[a-z0-9.-]+\\.[a-z0-9-]{2,6}/.*': {
    //   configure: (proxy, options) => {
    //     console.log(options.target);
    //     options.target = 'https://c.y.qq.com';
    //     options.headers = {
    //       'Referer': 'https://y.qq.com',
    //       'Origin': 'https://y.qq.com'
    //     };
    //     options.rewrite = (path) => path.replace(/^\/[^/]*\//, '/');
    //     options.secure = false;
    //   }
    // },
    // '/music.163.com/': {
    //   target: 'https://music.163.com',
    //   headers: {
    //     'Referer': 'https://music.163.com',
    //     'Origin': 'https://music.163.com'
    //   },
    //   rewrite: (path) => path.replace(/^\/[^/]*\//, '/'),
    //   secure: false,
    // }
    // }
  },
  build: {
    //we are still in develop here, since sourcemap won't work in extension, it's better not minify the files
    minify: false,
    emptyOutDir: true,
    rollupOptions: {
      external: ['src/assets/main.css'],
      input: ['src/manifest.ts'],
      output: {
        dir: BUILD_ELECTRON ? 'electron_dist/dist' : 'dist',
        format: 'esm',
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
        assetFileNames: `assets/[name].[ext]`
      }
    }
  }
});
