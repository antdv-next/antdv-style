/// <reference types="node" />

import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const readManifest = (path: string) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))

const root = readManifest('../package.json')
const runtime = root
const plugin = readManifest('../packages/vite-plugin-antdv-style/package.json')
const codemod = readManifest('../packages/less2cssinjs/package.json')
const parserDependencies = [
  '@babel/parser', '@babel/traverse', '@vue/compiler-dom', '@vue/compiler-sfc',
  'magic-string', 'postcss', 'postcss-less', 'postcss-selector-parser', 'postcss-value-parser',
]
const runtimeParserDependencies = ['postcss', 'postcss-value-parser']

describe('workspace package boundaries', () => {
  it('keeps antdv-style at the repository root', () => {
    expect(root.name).toBe('antdv-style')
    expect(root.private).not.toBe(true)
    expect(root.exports['.'].import).toBe('./dist/index.js')
    expect(root.bin).toBeUndefined()
    expect(existsSync(new URL('../src/index.ts', import.meta.url))).toBe(true)
    expect(existsSync(new URL('../packages/antdv-style', import.meta.url))).toBe(false)
  })

  it.each([
    ['vite-plugin-antdv-style', plugin, 'vite-plugin-antdv-style'],
    ['less2cssinjs', codemod, '@antdv-next/less2cssinjs'],
  ])('defines an independent %s package', (directory, manifest, name) => {
    expect(manifest.name).toBe(name)
    expect(manifest.private).not.toBe(true)
    expect(manifest.exports['.']).toEqual({
      types: './dist/index.d.ts',
      import: './dist/index.js',
      default: './dist/index.js',
    })
    expect(manifest.exports['./package.json']).toBe('./package.json')
    expect(manifest.files).toContain('dist')
    expect(manifest.scripts.build).toBeDefined()
    expect(manifest.scripts.typecheck).toBeDefined()
    expect(existsSync(new URL(`../packages/${directory}/README.md`, import.meta.url))).toBe(true)
    expect(existsSync(new URL(`../packages/${directory}/LICENSE`, import.meta.url))).toBe(true)
  })

  it('does not export any tooling path or CLI from the runtime', () => {
    expect(Object.keys(runtime.exports).sort()).toEqual(['.', './package.json'])
    expect(runtime.bin).toBeUndefined()
    for (const dependency of parserDependencies.filter(name => !runtimeParserDependencies.includes(name))) {
      expect(runtime.dependencies[dependency]).toBeUndefined()
    }
    expect(runtime.dependencies[plugin.name]).toBeUndefined()
    expect(runtime.dependencies[codemod.name]).toBeUndefined()
  })

  it('declares the CSS parsers used by the runtime string transformer', () => {
    for (const dependency of runtimeParserDependencies) {
      expect(runtime.dependencies[dependency]).toBeDefined()
    }
  })

  it('assigns parser dependencies to the tools that import them', () => {
    for (const dependency of parserDependencies.slice(0, 2)) {
      expect(plugin.dependencies[dependency]).toBeDefined()
      expect(codemod.dependencies[dependency]).toBeDefined()
    }
    expect(plugin.dependencies['@vue/compiler-sfc']).toBeDefined()
    expect(plugin.dependencies['magic-string']).toBeDefined()
    for (const dependency of parserDependencies) {
      expect(codemod.dependencies[dependency]).toBeDefined()
    }
    expect(plugin.dependencies['antdv-style']).toBeUndefined()
    expect(codemod.dependencies['antdv-style']).toBeUndefined()
  })

  it('provides the migration CLI only from the migration package', () => {
    expect(codemod.bin['antdv-style-codemod']).toBe('./dist/cli/codemod.js')
    expect(plugin.bin).toBeUndefined()
  })

  it('pins reused upstream implementations only in the tooling packages', () => {
    expect(plugin.dependencies['babel-plugin-antd-style']).toBe('1.0.4')
    expect(codemod.dependencies['@chenshuai2144/less2cssinjs']).toBe('1.0.7')
    expect(runtime.dependencies['babel-plugin-antd-style']).toBeUndefined()
    expect(runtime.dependencies['@chenshuai2144/less2cssinjs']).toBeUndefined()
  })
})
