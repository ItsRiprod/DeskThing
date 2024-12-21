import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    },
    alias: {
      '@renderer': resolve('src/renderer/src'),
      '@server': resolve('src/main'),
      '@shared': resolve('src/shared')
    }
  }
})
