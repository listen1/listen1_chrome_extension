import VueI18nPlugin from '@intlify/rollup-plugin-vue-i18n';
import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import image from '@rollup/plugin-image';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import vue from '@vitejs/plugin-vue';
import { chromeExtension, simpleReloader } from 'rollup-plugin-chrome-extension';
import clear from 'rollup-plugin-clear';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import postcss from 'rollup-plugin-postcss';
import zip from 'rollup-plugin-zip';
const development = process.env.BUILD === 'development';
export default {
  input: ['src/manifest.ts'],
  output: {
    dir: 'dist',
    format: 'esm'
  },
  plugins: [
    // always put chromeExtension() before other plugins
    chromeExtension(),
    vue({ refTransform: 'vue' }),
    VueI18nPlugin({
      include: 'src/i18n/**',
      forceStringify: true
    }),
    resolve({ browser: true }),
    image(),
    postcss(),
    alias({
      entries: {
        'vue-i18n': 'vue-i18n/dist/vue-i18n.runtime.esm-bundler.js'
      }
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify(process.env.BUILD),
      __VUE_I18N_FULL_INSTALL__: 'false',
      __VUE_I18N_LEGACY_API__: 'false',
      __VUE_I18N_PROD_DEVTOOLS__: 'false',
      __INTLIFY_PROD_DEVTOOLS__: 'false',
      __VUE_OPTIONS_API__: 'false',
      __VUE_PROD_DEVTOOLS__: 'false'
    }),
    json({ exclude: ['src/i18n/**'] }),
    simpleReloader(),
    // the plugins below are optional
    commonjs(),
    nodePolyfills(),
    development ? null : zip({ dir: 'artifacts' }),
    development ? null : clear({ targets: ['dist'] })
  ]
};
