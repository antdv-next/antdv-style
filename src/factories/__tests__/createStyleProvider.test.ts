import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, inject, h } from 'vue'
import { StyleProvider } from '../createStyleProvider'
import { createThemeProvider } from '../createThemeProvider'
import { createEmotion } from '../../core'
import { StyleEngineKey } from '../../context'

const emotion = createEmotion()
const ThemeProvider = createThemeProvider(emotion)

describe('StyleProvider', () => {
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
    expect(wrapper.find('div').attributes('data-cache-key')).toBe('antdv-css')
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
