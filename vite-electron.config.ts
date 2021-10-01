import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    minify: false,
    rollupOptions: {
      input: 'electron_src/main.js',
      external: ['electron'],
      output: {
        manualChunks: null,
        dir: null,
        file: 'electron_dist/main.js',
        format: 'cjs',
      }
    }
  }
});
