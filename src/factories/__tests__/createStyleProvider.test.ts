import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, inject, h } from 'vue'
import { StyleProvider } from '../createStyleProvider'
import { createThemeProvider } from '../createThemeProvider'
import { createEmotion, registerEmotionInstance } from '../../core'
import { StyleEngineKey } from '../../context'
import { extractStaticStyle } from '../../functions/extractStaticStyle'
import { createCache } from '@antdv-next/cssinjs'

const emotion = createEmotion()
const ThemeProvider = createThemeProvider(emotion)

describe('StyleProvider', () => {
  it('flushes owned sheets on unmount without flushing a supplied engine', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const Consumer = defineComponent({
      setup() {
        inject(StyleEngineKey)!.css({ color: 'plum' })
        return () => h('div')
      },
    })
    const owned = mount(StyleProvider, {
      props: { cacheKey: 'owned-cleanup', container },
      slots: { default: () => h(Consumer) },
    })
    expect(container.querySelectorAll('style').length).toBeGreaterThan(0)
    owned.unmount()
    expect(container.querySelectorAll('style')).toHaveLength(0)
    const shared = createEmotion({ key: 'shared-cleanup', container })
    const supplied = mount(StyleProvider, {
      props: { emotionCache: shared },
      slots: { default: () => h(Consumer) },
    })
    supplied.unmount()
    expect(container.querySelectorAll('style').length).toBeGreaterThan(0)
    shared.flush()
    container.remove()
  })

  it('should override the style engine with a custom cache', () => {
    const customEmotion = createEmotion({ key: 'custom-scope' })

    const Consumer = defineComponent({
      setup() {
        const engine = inject(StyleEngineKey)!
        return { engine }
      },
      render() {
        return h('div', {
          'data-cache-key': this.engine.cache.key,
        })
      },
    })

    const wrapper = mount(ThemeProvider, {
      slots: {
        default: () => h(StyleProvider, { cache: customEmotion }, {
          default: () => h(Consumer),
        }),
      },
    })

    expect(wrapper.find('div').attributes('data-cache-key')).toBe('custom-scope')
  })

  it('should preserve an outer StyleProvider engine through ThemeProvider', () => {
    const customEmotion = createEmotion({ key: 'outer-provider' })

    const Consumer = defineComponent({
      setup() {
        const engine = inject(StyleEngineKey)!
        return () => h('div', { 'data-cache-key': engine.cache.key })
      },
    })

    const wrapper = mount(StyleProvider, {
      props: { emotionCache: customEmotion },
      slots: {
        default: () => h(ThemeProvider, null, {
          default: () => h(Consumer),
        }),
      },
    })

    expect(wrapper.find('div').attributes('data-cache-key')).toBe('outer-provider')
  })

  it('should create a new emotion instance from cacheKey', () => {
    const Consumer = defineComponent({
      setup() {
        const engine = inject(StyleEngineKey)!
        return { engine }
      },
      render() {
        return h('div', {
          'data-cache-key': this.engine.cache.key,
        })
      },
    })

    const wrapper = mount(ThemeProvider, {
      slots: {
        default: () => h(StyleProvider, { cacheKey: 'micro-app' }, {
          default: () => h(Consumer),
        }),
      },
    })

    expect(wrapper.find('div').attributes('data-cache-key')).toBe('micro-app')
  })

  it('should pass through when no override props provided', () => {
    const Consumer = defineComponent({
      setup() {
        const engine = inject(StyleEngineKey)!
        return { engine }
      },
      render() {
        return h('div', {
          'data-cache-key': this.engine.cache.key,
        })
      },
    })

    const wrapper = mount(ThemeProvider, {
      slots: {
        default: () => h(StyleProvider, null, {
          default: () => h(Consumer),
        }),
      },
    })

    // Should use the parent ThemeProvider's emotion instance
    expect(wrapper.find('div').attributes('data-cache-key')).toBe('acss')
  })

  it('should preserve the parent emotion engine for antd-only options', () => {
    let injectedEngine: ReturnType<typeof createEmotion> | undefined
    const Consumer = defineComponent({
      setup() {
        injectedEngine = inject(StyleEngineKey)!
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      slots: {
        default: () => h(StyleProvider, { hashPriority: 'low' }, {
          default: () => h(Consumer),
        }),
      },
    })

    expect(injectedEngine).toBe(emotion)
  })

  it('should treat a cssinjs cache as antd-only configuration', () => {
    let injectedEngine: ReturnType<typeof createEmotion> | undefined
    const Consumer = defineComponent({
      setup() {
        injectedEngine = inject(StyleEngineKey)!
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      slots: {
        default: () => h(StyleProvider, { cache: createCache() }, {
          default: () => h(Consumer),
        }),
      },
    })

    expect(injectedEngine).toBe(emotion)
  })

  it('should honor an explicitly disabled speedy mode', () => {
    const speedyEmotion = registerEmotionInstance(createEmotion({ key: 'speedy-parent', speedy: true }))
    const SpeedyThemeProvider = createThemeProvider(speedyEmotion)
    let injectedEngine: ReturnType<typeof createEmotion> | undefined
    const Consumer = defineComponent({
      setup() {
        injectedEngine = inject(StyleEngineKey)!
        return () => h('div')
      },
    })

    mount(SpeedyThemeProvider, {
      slots: {
        default: () => h(StyleProvider, { speedy: false }, {
          default: () => h(Consumer),
        }),
      },
    })

    expect(injectedEngine).not.toBe(speedyEmotion)
    expect(injectedEngine?.sheet.isSpeedy).toBe(false)
  })

  it('should register generated emotion engines for aggregate extraction', () => {
    const Consumer = defineComponent({
      setup() {
        const engine = inject(StyleEngineKey)!
        engine.css({ color: 'rebeccapurple' })
        return () => h('div')
      },
    })

    const wrapper = mount(ThemeProvider, {
      slots: {
        default: () => h(StyleProvider, { cacheKey: 'provider-extract' }, {
          default: () => h(Consumer),
        }),
      },
    })

    expect(extractStaticStyle(undefined, { includeAntdv: false }).tags)
      .toContain('data-emotion="provider-extract ')

    wrapper.unmount()

    expect(extractStaticStyle(undefined, { includeAntdv: false }).tags)
      .not.toContain('data-emotion="provider-extract ')
  })

  it('should render children correctly', () => {
    const wrapper = mount(ThemeProvider, {
      slots: {
        default: () => h(StyleProvider, { cacheKey: 'test' }, {
          default: () => h('span', 'hello'),
        }),
      },
    })

    expect(wrapper.find('span').text()).toBe('hello')
  })
})
