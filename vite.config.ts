import vueI18n from '@intlify/vite-plugin-vue-i18n';
import vue from '@vitejs/plugin-vue';
import { chromeExtension, simpleReloader } from 'rollup-plugin-chrome-extension';
import zip from 'rollup-plugin-zip';
import { defineConfig, build } from 'vite';
import HeaderRules from './headerRules.json';

import fs from 'fs';
import http from 'http';
import httpProxy from 'http-proxy';

const { NODE_ENV, BUILD_ELECTRON } = process.env;
const production = NODE_ENV === 'production';
if (process.argv.includes('-w') || process.argv.includes('--watch')) process.env.ROLLUP_WATCH = 'true';

const chromeExtPlugin = chromeExtension();

if (BUILD_ELECTRON) {
  build({
    configFile: 'vite-electron.config.ts',
  });
}

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
    {
      name: 'listen1-proxy',
      apply: 'serve',
      buildStart() {
        const proxy = httpProxy.createProxyServer({});
        const server = http.createServer((req, res) => {
          const pathArray = req.url.split('/');
          const protocol = pathArray[2];
          const host = pathArray[4];
          const host2 = host + '/';
          req.url = `${protocol}//${pathArray.slice(4).join('/')}`;
          const matchedRule = HeaderRules.find((rule) =>
            rule.pattern.some((p) => host2.includes(p))
          );
          const proxyHeaders: { [header: string]: string } = {};
          Object.entries(req.headers).forEach(([key, val]) => { // Array is filtered
            if (typeof val === 'string')
              proxyHeaders[key] = val;
          });
          if (matchedRule) {
            Object.entries(matchedRule.headers).forEach(
              ([key, val]) => {
                proxyHeaders[key.toLowerCase()] = val;
                req.headers[key.toLowerCase()] = val;
              }
            )
          }
          if (!proxyHeaders.origin && proxyHeaders.referer)
            proxyHeaders.origin = proxyHeaders.referer;
          proxy.web(req, res, {
            target: `${protocol}//${host}`,
            headers: proxyHeaders,
            hostRewrite: host,
            followRedirects: true,
            secure: false,
          }, (err, req, res,) => {
            console.log(err.message);
            console.log(req.url);
            console.log(res.statusCode);
          });
        });

        server.listen(3001);
      }
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
    proxy: {
      '/proxy': {
        target: 'http://localhost:3001',
      }
    },
    https: {
      key: fs.readFileSync(__dirname + '/cert/localhost.key') || '',
      cert: fs.readFileSync(__dirname + '/cert/localhost.pem') || '',
    }
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
