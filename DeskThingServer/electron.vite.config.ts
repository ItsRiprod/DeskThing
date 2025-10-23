/// <reference types="vitest/config" />
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const _filename = fileURLToPath(import.meta.url)
const __dirname = dirname(_filename)

const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.ts'),
          expressProcess: resolve(__dirname, 'src/main/processes/expressProcess.ts'),
          appProcess: resolve(__dirname, 'src/main/processes/appProcess.ts'),
          pluginProcess: resolve(__dirname, 'src/main/processes/pluginProcess.ts')
        }
      }
    },
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
        '@server': resolve('src/main'),
        '@processes': resolve('src/main/processes')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/preload/index.ts'),
          loading: resolve(__dirname, 'src/preload/loading.ts')
        }
      }
    },
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
    },
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/renderer/index.html'),
          loading: resolve(__dirname, 'src/renderer/loading.html')
        }
      }
    }
  }
})
