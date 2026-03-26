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
      outDirs: 'dist/types',
      // rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => format === 'es' ? 'es/index.mjs' : 'lib/index.cjs',
    },
    rollupOptions: {
      external: ['vue', 'antdv-next'],
    },
  },
})
