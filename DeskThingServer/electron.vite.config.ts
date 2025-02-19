/// <reference types="vitest/config" />
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'

const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.ts'),
          expressProcess: resolve(__dirname, 'src/main/utilities/expressProcess.ts')
        }
      }
    },
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
        '@server': resolve('src/main'),
        '@utilities': resolve('src/main/utilities')
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
