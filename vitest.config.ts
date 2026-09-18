import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const mock = fileURLToPath(new URL('./src/__mocks__/antdv-next.ts', import.meta.url))

export default defineConfig({
  test: {
    projects: [
      'packages/*/vitest.config.ts',
      {
        test: {
          name: 'antdv-style',
          globals: true,
          environment: 'happy-dom',
          include: ['src/**/*.test.ts'],
          alias: [
            { find: 'antdv-next/dist/config-provider/context', replacement: mock },
            { find: 'antdv-next', replacement: mock },
          ],
        },
      },
      {
        test: {
          name: 'workspace',
          environment: 'node',
          include: ['tests/**/*.test.ts'],
        },
      },
    ],
  },
})
