import { defineConfig } from "vitest/config"
import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'node:path'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
    test:{
         globals: true,
    environment: 'happy-dom',
    alias: {
      // In test environment, use mock for antdv-next (peerDependency not installed locally)
      'antdv-next': resolve(__dirname, 'src/__mocks__/antdv-next.ts'),
    },
    }
})