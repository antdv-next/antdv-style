import { compileScript, compileTemplate, parse } from '@vue/compiler-sfc'
import { describe, expect, it } from 'vitest'

import { transformLessToCreateStyles, transformVueSfcLess, compileVueSfcLess } from '../index'

describe('Less codemod', () => {
  it('preserves units for important token lengths and never treats prototype names as tokens', () => {
    const result = transformLessToCreateStyles('.root { border-width: @border-width-base !important; --gap: @font-size-base; }')
    expect(result.diagnostics).toEqual([])
    expect(result.styles).toContain('token.lineWidth + "px"')
    expect(result.styles).toContain('token.fontSize + "px"')
    expect(transformLessToCreateStyles('.root { color: @toString; }').diagnostics.length).toBeGreaterThan(0)
  })
  it('maps supported Ant Design Less tokens to reactive Vue theme styles', () => {
    const result = transformVueSfcLess(`<template><div :class="$style.root" /></template>
<style module lang="less">.root { color: @primary-color; border: @border-width-base solid @border-color-base; }</style>`)
    expect(result.diagnostics).toEqual([])
    expect(result.code).toContain('token.colorPrimary')
    expect(result.code).toContain('token.lineWidth')
    expect(result.code).toContain('token.colorBorder')
    expect(result.code).toContain("from 'vue'")
    expect(result.code).toContain('toRefs')
    const { descriptor } = parse(result.code)
    expect(() => compileScript(descriptor, { id: 'theme' })).not.toThrow()
  })

  it('compiles local Less variables, functions, mixins, guards and loops when explicitly requested', async () => {
    const result = await compileVueSfcLess(`<template><div :class="$style.root" /></template>
<style module lang="less">
@space: 8px;
.size(@n) when (@n > 0) { padding: (@n * @space); color: lighten(#000, 20%); }
.root { .size(2); }
.columns(@i) when (@i > 0) { .col-@{i} { width: (@i * 10px); } .columns(@i - 1); }
.columns(2);
</style>`)
    expect(result.diagnostics).toEqual([])
    expect(result.changed).toBe(true)
    expect(result.code).toContain('padding: 16px')
    expect(result.code).toContain('color: #333333')
    expect(result.code).toContain('"col-2"')
  })

  it.each([
    '@import "never-read.less"; .root { color: red; }',
    '@plugin "never-execute.js"; .root { color: red; }',
    '.root { width: `process.exit()`; }',
    '.root { background: data-uri("never-read.txt"); }',
    '.root { background: url("./asset.png"); }',
  ])('refuses compilation with external effects or unresolved assets: %s', async (less) => {
    const source = `<template><div :class="$style.root" /></template><style module lang="less">${less}</style>`
    const result = await compileVueSfcLess(source)
    expect(result.changed).toBe(false)
    expect(result.code).toBe(source)
    expect(result.diagnostics.length).toBeGreaterThan(0)
  })

  it('preserves original source if compiled CSS fails the migration safety checks', async () => {
    const source = `<template src="./External.html"></template><style module lang="less">@c: red; .root { color: @c; }</style>`
    const result = await compileVueSfcLess(source)
    expect(result.changed).toBe(false)
    expect(result.code).toBe(source)
  })

  it.each([
    '<template src="./External.html"></template>',
    '<template src=""></template>',
    '<template lang="pug">\ndiv(:class="$style.root") Hello\n</template>',
    '<template lang="haml">\n%div Hello\n</template>',
  ])('refuses templates that cannot be inspected as inline HTML: %s', (template) => {
    const source = `${template}
<style module lang="less">.root { color: red; }</style>
<style>.unrelated { color: blue; }</style>`
    const result = transformVueSfcLess(source, 'Template.vue')

    expect(result.changed).toBe(false)
    expect(result.code).toBe(source)
    expect(result.diagnostics.some(item => /template/i.test(item.message))).toBe(true)
  })

  it.each(['', ' lang="html"'])('still migrates inline HTML templates: %s', (attributes) => {
    const result = transformVueSfcLess(`<template${attributes}><div :class="$style.root" /></template>
<style module lang="less">.root { color: red; }</style>`)

    expect(result.changed).toBe(true)
    expect(result.diagnostics).toEqual([])
    expect(result.code).toContain(':class="styles.root"')
    const { descriptor, errors } = parse(result.code)
    expect(errors).toEqual([])
    expect(() => compileScript(descriptor, { id: 'inline-html' })).not.toThrow()
  })

  it.each([
    'export default { setup() { return { title: "existing setup" } } }',
    'export default { setup: () => ({ title: "existing setup" }) }',
    'export default { get setup() { return existing } }',
    'export default { ["setup"]() { return {} } }',
    'export default { ...options }',
    'export default { mixins: [existing] }',
    'export default { extends: existing }',
    'export default existing',
    'export { existing as default }',
    'import { defineComponent } from "vue"; export default defineComponent({ setup() { return {} } })',
    'import { defineComponent } from "vue"; export default defineComponent({ ...base })',
    'import { defineComponent } from "vue"; export default defineComponent({ mixins: [existing] })',
    'export default defineComponent(() => () => null)',
  ])('refuses classic scripts that cannot safely accept script setup: %s', (script) => {
    const source = `<script lang="ts">${script}</script>
<template><div :class="$style.root">{{ title }}</div></template>
<style module lang="less">.root { color: red; }</style>`
    const result = transformVueSfcLess(source)
    expect(result.changed).toBe(false)
    expect(result.code).toBe(source)
    expect(result.diagnostics.some(item => item.message.includes('setup'))).toBe(true)
  })

  it.each([
    'export default { name: "Card", props: ["title"] }',
    'import { defineComponent as define } from "vue"; export default define({ name: "Card" })',
    'export * from "./other"',
  ])('preserves provably safe classic options: %s', (script) => {
    const result = transformVueSfcLess(`<script lang="ts">${script}</script>
<template><div :class="$style.root" /></template>
<style module lang="less">.root { color: red; }</style>`)
    expect(result.changed).toBe(true)
    const { descriptor } = parse(result.code)
    expect(() => compileScript(descriptor, { id: 'safe-classic' })).not.toThrow()
  })

  it.each([
    '@media (min-width: (500px + 100px))',
    '@media (min-width: (500px+100px))',
    '@media (min-width: (500px / 2))',
    '@media (min-width: (500px))',
    '@media (aspect-ratio: 16 / 9 / 2)',
    '@container card (width > (500px - 100px))',
    '@supports (width: percentage(0.5))',
    '@supports (color: lighten(#000, 10%))',
    '@supports (font: (16px / 2) Arial)',
  ])('refuses unresolved Less parameters without rewriting: %s', (condition) => {
    const source = `<template><div :class="$style.root" /></template>
<style module lang="less">.root { ${condition} { color: red; } }</style>`
    const result = transformVueSfcLess(source)
    expect(result.changed).toBe(false)
    expect(result.code).toBe(source)
    expect(result.diagnostics.some(item => item.message.includes('parameters'))).toBe(true)
  })

  it.each([
    '@media (min-width: 600px)',
    '@media (400px < width < 1200px)',
    '@media (aspect-ratio: 16/9)',
    '@media (width > calc(500px + 100px))',
    '@container card (width > 600px)',
    '@supports (display: grid)',
    '@supports (width: calc(100% - 16px))',
    '@supports (color: rgb(0 0 0 / .5))',
    '@supports (font: 16px/1.5 Arial)',
    '@supports (border-radius: 16px / 32px)',
    '@supports selector(:has(> .child))',
    '@layer components',
  ])('keeps native CSS conditional parameters: %s', (condition) => {
    const result = transformLessToCreateStyles(`.root { ${condition} { color: red; } }`)
    expect(result.diagnostics).toEqual([])
    expect(result.styles).toContain(JSON.stringify(condition))
  })

  it.each([
    'url("./asset.png")',
    "url('../asset.png')",
    'url(asset.png)',
    'url("/src/asset.png")',
    'url("~assets/asset.png")',
    'image-set("./asset.png" 1x, "./asset@2x.png" 2x)',
    'image-set(url("./asset.png") 1x)',
  ])('preserves asset URLs requiring bundler resolution: %s', (value) => {
    const source = `<template><div :class="$style.root" /></template>
<style module lang="less">.root { background-image: ${value}; }</style>`
    const result = transformVueSfcLess(source)
    expect(result.changed).toBe(false)
    expect(result.code).toBe(source)
    expect(result.diagnostics.some(item => item.message.includes('asset URL'))).toBe(true)
  })

  it.each([
    'url("https://example.com/asset.png")',
    'url("//example.com/asset.png")',
    'url("data:image/png;base64,AAAA")',
    'url("#mask")',
    'image-set("https://example.com/asset.png" 1x)',
  ])('preserves self-contained URLs: %s', (value) => {
    const result = transformLessToCreateStyles(`.root { background-image: ${value}; }`)
    expect(result.diagnostics).toEqual([])
    expect(result.styles).toContain(JSON.stringify(value))
  })

  it('refuses scoped CSS Modules without partially migrating other blocks', () => {
    const source = `<template><div :class="$style.root"><Child /></div></template>
<style module lang="less">.other { color: blue; }</style>
<style scoped module lang="less">.root { button { color: red; } }</style>`
    const result = transformVueSfcLess(source)
    expect(result.changed).toBe(false)
    expect(result.code).toBe(source)
    expect(result.diagnostics.some(item => item.message.includes('scoped'))).toBe(true)
  })

  it.each([
    '.root { color: lighten(#000, 10%); }',
    '.root { width: percentage(0.5); }',
    '.root { color: rgb(red(#123456), 0, 0); }',
    '.root { width: (10px + 2px); }',
    '.root { color: v-bind(color); }',
    '.root { color: rgba(#000, 0.5); }',
    '.root { filter: saturate(red, 50%); }',
    '.root { width: 10px * 2; }',
    '.root { .child { color: red; } } .child { font-weight: bold; }',
    '.root { &:is(.child) { color: red; } } .child { color: blue; }',
  ])('preserves unsupported input: %s', (less) => {
    const source = `<template><div :class="$style.root" /></template>
<style module lang="less">${less}</style>`
    const result = transformVueSfcLess(source)
    expect(result.changed).toBe(false)
    expect(result.code).toBe(source)
    expect(result.diagnostics.length).toBeGreaterThan(0)
  })

  it('keeps browser-native CSS functions and quoted function-like text', () => {
    const result = transformLessToCreateStyles(`.root {
      color: rgb(10, 20, 30);
      width: calc(100% - var(--gap, 8px));
      background: linear-gradient(red, blue);
      transform: translateX(2px);
      content: "lighten(#000, 10%)";
    }`)
    expect(result.diagnostics).toEqual([])
    expect(result.styles).toContain('calc(100% - var(--gap, 8px))')
  })

  it('preserves single-quoted template attributes with hyphenated class names', () => {
    const result = transformVueSfcLess(`<template><div :class='$style["card-root"]' /></template>
<style module lang="less">.card-root { color: red; }</style>`)
    expect(result.changed).toBe(true)
    const { descriptor, errors } = parse(result.code)
    expect(errors).toEqual([])
    const compiled = compileTemplate({ source: descriptor.template!.content, filename: 'Card.vue', id: 'card' })
    expect(compiled.errors).toEqual([])
    expect(compiled.code).toContain('card-root')
  })

  it('converts safe top-level class rules and nested selectors', () => {
    const result = transformLessToCreateStyles(`
.root {
  color: red;
  &:hover { color: blue; }
}
    `)

    expect(result.diagnostics).toEqual([])
    expect(result.styles).toContain('"root": css(')
    expect(result.styles).toContain('"&:hover"')
  })

  it('rewrites Vue CSS module references and removes the Less block', () => {
    const result = transformVueSfcLess(
      `
<template><div :class="$style.root">Hello</div></template>
<style module lang="less">
.root { color: red; }
</style>
    `,
      'Card.vue',
    )

    expect(result.diagnostics).toEqual([])
    expect(result.changed).toBe(true)
    expect(result.code).toContain(`from 'antdv-style'`)
    expect(result.code).toContain(':class="styles.root"')
    expect(result.code).not.toContain('<style module lang="less">')

    const { descriptor, errors } = parse(result.code, { filename: 'Card.vue' })
    expect(errors).toEqual([])
    expect(() => compileScript(descriptor, { id: 'card' })).not.toThrow()
  })

  it('refuses Less variables instead of producing an unsafe rewrite', () => {
    const result = transformVueSfcLess(
      `
<template><div :class="$style.root" /></template>
<style module lang="less">
@brand: red;
.root { color: @brand; }
</style>
    `,
      'Card.vue',
    )

    expect(result.changed).toBe(false)
    expect(result.diagnostics.length).toBeGreaterThan(0)
  })

  it('refuses dynamic CSS module access', () => {
    const result = transformVueSfcLess(
      `
<template><div :class="$style[currentClass]" /></template>
<style module lang="less">
.root { color: red; }
</style>
    `,
      'Card.vue',
    )

    expect(result.changed).toBe(false)
    expect(result.diagnostics.some(item => item.message.includes('Dynamic'))).toBe(true)
  })

  it('rewrites hyphenated class names with bracket access', () => {
    const result = transformVueSfcLess(
      `
<template><div :class="$style['card-root']" /></template>
<style module lang="less">
.card-root { color: red; }
</style>
    `,
      'Card.vue',
    )

    expect(result.diagnostics).toEqual([])
    expect(result.code).toContain(`:class="styles['card-root']"`)

    const { descriptor, errors } = parse(result.code, { filename: 'Card.vue' })
    expect(errors).toEqual([])
    expect(() => compileScript(descriptor, { id: 'card' })).not.toThrow()
  })

  it('refuses named and script-side CSS Module access', () => {
    const named = transformVueSfcLess(
      `
<template><div :class="classes.root" /></template>
<style module="classes" lang="less">
.root { color: red; }
</style>
    `,
      'Named.vue',
    )
    const scriptSide = transformVueSfcLess(
      `
<script setup lang="ts">
import { useCssModule } from 'vue'
const classes = useCssModule()
</script>
<template><div :class="classes.root" /></template>
<style module lang="less">
.root { color: red; }
</style>
    `,
      'Script.vue',
    )

    expect(named.changed).toBe(false)
    expect(named.diagnostics.some(item => item.message.includes('Named'))).toBe(true)
    expect(scriptSide.changed).toBe(false)
    expect(scriptSide.diagnostics.some(item => item.message.includes('Script-side'))).toBe(true)
  })

  it('refuses Vue deep/global selectors and unsupported Less at-rules', () => {
    const deep = transformVueSfcLess(
      `
<template><div :class="$style.root" /></template>
<style module lang="less">
.root { :deep(.child) { color: red; } }
</style>
    `,
      'Deep.vue',
    )
    const conditional = transformVueSfcLess(
      `
<template><div :class="$style.root" /></template>
<style module lang="less">
.root { @supports-dark() { color: red; } }
</style>
    `,
      'Conditional.vue',
    )

    expect(deep.changed).toBe(false)
    expect(deep.diagnostics.some(item => item.message.includes('scoped/global'))).toBe(true)
    expect(conditional.changed).toBe(false)
    expect(conditional.diagnostics.length).toBeGreaterThan(0)
  })

  it('only rewrites $style references inside Vue expressions', () => {
    const result = transformVueSfcLess(
      `
<template>
  <div title="$style.root" :class="$style.root">$style.root</div>
</template>
<style module lang="less">
.root { color: red; }
</style>
    `,
      'StaticText.vue',
    )

    expect(result.diagnostics).toEqual([])
    expect(result.code).toContain(`title="$style.root"`)
    expect(result.code).toContain(`:class="styles.root"`)
    expect(result.code).toContain(`>$style.root</div>`)
  })

  it('refuses duplicate CSS keys instead of changing cascade semantics', () => {
    const duplicateClass = transformVueSfcLess(
      `
<template><div :class="$style.root" /></template>
<style module lang="less">
.root { color: red; }
.root { background: white; }
</style>
    `,
      'DuplicateClass.vue',
    )
    const duplicateProperty = transformVueSfcLess(
      `
<template><div :class="$style.root" /></template>
<style module lang="less">
.root { color: red; color: blue; }
</style>
    `,
      'DuplicateProperty.vue',
    )

    expect(duplicateClass.changed).toBe(false)
    expect(duplicateClass.diagnostics.some(item => item.message.includes('Duplicate class'))).toBe(
      true,
    )
    expect(duplicateProperty.changed).toBe(false)
    expect(
      duplicateProperty.diagnostics.some(item => item.message.includes('Duplicate property')),
    ).toBe(true)
  })

  it('refuses Less variables in at-rule params and CSS Modules composes', () => {
    const mediaVariable = transformVueSfcLess(
      `
<template><div :class="$style.root" /></template>
<style module lang="less">
.root { @media (min-width: @breakpoint) { color: red; } }
</style>
    `,
      'Media.vue',
    )
    const composes = transformVueSfcLess(
      `
<template><div :class="$style.root" /></template>
<style module lang="less">
.root { composes: shared; color: red; }
</style>
    `,
      'Composes.vue',
    )

    expect(mediaVariable.changed).toBe(false)
    expect(mediaVariable.diagnostics.some(item => item.message.includes('Less variable'))).toBe(
      true,
    )
    expect(composes.changed).toBe(false)
    expect(composes.diagnostics.some(item => item.message.includes('composes'))).toBe(true)
  })

  it('matches an existing classic script language when adding script setup', () => {
    const result = transformVueSfcLess(
      `
<script>
export default { name: 'ClassicCard' }
</script>
<template><div :class="$style.root" /></template>
<style module lang="less">
.root { color: red; }
</style>
    `,
      'ClassicCard.vue',
    )

    expect(result.diagnostics).toEqual([])
    expect(result.code).toContain('<script setup>')
    expect(result.code).not.toContain('<script setup lang="ts">')
    const { descriptor, errors } = parse(result.code, { filename: 'ClassicCard.vue' })
    expect(errors).toEqual([])
    expect(() => compileScript(descriptor, { id: 'classic-card' })).not.toThrow()
  })

  it('preserves important declarations and refuses Less escaped values', () => {
    const important = transformLessToCreateStyles(`
.root { color: red !important; }
    `)
    const escaped = transformVueSfcLess(
      `
<template><div :class="$style.root" /></template>
<style module lang="less">
.root { width: ~"calc(100% - 8px)"; }
</style>
    `,
      'Escaped.vue',
    )

    expect(important.diagnostics).toEqual([])
    expect(important.styles).toContain(`"color": "red !important"`)
    expect(escaped.changed).toBe(false)
    expect(escaped.diagnostics.some(item => item.message.includes('escaped'))).toBe(true)
  })

  it('refuses duplicate classes across separate style blocks', () => {
    const result = transformVueSfcLess(
      `
<template><div :class="$style.root" /></template>
<style module lang="less">.root { color: red; }</style>
<style module lang="less">.root { background: white; }</style>
    `,
      'MultipleBlocks.vue',
    )

    expect(result.changed).toBe(false)
    expect(result.diagnostics.some(item => item.message.includes('across style blocks'))).toBe(true)
  })

  it('refuses aliased useCssModule calls and external scripts', () => {
    const aliased = transformVueSfcLess(
      `
<script setup>
import { useCssModule as useModule } from 'vue'
const classes = useModule()
</script>
<template><div :class="classes.root" /></template>
<style module lang="less">.root { color: red; }</style>
    `,
      'Aliased.vue',
    )
    const external = transformVueSfcLess(
      `
<script src="./card.js"></script>
<template><div :class="$style.root" /></template>
<style module lang="less">.root { color: red; }</style>
    `,
      'External.vue',
    )

    expect(aliased.changed).toBe(false)
    expect(aliased.diagnostics.some(item => item.message.includes('Script-side'))).toBe(true)
    expect(external.changed).toBe(false)
    expect(external.diagnostics.some(item => item.message.includes('External'))).toBe(true)
  })

  it('refuses $style references in dynamic directive arguments', () => {
    const result = transformVueSfcLess(
      `
<template><div :[$style.root]="value" /></template>
<style module lang="less">.root { color: red; }</style>
    `,
      'DynamicArgument.vue',
    )

    expect(result.changed).toBe(false)
    expect(result.diagnostics.some(item => item.message.includes('directive arguments'))).toBe(true)
  })

  it('refuses namespace and forwarded useCssModule references', () => {
    const namespace = transformVueSfcLess(
      `
<script setup>
import * as Vue from 'vue'
const classes = Vue.useCssModule()
</script>
<template><div :class="classes.root" /></template>
<style module lang="less">.root { color: red; }</style>
    `,
      'Namespace.vue',
    )
    const forwarded = transformVueSfcLess(
      `
<script setup>
import { useCssModule } from 'vue'
const getModule = useCssModule
const classes = getModule()
</script>
<template><div :class="classes.root" /></template>
<style module lang="less">.root { color: red; }</style>
    `,
      'Forwarded.vue',
    )

    expect(namespace.changed).toBe(false)
    expect(namespace.diagnostics.some(item => item.message.includes('Script-side'))).toBe(true)
    expect(forwarded.changed).toBe(false)
    expect(forwarded.diagnostics.some(item => item.message.includes('Script-side'))).toBe(true)
  })

  it('refuses Less property nesting and property merging', () => {
    const nested = transformVueSfcLess(
      `
<template><div :class="$style.root" /></template>
<style module lang="less">
.root { border: { color: red; } }
</style>
    `,
      'PropertyNesting.vue',
    )
    const merged = transformVueSfcLess(
      `
<template><div :class="$style.root" /></template>
<style module lang="less">
.root { box-shadow+: inset 0 0 1px red; }
</style>
    `,
      'PropertyMerge.vue',
    )

    expect(nested.changed).toBe(false)
    expect(nested.diagnostics.some(item => item.message.includes('property nesting'))).toBe(true)
    expect(merged.changed).toBe(false)
    expect(merged.diagnostics.some(item => item.message.includes('property merging'))).toBe(true)
  })
})
