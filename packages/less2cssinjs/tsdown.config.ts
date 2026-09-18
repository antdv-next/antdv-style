import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'cli/codemod': 'src/cli/codemod.ts',
  },
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  clean: true,
  dts: true,
  format: 'es',
})
