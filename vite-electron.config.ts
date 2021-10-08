import { defineConfig } from 'vite';
import copy from 'rollup-plugin-copy';
// https://vitejs.dev/config/
export default defineConfig({
  build: {
    minify: false,
    rollupOptions: {
      // @ts-ignore: Rollup Plugin Type Mismatch
      plugins: [copy({ targets: [{ src: 'electron_src/preload.js', dest: 'electron_dist' }] })],
      input: 'electron_src/main.js',
      external: ['electron'],
      output: {
        manualChunks: null,
        dir: null,
        file: 'electron_dist/main.js',
        format: 'cjs'
      }
    }
  }
});
