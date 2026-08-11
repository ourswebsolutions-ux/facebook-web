import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://vps.axorawebsolutions.com',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/health': {
        target: ' ',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  preview: {
    host: '127.0.0.1',
    port: 8119,
    allowedHosts: ['buymest.com', 'www.buymest.com'],
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})