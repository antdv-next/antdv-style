import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: { index: 'src/index.ts' },
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  clean: true,
  dts: true,
  format: 'es',
})
