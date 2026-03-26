/// <reference types="vitest/config" />
import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'unplugin-dts/vite'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*'],
      outDirs: 'dist',
      exclude: ["__tests__/**/*", "src/**/*.test.ts", "src/**/*.spec.ts", "__mocks__/**/*"],
      // rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue', 'antdv-next'],
    },
  },
})
