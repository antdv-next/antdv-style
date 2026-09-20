// @vitest-environment node

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createServer, type ViteDevServer } from 'vite'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import type { CreateInstanceOptions } from '../../functions/createInstance'
import type { ThemeConfig } from '../../types'

let server: ViteDevServer
let createInstance: typeof import('../../functions/createInstance')['createInstance']
let ConfigProvider: typeof import('antdv-next')['ConfigProvider']
let Button: typeof import('antdv-next')['Button']
let createCache: typeof import('@antdv-next/cssinjs')['createCache']
let extractStyle: typeof import('@antdv-next/cssinjs')['extractStyle']

beforeAll(async () => {
  // Load the real providers without the unit suite's antdv-next aliases.
  server = await createServer({
    configFile: false,
    server: { middlewareMode: true, hmr: false },
    ssr: { noExternal: ['antdv-next', /^@v-c\//, '@antdv-next/cssinjs'] },
    logLevel: 'error',
  })
  ;({ createInstance } = await server.ssrLoadModule('/src/functions/createInstance.ts'))
  ;({ ConfigProvider, Button } = await server.ssrLoadModule('antdv-next'))
  ;({ createCache, extractStyle } = await server.ssrLoadModule('@antdv-next/cssinjs'))
}, 60000)

afterAll(async () => { await server?.close() })

describe('ThemeProvider CSS variable integration', () => {
  it('isolates real component selectors and registers both variable prefixes in one SSR cache', async () => {
    const instance = createInstance({ key: 'component-isolation' })
    const cache = createCache()
    try {
      const html = await renderToString(createSSRApp({
        render: () => h(instance.StyleProvider, { antdCache: cache }, {
          default: () => ['first', 'second'].map(prefix => h(instance.ThemeProvider, {
            theme: { cssVar: { prefix }, token: { colorPrimary: '#e12345' } },
          }, { default: () => h(Button, { type: 'primary' }, () => prefix) })),
        }),
      }))
      const classes = [...html.matchAll(/<button[^>]*class="([^"]+)"/g)].map(match => match[1])
      const hashes = classes.map(value => value.match(/\bcss(?:-dev-only-do-not-override)?-(?!var-)[\w-]+/)?.[0])
      expect(hashes).toHaveLength(2)
      expect(hashes.every(Boolean)).toBe(true)
      expect(hashes[0]).not.toBe(hashes[1])
      const css = extractStyle(cache, { plain: true })
      for (const prefix of ['first', 'second']) {
        expect(css).toContain(`--${prefix}-color-primary:#e12345`)
        expect(css.includes(`var(--${prefix}-color-primary)`)).toBe(true)
      }
    } finally {
      instance.dispose()
    }
  })

  const cases: Array<{
    name: string
    options?: CreateInstanceOptions
    props?: { prefixCls?: string; theme?: ThemeConfig }
    parentPrefix?: string
    nested?: boolean
    expected: string
  }> = [
    { name: 'provider prefixCls', props: { prefixCls: 'acme' }, expected: 'acme' },
    { name: 'boolean cssVar with provider prefixCls', props: { prefixCls: 'acme', theme: { cssVar: true } }, expected: 'acme' },
    { name: 'explicit theme prefix', props: { prefixCls: 'acme', theme: { cssVar: { prefix: 'brand' } } }, expected: 'brand' },
    { name: 'ancestor ConfigProvider prefix', parentPrefix: 'host', expected: 'host' },
    { name: 'nested ThemeProvider prefix', props: { theme: { cssVar: { prefix: 'outer' } } }, nested: true, expected: 'outer' },
    { name: 'explicit instance default', options: { cssVarPrefix: 'instance' }, expected: 'instance' },
    { name: 'boolean cssVar with instance default', options: { cssVarPrefix: 'instance' }, props: { theme: { cssVar: true } }, expected: 'instance' },
    { name: 'explicit cssVar overriding instance default', options: { cssVarPrefix: 'instance' }, props: { theme: { cssVar: { prefix: 'brand' } } }, expected: 'brand' },
    { name: 'provider overriding instance prefixCls', options: { prefixCls: 'instance' }, props: { prefixCls: 'local' }, expected: 'local' },
  ]

  it.each(cases)('matches variable references and definitions for $name', async ({ options, props, parentPrefix, nested, expected }) => {
    const instance = createInstance({ key: 'prefix-test', ...options })
    const cache = createCache()
    let reference = ''
    const useStyles = instance.createStyles(({ cssVar }) => {
      reference = cssVar.colorPrimary
      return { root: { color: reference } }
    })
    const Consumer = defineComponent({
      setup() {
        const state = useStyles()
        return () => h('div', { class: state.styles.root })
      },
    })
    const provider = () => h(instance.ThemeProvider, {
      ...props,
      theme: { ...props?.theme, token: { colorPrimary: '#e12345' } },
    }, {
      default: () => nested
        ? h(instance.ThemeProvider, null, { default: () => h(Consumer) })
        : h(Consumer),
    })
    try {
      await renderToString(createSSRApp({
        render: () => h(instance.StyleProvider, { antdCache: cache }, {
          default: () => parentPrefix
            ? h(ConfigProvider, { theme: { cssVar: { prefix: parentPrefix } } }, { default: provider })
            : provider(),
        }),
      }))
      expect(reference).toMatch(new RegExp(`^var\\(--${expected}-color-primary(?:,|\\))`))
      expect(extractStyle(cache, { plain: true })).toContain(`--${expected}-color-primary:#e12345`)
    } finally {
      instance.dispose()
    }
  })
})
