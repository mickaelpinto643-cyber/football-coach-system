import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const API = 'http' + ':' + '/' + '/' + 'localhost' + ':' + '3001'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: API,
        changeOrigin: true,
      },
      '/uploads': {
        target: API,
        changeOrigin: true,
      },
    },
  },
})
