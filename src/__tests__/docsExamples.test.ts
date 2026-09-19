import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { compileFunction } from 'node:vm'
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import * as Vue from 'vue'
import { compileScript, parse } from '@vue/compiler-sfc'
import { ModuleKind, transpileModule } from 'typescript'
import { createStyles, ThemeProvider } from '../index'

describe('dynamic documentation examples', () => {
  it.each([
    { path: 'best-practice/styled.md', props: { tone: 'brand' } },
    { path: 'en/best-practice/styled.md', props: { tone: 'brand' } },
    { path: 'guide/styled.md', props: { selected: true } },
    { path: 'guide/css-in-js-intro.md', props: undefined },
    { path: 'en/guide/css-in-js-intro.md', props: undefined },
  ])('keeps the rendered styles reactive in $path', async ({ path, props }) => {
    const markdown = readFileSync(resolve('docs', path), 'utf8')
    const source = markdown.match(/```vue\r?\n([\s\S]*?)```/)![1]
    const { descriptor } = parse(source, { filename: 'DocExample.vue' })
    const script = compileScript(descriptor, { id: 'doc-example', inlineTemplate: true })
    const output = transpileModule(script.content, { compilerOptions: { module: ModuleKind.CommonJS } })
    const exports: { default?: Vue.Component } = {}
    const require = (id: string) => {
      if (id === 'vue') return Vue
      if (id === 'antdv-style') return { createStyles }
      throw new Error(`Unexpected example import: ${id}`)
    }
    // Execute trusted local examples only; this is not a security sandbox.
    compileFunction(output.outputText, ['require', 'exports'], { filename: path })(require, exports)
    const Example = exports.default!
    const exampleProps = Vue.ref<Record<string, unknown>>({})
    const wrapper = mount(ThemeProvider, {
      props: { customToken: { colorPrimary: 'red', colorText: 'blue' } },
      slots: { default: () => Vue.h(Example, exampleProps.value) },
    })
    try {
      const example = wrapper.getComponent(Example)
      const before = example.attributes('class')
      if (props) exampleProps.value = props
      else await wrapper.setProps({ customToken: { colorPrimary: 'red', colorText: 'green' } })
      await Vue.nextTick()
      expect(example.attributes('class')).not.toBe(before)
    } finally {
      wrapper.unmount()
    }
  })
})
