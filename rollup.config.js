import VueI18nPlugin from '@intlify/rollup-plugin-vue-i18n';
import commonjs from '@rollup/plugin-commonjs';
import image from '@rollup/plugin-image';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import vue from '@vitejs/plugin-vue';
import { chromeExtension, simpleReloader } from 'rollup-plugin-chrome-extension';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import postcss from 'rollup-plugin-postcss';
export default {
  input: ['src/manifest.json', 'src/index.html'],
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
    replace({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    json({ exclude: ['src/i18n/**'] }),
    simpleReloader(),
    // the plugins below are optional
    commonjs(),
    nodePolyfills()
  ]
};
