import { describe, expect, it } from 'vitest'
import { parse } from '@babel/parser'
import { compileScript, parse as parseSfc } from '@vue/compiler-sfc'

import { antdvStyleLabel, transformStyleLabels } from '../index'

describe('antdvStyleLabel', () => {
  const source = `import { createStyles } from 'antdv-style'
const useStyles = createStyles(() => ({ root: { color: 'red' } }))`

  it('uses upstream filename normalization and supports default-exported factories', () => {
    const result = transformStyleLabels(
      `import { createStyles as make } from 'antdv-style'; export default make(() => ({}))`,
      '/project/src/cards/Button.styles.ts',
      { root: '/project', labelFormat: 'path' },
    )
    expect(result?.code).toContain('label: "cards-Button"')
  })

  it('includes a portable project-relative source directory in development labels', () => {
    const plugin = antdvStyleLabel()
    plugin.configResolved({ command: 'serve', root: 'D:/project', isProduction: false })
    const output = plugin.transform(source, 'D:\\project\\src\\cards\\Button\\style.ts')
    expect(output?.code).toContain('label: "cards-Button-style-useStyles"')
    expect(output?.code).not.toContain('D:')
    expect(plugin.transform(source, 'D:/project/node_modules/example.ts')).toBeNull()
    expect(plugin.transform(source, 'D:/elsewhere/secret.ts')).toBeNull()
  })

  it('does not inject debug labels in production unless explicitly requested', () => {
    const plugin = antdvStyleLabel()
    plugin.configResolved({ command: 'build', root: '/project', isProduction: true })
    expect(plugin.transform(source, '/project/src/Card.ts')).toBeNull()
    const enabled = antdvStyleLabel({ devOnly: false, labelFormat: 'variable' })
    enabled.configResolved({ command: 'build', root: '/project', isProduction: true })
    expect(enabled.transform(source, '/project/src/Card.ts')?.code).toContain('label: "useStyles"')
  })

  it('uses the agreed Vite plugin name', () => {
    expect(antdvStyleLabel().name).toBe('vite-plugin-antdv-style')
  })

  it.each(['ts', 'mts', 'cts'])('preserves angle-bracket assertions in .%s files', (extension) => {
    const source = `import { createStyles } from 'antdv-style'
const value = <number>1
const useStyles = createStyles(() => ({ root: { opacity: value } }))`
    const result = transformStyleLabels(source, `/src/card.${extension}`)!
    expect(result.code).toContain('label: "useStyles"')
    expect(() => parse(result.code, { sourceType: 'module', plugins: ['typescript'] })).not.toThrow()
  })

  it.each(['script', 'script setup'])('preserves TypeScript assertions in Vue %s', (tag) => {
    const source = `<${tag} lang="ts">
import { createStyles } from 'antdv-style'
const value = <number>1
const useStyles = createStyles(() => ({ root: { opacity: value } }))
</script><template><div /></template>`
    const result = transformStyleLabels(source, '/src/Card.vue')!
    const { descriptor } = parseSfc(result.code)
    expect(result.code).toContain('label: "useStyles"')
    expect(() => compileScript(descriptor, { id: 'assertion' })).not.toThrow()
  })

  it.each(['tsx', 'jsx'])('continues accepting JSX in %s files and SFC scripts', (lang) => {
    const source = `import { createStyles } from 'antdv-style'
const render = () => <div />
const useStyles = createStyles(() => ({}))`
    expect(transformStyleLabels(source, `/src/card.${lang}`)?.code).toContain('label: "useStyles"')
    expect(transformStyleLabels(
      `<script setup lang="${lang}">${source}</script>`,
      '/src/Card.vue',
    )?.code).toContain('label: "useStyles"')
  })

  it.each([
    '() => ({}),',
    '() => ({}), /* trailing */',
    '() => ({}) /* before comma */,',
    '() => ({}) // trailing comment\n,',
    '(() => ({})),',
    '((() => ({}))) /* wrapped */,',
    '() => ({}), { hashPriority: "low", /* trailing */ },',
  ])('preserves valid trailing commas: %s', (args) => {
    const source = `import { createStyles } from 'antdv-style'
const useStyles = createStyles(${args})`
    const result = transformStyleLabels(source, '/src/card.ts')!
    expect(result.code).toContain('label: "useStyles"')
    const ast = parse(result.code, { sourceType: 'module', plugins: ['typescript'] })
    const declaration = ast.program.body[1]
    expect(declaration.type).toBe('VariableDeclaration')
    if (declaration.type !== 'VariableDeclaration') throw new Error('Missing declaration')
    const call = declaration.declarations[0].init
    expect(call?.type).toBe('CallExpression')
    if (call?.type !== 'CallExpression') throw new Error('Missing call')
    expect(call.arguments).toHaveLength(2)
    expect(call.arguments[1].type).toBe('ObjectExpression')

    const vue = transformStyleLabels(
      `<script setup lang="ts">${source}</script><template><div /></template>`,
      '/src/Card.vue',
    )!
    const { descriptor } = parseSfc(vue.code)
    expect(() => compileScript(descriptor, { id: 'trailing' })).not.toThrow()
  })

  it('adds labels to TypeScript createStyles calls', () => {
    const result = transformStyleLabels(
      `
      import { createStyles } from 'antdv-style'
      const useStyles = createStyles(({ css }) => ({ root: css({ color: 'red' }) }))
    `,
      '/src/card.ts',
    )

    expect(result?.code).toContain(`{ label: "useStyles" }`)
  })

  it('supports aliases, existing options, and Vue script setup', () => {
    const result = transformStyleLabels(
      `
<script setup lang="ts">
import { createStyles as makeStyles } from 'antdv-style'
const useCardStyles = makeStyles(() => ({}), { hashPriority: 'low' })
</script>
<template><div /></template>
    `,
      '/src/Card.vue',
    )

    expect(result?.code).toContain(`hashPriority: 'low', label: "useCardStyles"`)
  })

  it('preserves an explicit label', () => {
    const source = `
      import { createStyles } from 'antdv-style'
      const useStyles = createStyles(() => ({}), { label: 'Card' })
    `
    expect(transformStyleLabels(source, '/src/card.ts')).toBeNull()
  })

  it.each(['...shared', '[labelKey]: "manual-label"', '...getOptions()'])(
    'preserves options with unknown label keys: %s', (properties) => {
      const source = `import { createStyles } from 'antdv-style'
const shared = { label: 'manual-label' }
const labelKey = 'label'
const getOptions = () => shared
const useStyles = createStyles(() => ({}), { ${properties} })`
      expect(transformStyleLabels(source, '/src/card.ts')).toBeNull()
    },
  )

  it('does not rewrite a shadowed local createStyles binding', () => {
    const result = transformStyleLabels(
      `
      import { createStyles } from 'antdv-style'
      function build(createStyles: (factory: () => object) => object) {
        const localStyles = createStyles(() => ({}))
        return localStyles
      }
      const useStyles = createStyles(() => ({}))
    `,
      '/src/card.ts',
    )

    expect(result?.code).toContain(`{ label: "useStyles" }`)
    expect(result?.code).not.toContain(`{ label: "localStyles" }`)
  })

  it('keeps global include and exclude regular expressions deterministic', () => {
    const source = `
      import { createStyles } from 'antdv-style'
      const useStyles = createStyles(() => ({}))
    `
    const options = { include: /src/g, exclude: /vendor/g }

    expect(transformStyleLabels(source, '/src/first.ts', options)).not.toBeNull()
    expect(transformStyleLabels(source, '/src/second.ts', options)).not.toBeNull()
  })
})
