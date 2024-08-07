import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';
import legacy from '@vitejs/plugin-legacy';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://192.168.7.1:8891',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  plugins: [
    react(),
    legacy({
      targets: ['Chrome 69'], // Specify the browsers you want to support
}),
  ],
  resolve: {
    alias: {
      '@spotify-internal/encore-web': path.resolve('./@spotify-internal/encore-web'),
    },
  },
  base: '/usr/share/qt-superbird-app/webapp/',
})
