import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import { chromeExtension, simpleReloader } from 'rollup-plugin-chrome-extension';
import zip from 'rollup-plugin-zip';
const production = !process.env.ROLLUP_WATCH;
const NODE_ENV = production ? 'production' : 'development';

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    preventAssignment: true,
    'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
    __VUE_I18N_FULL_INSTALL__: 'false',
    __VUE_I18N_LEGACY_API__: 'false',
    __VUE_I18N_PROD_DEVTOOLS__: 'false',
    __INTLIFY_PROD_DEVTOOLS__: 'false',
    __VUE_OPTIONS_API__: 'false',
    __VUE_PROD_DEVTOOLS__: 'false'
  },
  plugins: [
    chromeExtension({ dynamicImportWrapper: false }),
    vue({ refTransform: true }),
    simpleReloader(),
    production && zip({ dir: 'artifacts' })
  ],
  build: {
    emptyOutDir: true,
    rollupOptions: {
      input: ['src/manifest.ts'],
      output: {
        dir: 'dist',
        format: 'esm',
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
        assetFileNames: `assets/[name].[ext]`
      },
    }
  }
})
