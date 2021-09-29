import vueI18n from '@intlify/vite-plugin-vue-i18n';
import vue from '@vitejs/plugin-vue';
import { chromeExtension, simpleReloader } from 'rollup-plugin-chrome-extension';
import zip from 'rollup-plugin-zip';
import { defineConfig } from 'vite';
const { NODE_ENV } = process.env;
const production = NODE_ENV === 'production';
// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      'vue-i18n': 'vue-i18n/dist/vue-i18n.runtime.esm-bundler.js'
    }
  },
  define: {
    __VUE_I18N_FULL_INSTALL__: 'false',
    __VUE_I18N_LEGACY_API__: 'false',
    __VUE_I18N_PROD_DEVTOOLS__: 'false',
    __INTLIFY_PROD_DEVTOOLS__: 'false',
    __VUE_OPTIONS_API__: 'false',
    __VUE_PROD_DEVTOOLS__: 'false'
  },
  plugins: [
    chromeExtension(),
    vueI18n({ include: 'src/i18n/*.json', runtimeOnly: true }),
    vue({ refTransform: true }),
    simpleReloader(),
    production && zip({ dir: 'artifacts' })
  ],
  build: {
    //we are still in develop here, since sourcemap won't work in extension, it's better not minify the files
    minify: false,
    emptyOutDir: true,
    rollupOptions: {
      input: ['src/manifest.ts'],
      output: {
        dir: 'dist',
        format: 'esm',
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
        assetFileNames: `assets/[name].[ext]`
      }
    }
  }
});