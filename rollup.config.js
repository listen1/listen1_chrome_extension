import VueI18nPlugin from '@intlify/rollup-plugin-vue-i18n';
import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import image from '@rollup/plugin-image';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import vue from '@vitejs/plugin-vue';
import { chromeExtension, simpleReloader } from 'rollup-plugin-chrome-extension';
import { emptyDir } from 'rollup-plugin-empty-dir';
import postcss from 'rollup-plugin-postcss';
import zip from 'rollup-plugin-zip';
import typescript from '@rollup/plugin-typescript';

const production = !process.env.ROLLUP_WATCH;
const NODE_ENV = production ? 'production' : 'development';
export default {
  input: ['src/manifest.ts'],
  output: {
    dir: 'dist',
    format: 'esm'
  },
  plugins: [
    emptyDir(),
    chromeExtension(),
    vue({ refTransform: true }),
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
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
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
    typescript(),
    production && zip({ dir: 'artifacts' })
  ]
};
