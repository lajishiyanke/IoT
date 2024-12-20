import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  server: {
    host: "0.0.0.0",
    port: "3000",
    proxy: {
      '/api': {
        target: 'https://tbwufhpdfuoz.sealoshzh.site',
        changeOrigin: true,
        secure: true,
        ws: true,
        headers: {
          'Origin': 'https://tbwufhpdfuoz.sealoshzh.site'
        },
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})
