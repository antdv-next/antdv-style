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
