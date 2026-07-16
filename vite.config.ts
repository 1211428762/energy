import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import Inspector from 'unplugin-vue-dev-locator/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/energy/',
  build: {
    sourcemap: 'hidden',
  },
  plugins: [
    vue(),
    Inspector(),
  ],
  resolve: {
    dedupe: ['vue'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      vue: path.resolve(__dirname, './node_modules/vue/dist/vue.runtime.esm-bundler.js'),
    },
  },
  optimizeDeps: {
    force: true,
  },
})
