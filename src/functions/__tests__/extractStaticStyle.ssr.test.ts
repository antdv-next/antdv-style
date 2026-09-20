// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { createEmotion, registerEmotionInstance, unregisterEmotionInstance } from '../../core'
import { extractStaticStyle } from '../extractStaticStyle'
import { createInstance } from '../createInstance'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createCache } from '@antdv-next/cssinjs'
import { createCacheManager } from '../../core'

describe('extractStaticStyle SSR', () => {
  it('extracts one main sheet before global owners regardless of registration interleaving', async () => {
    const instance = createInstance({ key: 'ssr-main-order' })
    const useA = instance.createGlobalStyle(() => ({ '.target': { color: 'red' } }))
    const useB = instance.createGlobalStyle(() => ({ '.target': { color: 'blue' } }))
    const Consumer = defineComponent({
      setup() {
        useA()
        const first = instance.css({ color: 'green' })
        useB()
        const second = instance.css({ color: 'purple' })
        return () => h('div', { class: [first, second] })
      },
    })
    try {
      const html = await renderToString(createSSRApp({
        render: () => h(instance.ThemeProvider, null, { default: () => h(Consumer) }),
      }))
      const result = extractStaticStyle(instance.styleManager, { html, includeAntdv: false })
      expect(result.css.indexOf('color:purple')).toBeLessThan(result.css.indexOf('.target{color:red'))
      expect(result.css.indexOf('.target{color:red')).toBeLessThan(result.css.indexOf('.target{color:blue'))
      expect(result.tags.match(/data-emotion="ssr-main-order /g)).toHaveLength(1)
    } finally {
      instance.dispose()
    }
  })

  it('keeps an empty global owner marker for hydration order', async () => {
    const instance = createInstance({ key: 'empty-owner' })
    const useFirst = instance.createGlobalStyle(() => undefined)
    const useSecond = instance.createGlobalStyle(() => ({ '.target': { color: 'blue' } }))
    const First = defineComponent({ setup() { useFirst(); return () => h('span', 'first') } })
    const Second = defineComponent({ setup() { useSecond(); return () => h('span', 'second') } })

    try {
      const html = await renderToString(createSSRApp({
        render: () => h(instance.ThemeProvider, null, {
          default: () => [h(First), h(Second)],
        }),
      }))
      const result = extractStaticStyle(instance.styleManager, { html, includeAntdv: false })
      const globals = [...result.tags.matchAll(
        /<style[^>]*data-antdv-global="([^"]+)"[^>]*>(.*?)<\/style>/g,
      )]

      expect(globals).toHaveLength(2)
      expect(globals[0][2]).toBe('')
      expect(globals[1][2]).toContain('.target{color:blue;}')
    } finally {
      instance.dispose()
    }
  })

  it.each(['reset', 'flush'] as const)('extracts owned globals separately and clears them on %s', async (operation) => {
    const instance = createInstance({ key: 'owned-ssr', nonce: 'test-nonce' })
    const useGlobal = instance.createGlobalStyle(() => ({ body: { color: 'red' } }))
    const useStyles = instance.createStyles({ root: { padding: 13 } })
    const Consumer = defineComponent({
      setup() {
        useGlobal()
        const state = useStyles()
        return () => h('div', { class: state.styles.root })
      },
    })
    const render = () => renderToString(createSSRApp({
      render: () => h(instance.ThemeProvider, null, { default: () => [h(Consumer), h(Consumer)] }),
    }))
    try {
      instance.injectGlobal({ html: { margin: 0 } })
      const html = await render()
      const result = extractStaticStyle(instance.styleManager, { html, includeAntdv: false })
      const globals = [...result.tags.matchAll(/<style[^>]*data-antdv-global="([^"]+)"[^>]*>(.*?)<\/style>/g)]
      expect(globals).toHaveLength(2)
      expect(new Set(globals.map(match => match[1])).size).toBe(2)
      for (const [tag, , css] of globals) {
        expect(tag).toContain('data-emotion="owned-ssr-global"')
        expect(tag).toContain('nonce="test-nonce"')
        expect(css).toBe('body{color:red;}')
      }
      const main = result.tags.replace(/<style[^>]*data-antdv-global[^>]*>.*?<\/style>/g, '')
      expect(main).toContain('padding:13px')
      expect(main).toContain('html{margin:0;}')
      expect(main).not.toContain('body{color:red;}')
      expect(result.css.match(/body\{color:red;\}/g)).toHaveLength(2)
      if (operation === 'reset') createCacheManager(instance.styleManager).reset()
      else instance.styleManager.flush()
      expect(extractStaticStyle(instance.styleManager, { includeAntdv: false })).toEqual({ css: '', tags: '' })
      await render()
      expect(extractStaticStyle(instance.styleManager, { includeAntdv: false }).tags)
        .toMatch(/data-antdv-global=/)
    } finally {
      instance.dispose()
    }
  })

  it('retains linked keyframes and escapes owned global style content and identity', async () => {
    const instance = createInstance({ key: 'owned-content' })
    const useGlobal = instance.createGlobalStyle(() => ({
      body: { animation: { name: 'owned-animation', styles: '@keyframes owned-animation{to{opacity:1}}', anim: 1 } },
      'body::before': { content: '"</style><script>marker=true</script>"' },
    }))
    const Consumer = defineComponent({ setup() { useGlobal(); return () => h('div') } })
    const app = createSSRApp({
      render: () => h(instance.ThemeProvider, null, { default: () => h(Consumer) }),
    })
    app.config.idPrefix = 'test"<&'
    try {
      await renderToString(app)
      const result = extractStaticStyle(instance.styleManager, { html: '', includeAntdv: false })
      expect(result.css).toContain('@keyframes owned-animation')
      expect(result.css).toContain('</style><script>')
      expect(result.tags).toContain('data-antdv-global="test&quot;&lt;&amp;-')
      expect(result.tags).toContain('<\\/style><script>')
      expect(result.tags.match(/<\/style>/g)).toHaveLength(1)
    } finally {
      instance.dispose()
    }
  })

  it.each(['\u5361\u7247', 'caf\u00e9', 'e\u0301', '\u{1F680}'])(
    'retains used Unicode labels and excludes unused rules: %s',
    async (label) => {
      const instance = createInstance({ key: 'unicode-ssr' })
      const useStyles = instance.createStyles({ root: { color: 'blue' } }, { label })
      const utilityClass = instance.css({ padding: 7, label })
      const unusedClass = instance.css({ color: 'red', label })
      const App = defineComponent({
        setup() {
          const state = useStyles()
          return () => h('div', { class: [state.styles.root, utilityClass] })
        },
      })
      try {
        const html = await renderToString(createSSRApp({
          render: () => h(instance.ThemeProvider, null, { default: () => h(App) }),
        }))
        const result = extractStaticStyle(instance.styleManager, { html, includeAntdv: false })
        expect(result.css).toContain('color:blue;')
        expect(result.css).toContain('padding:7px;')
        expect(result.css).not.toContain('color:red;')
        expect(result.tags).toContain(utilityClass.slice('unicode-ssr-'.length))
        expect(result.tags).not.toContain(unusedClass.slice('unicode-ssr-'.length))
      } finally {
        instance.dispose()
      }
    },
  )

  it('does not mistake a longer identifier or another cache prefix for a used class', () => {
    const instance = createInstance({ key: 'critical-boundary' })
    try {
      for (const label of ['Card', '\u5361\u7247']) {
        const className = instance.css({ color: 'blue', label })
        for (const longer of [
          `other-${className}`, `${className}Extra`, `_${className}`,
          `\u4e2d\u6587${className}`, `${className}\u4e2d\u6587`,
        ]) {
          const result = extractStaticStyle(instance.styleManager, {
            html: `<div class="${longer}"></div>`, includeAntdv: false,
          })
          expect(result.css).toBe('')
        }
      }
    } finally {
      instance.dispose()
    }
  })

  it('extracts instance styles when StyleProvider only supplies an antd cache', async () => {
    const instance = createInstance({ key: 'request' })
    const antdCache = createCache()
    const useStyles = instance.createStyles({ root: { color: 'plum' } })
    const App = defineComponent({
      setup() {
        const state = useStyles()
        return () => h('div', { class: state.styles.root }, 'request')
      },
    })
    try {
      const html = await renderToString(createSSRApp({
        render: () => h(instance.StyleProvider, { antdCache }, {
          default: () => h(instance.ThemeProvider, null, { default: () => h(App) }),
        }),
      }))
      expect(html).toContain('request-')
      expect(extractStaticStyle(instance.styleManager, { html, antdCache }).css).toContain('color:plum')
    } finally {
      instance.dispose()
    }
  })

  it.each(['reset', 'flush'] as const)('reinserts cached classes after %s and remount', async (operation) => {
    const instance = createInstance({ key: 'reset-test' })
    const useStyles = instance.createStyles({ root: { color: 'plum' } })
    const App = defineComponent({
      setup() {
        const state = useStyles()
        return () => h('div', { class: state.styles.root })
      },
    })
    const render = () => renderToString(createSSRApp({
      render: () => h(instance.ThemeProvider, null, { default: () => h(App) }),
    }))
    try {
      const first = await render()
      expect(extractStaticStyle(instance.styleManager, { html: first }).css).toContain('color:plum')
      if (operation === 'reset') createCacheManager(instance.styleManager).reset()
      else instance.styleManager.flush()
      const second = await render()
      expect(second).toBe(first)
      expect(extractStaticStyle(instance.styleManager, { html: second }).css).toContain('color:plum')
    } finally {
      instance.dispose()
    }
  })

  it('should extract only styles referenced by rendered HTML', () => {
    const emotion = createEmotion({ key: 'critical', speedy: false })
    const usedClass = emotion.css({ color: 'red' })
    const unusedClass = emotion.css({ color: 'blue' })

    const result = extractStaticStyle(emotion, {
      html: `<div class="${usedClass}"></div>`,
      includeAntdv: false,
    })

    expect(result.css).toContain('color:red')
    expect(result.css).not.toContain('color:blue')
    expect(result.tags).toContain(usedClass.replace('critical-', ''))
    expect(result.tags).not.toContain(unusedClass.replace('critical-', ''))
  })

  it('should support the upstream HTML-first overload', () => {
    const emotion = registerEmotionInstance(createEmotion({ key: 'critical-overload', speedy: false }))
    const className = emotion.css({ display: 'grid' })

    const result = extractStaticStyle(
      `<main class="${className}"></main>`,
      { includeAntdv: false },
    )

    expect(result.css).toContain('display:grid')
    unregisterEmotionInstance(emotion)
  })

  it('should retain global and linked styles during critical extraction', () => {
    const emotion = createEmotion({ key: 'critical-global', speedy: false })
    const animation = emotion.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } })
    const className = emotion.css({ animation: `${animation} 1s` })
    emotion.injectGlobal({ body: { margin: 0 } })

    const result = extractStaticStyle(emotion, {
      html: `<div class="${className}"></div>`,
      includeAntdv: false,
    })

    expect(result.css).toContain('@keyframes')
    expect(result.css).toContain('body')
  })
})
