import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import Inspector from 'unplugin-vue-dev-locator/vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: '/energy/',
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ['vue', 'vue-router', 'pinia'],
          element: ['element-plus'],
          echarts: ['echarts'],
          icons: ['lucide-vue-next'],
        },
      },
    },
  },
  plugins: [
    vue(),
    command === 'serve' && Inspector(),
  ].filter(Boolean),
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
}))
