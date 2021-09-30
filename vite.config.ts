import vueI18n from '@intlify/vite-plugin-vue-i18n';
import vue from '@vitejs/plugin-vue';
import { chromeExtension, simpleReloader } from 'rollup-plugin-chrome-extension';
import zip from 'rollup-plugin-zip';
import { defineConfig, build } from 'vite';

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
    // @ts-ignore: Type Mismatch Error
    chromeExtPlugin,
    vueI18n({ include: 'src/i18n/*.json', runtimeOnly: true }),
    vue({ refTransform: true }),
    // @ts-ignore: Type Mismatch Error
    simpleReloader(),
    production && zip({ dir: 'artifacts' })
  ],
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
