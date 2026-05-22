import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'app'),
      '#app': path.resolve(__dirname, 'node_modules/nuxt/dist/app/index.js'),
    },
  },
})
