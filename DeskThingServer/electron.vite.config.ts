import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import packageJson from "./package.json" with {type: "json"}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), tailwindcss()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
        '@server': resolve('src/main')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@server': resolve('src/main'),
        '@shared': resolve('src/shared')
      }
    },
    plugins: [react()],
    define: {
      'process.env.PACKAGE_VERSION': JSON.stringify(packageJson.version)
    }
  }
})
