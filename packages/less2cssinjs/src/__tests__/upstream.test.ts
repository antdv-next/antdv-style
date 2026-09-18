import { compileScript, parse } from '@vue/compiler-sfc'
import { describe, expect, it } from 'vitest'
import * as api from '../index'
import { createRequire } from 'node:module'
import { lengths, tokenNames } from '../tokens'
import { upstreamToken } from '../upstream'

const upstream = createRequire(import.meta.url)('@chenshuai2144/less2cssinjs') as {
  less2CssObjectMap: (source: string) => Promise<Map<string, Map<string, string>>>
}

const sfc = (less: string, template = '<div :class="$style.root"><span :class="$style.child" /></div>') =>
  `<template>${template}</template><style module lang="less">${less}</style>`

describe('upstream-backed Vue Less migration', () => {
  it.each(['module', 'module=""', 'module="$style"'])(
    'refuses mixed default module ownership (%s) in all SFC entrypoints',
    async (moduleAttribute) => {
      const less = '<style module lang="less">.root { color: red; }</style>'
      const css = `<style ${moduleAttribute}>.root { color: blue; }</style>`
      for (const styles of [less + css, css + less]) {
        const source = `<template><div :class="$style.root" /></template>${styles}`
        const results = [
          api.transformVueSfcLess(source),
          await api.migrateVueSfcLess(source),
          await api.compileVueSfcLess(source),
        ]
        for (const result of results) {
          expect(result.changed).toBe(false)
          expect(result.code).toBe(source)
          expect(result.diagnostics.some(item => /Mixed.*CSS Modules/.test(item.message))).toBe(true)
        }
      }
    },
  )

  it('keeps separately named non-Less modules and ordinary style blocks', async () => {
    const other = '<style module="other">.root { color: blue; }</style><style>.global { color: green; }</style>'
    const source = `<template><div :class="[$style.root, other.root]" /></template>
<style module lang="less">.root { padding: 8px; }</style>${other}`
    const result = await api.migrateVueSfcLess(source)
    expect(result.diagnostics).toEqual([])
    expect(result.changed).toBe(true)
    expect(result.code).toContain('other.root')
    expect(result.code).toContain(other)
  })

  it('matches every known upstream token mapping while retaining CSS text length units', async () => {
    for (const name of [...Object.keys(tokenNames), 'tag-default-bg', 'border-style-base']) {
      const value = (await upstream.less2CssObjectMap(`.probe { value: @${name}; }`)).get('.probe')!.get('value')!
      const expected = value.startsWith('token.')
        ? value + (lengths.has(value.slice(6)) ? ' + "px"' : '')
        : JSON.stringify(value)
      expect(await upstreamToken(name)).toBe(expected)
    }
  })

  it('maps explicitly configured custom tokens without guessing unknown names', async () => {
    const result = await api.migrateVueSfcLess(sfc('.root { color: @brand; }', '<div :class="$style.root" />'), 'Brand.vue', {
      tokenMap: { brand: 'colorPrimary' },
    })
    expect(result.diagnostics).toEqual([])
    expect(result.code).toContain('token["colorPrimary"]')
  })

  it('uses upstream helper defaults in compile mode but preserves local overrides', async () => {
    const template = '<div :class="$style.root" />'
    const defaults = await api.migrateVueSfcLess(sfc('.root { .textOverflow(); }', template), 'Default.vue', { compileLess: true })
    expect(defaults.diagnostics).toEqual([])
    expect(defaults.code).toContain('text-overflow: ellipsis')
    const local = await api.migrateVueSfcLess(sfc('.textOverflow() { color: red; } .root { .textOverflow(); }', template), 'Local.vue', { compileLess: true })
    expect(local.diagnostics).toEqual([])
    expect(local.code).toContain('color: red')
    expect(local.code).not.toContain('text-overflow')
    const classMixin = await api.migrateVueSfcLess(sfc('.textOverflow { color: red; } .root { .textOverflow(); }', template), 'ClassMixin.vue', { compileLess: true })
    expect(classMixin.diagnostics).toEqual([])
    expect(classMixin.code).not.toContain('text-overflow')
    const listMixin = await api.migrateVueSfcLess(sfc('.other, .textOverflow { color: red; } .root { .textOverflow(); }', template), 'ListMixin.vue', { compileLess: true })
    expect(listMixin.diagnostics).toEqual([])
    expect(listMixin.code).not.toContain('text-overflow')
    const guardedMixin = await api.migrateVueSfcLess(sfc('.textOverflow when (1 = 1) { color: red; } .root { .textOverflow(); }', template), 'GuardedMixin.vue', { compileLess: true })
    expect(guardedMixin.diagnostics).toEqual([])
    expect(guardedMixin.code).not.toContain('text-overflow')
  })

  it('does not generate an unused token parameter for static migrations', async () => {
    const result = await api.migrateVueSfcLess(sfc('.root { content: "token.test"; }', '<div :class="$style.root" />'))
    expect(result.changed).toBe(true)
    expect(result.code).toContain('({ css })')
  })

  it('keeps synchronous exports synchronous and unchanged in their conservative contract', () => {
    const result = api.transformVueSfcLess(sfc('.root { color: red; }', '<div :class="$style.root" />'))
    expect(result.changed).toBe(true)
    expect(result).not.toBeInstanceOf(Promise)
  })
  it('preserves nested local/global selectors, lists, repeated rules and media queries', async () => {
    const result = await api.migrateVueSfcLess(sfc(`
      .root {
        color: @primary-color;
        .child, &:hover > .child { padding: 8px; }
        :global(.ant-btn) { border: @border-width-base solid @border-color-base; }
      }
      .child { color: red; }
      @media (min-width: @screen-md) { .root .child { color: blue; } }
      .child { font-weight: bold; }
    `), 'Nested.vue')
    expect(result.changed).toBe(true)
    expect(result.diagnostics).toEqual([])
    expect(result.code).toContain('token.colorPrimary')
    expect(result.code).toContain('token.screenMD')
    expect(result.code).toContain('.ant-btn')
    expect(result.code).toContain(':where(&)')
    expect(result.code).not.toContain(':where(&)\\n.')
    expect(result.code).not.toMatch(/root :where\(&\)/)
    expect(result.code).toContain('styles.child')
    expect(result.code).toContain('toRefs')
    expect(() => compileScript(parse(result.code).descriptor, { id: 'nested' })).not.toThrow()
  })

  it.each(['textOverflow', 'textOverflowMulti', 'clearfix'])('reuses the upstream %s helper', async (name) => {
    const result = await api.migrateVueSfcLess(sfc(`.root { .${name}(); }`, '<div :class="$style.root" />'))
    expect(result.diagnostics).toEqual([])
    expect(result.changed).toBe(true)
    expect(result.code).toContain(name === 'clearfix' ? 'clear: both' : 'text-overflow: ellipsis')
  })

  it('supports explicit Less compilation with nested selectors', async () => {
    const result = await api.migrateVueSfcLess(sfc(`
      @space: 8px;
      .size(@n) when (@n > 0) { padding: (@space * @n); }
      .root { .child { .size(2); } }
    `), 'Compiled.vue', { compileLess: true })
    expect(result.diagnostics).toEqual([])
    expect(result.changed).toBe(true)
    expect(result.code).toContain('padding: 16px')
  })

  it.each([
    '@import "missing.less"; .root { color: red; }',
    '.root { color: @unknown; }',
    '.root { :deep(.child) { color: red; } }',
    '.root { composes: child; }',
    '.root { background: url("./asset.png"); }',
    '.root { color: lighten(#000, 10%); }',
    ':global(.ant-btn) { color: red; } .root { color: blue; }',
    ':global(.ant-btn):not(.root) { color: red; }',
    '.root { @media (min-width: @screen-md + 100px) { color: red; } }',
    '.root { #target { color: red; } }',
    ':export { width: 10px; } .root { color: red; }',
    '.textOverflow { color: red; } .root { .textOverflow(); }',
    '.other, .textOverflow { color: red; } .root { .textOverflow(); }',
  ])('preserves unsafe or unscopable source: %s', async (less) => {
    const source = sfc(less, '<div :class="$style.root" />')
    const result = await api.migrateVueSfcLess(source)
    expect(result.changed).toBe(false)
    expect(result.code).toBe(source)
    expect(result.diagnostics.length).toBeGreaterThan(0)
  })

  it.each([
    '<template src="./External.html"></template>',
    '<template lang="pug">div(:class="$style.root")</template>',
    '<script setup>import { useCssModule } from "vue"; const s = useCssModule()</script>',
  ])('retains the existing Vue boundary: %s', async (prefix) => {
    const source = `${prefix}<style module lang="less">.root { color: red; }</style>`
    expect((await api.migrateVueSfcLess(source)).code).toBe(source)
  })

  it.each([
    '@import "never-read.less"; .root { color: red; }',
    '@plugin "never-execute.js"; .root { color: red; }',
    '.root { width: `process.exit()`; }',
    '.root { background: data-uri("never-read"); }',
  ])('refuses external effects in compile mode: %s', async (less) => {
    const source = sfc(less, '<div :class="$style.root" />')
    const result = await api.migrateVueSfcLess(source, 'Blocked.vue', { compileLess: true })
    expect(result.changed).toBe(false)
    expect(result.code).toBe(source)
  })
})
