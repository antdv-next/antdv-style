import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, inject, h, nextTick } from 'vue'
import { createThemeProvider } from '../createThemeProvider'
import { createEmotion } from '../../core'
import { ThemeContextKey, ThemeModeKey, StyleEngineKey } from '../../context'
import type { Theme } from '../../types'

const emotion = createEmotion()
const ThemeProvider = createThemeProvider(emotion)

const Consumer = defineComponent({
  setup() {
    const themeCtx = inject(ThemeContextKey)!
    const modeCtx = inject(ThemeModeKey)!
    const engine = inject(StyleEngineKey)!
    return { themeCtx, modeCtx, engine }
  },
  render() {
    return h('div', {
      'data-appearance': this.modeCtx.appearance.value,
      'data-dark': String(this.modeCtx.isDarkMode.value),
      'data-prefix': this.themeCtx.prefixCls.value,
      'data-has-css': String(typeof this.engine.css === 'function'),
    })
  },
})

describe('ThemeProvider', () => {
  it('should provide default theme context', () => {
    const wrapper = mount(ThemeProvider, {
      slots: { default: () => h(Consumer) },
    })
    const consumer = wrapper.find('div')
    expect(consumer.attributes('data-appearance')).toBe('light')
    expect(consumer.attributes('data-dark')).toBe('false')
    expect(consumer.attributes('data-prefix')).toBe('ant')
    expect(consumer.attributes('data-has-css')).toBe('true')
  })

  it('should accept themeMode prop', () => {
    const wrapper = mount(ThemeProvider, {
      props: { themeMode: 'dark' },
      slots: { default: () => h(Consumer) },
    })
    const consumer = wrapper.find('div')
    expect(consumer.attributes('data-appearance')).toBe('dark')
    expect(consumer.attributes('data-dark')).toBe('true')
  })

  it('should accept prefixCls prop', () => {
    const wrapper = mount(ThemeProvider, {
      props: { prefixCls: 'my-app' },
      slots: { default: () => h(Consumer) },
    })
    expect(wrapper.find('div').attributes('data-prefix')).toBe('my-app')
  })

  it('should merge customToken into theme', () => {
    const TokenConsumer = defineComponent({
      setup() {
        const themeCtx = inject(ThemeContextKey)!
        return { themeCtx }
      },
      render() {
        return h('div', {
          'data-brand': (this.themeCtx.theme.value as Theme & { brandColor?: string }).brandColor ?? '',
        })
      },
    })

    const wrapper = mount(ThemeProvider, {
      props: { customToken: { brandColor: '#ff0000' } },
      slots: { default: () => h(TokenConsumer) },
    })
    expect(wrapper.find('div').attributes('data-brand')).toBe('#ff0000')
  })

  it('should use controlled appearance prop over themeMode', () => {
    const wrapper = mount(ThemeProvider, {
      props: { themeMode: 'light', appearance: 'dark' },
      slots: { default: () => h(Consumer) },
    })
    expect(wrapper.find('div').attributes('data-appearance')).toBe('dark')
  })

  it('should apply theme function with appearance', () => {
    const TokenConsumer = defineComponent({
      setup() {
        const themeCtx = inject(ThemeContextKey)!
        return { themeCtx }
      },
      render() {
        return h('div', {
          'data-primary': (this.themeCtx.theme.value as Theme).colorPrimary ?? '',
        })
      },
    })

    const wrapper = mount(ThemeProvider, {
      props: {
        themeMode: 'dark',
        theme: (appearance: string) => ({
          token: { colorPrimary: appearance === 'dark' ? '#177ddc' : '#1890ff' },
        }),
      },
      slots: { default: () => h(TokenConsumer) },
    })
    expect(wrapper.find('div').attributes('data-primary')).toBe('#177ddc')
  })

  it('should emit appearanceChange when themeMode changes', async () => {
    const wrapper = mount(ThemeProvider, {
      props: { themeMode: 'light' },
      slots: { default: () => h(Consumer) },
    })
    await wrapper.setProps({ themeMode: 'dark' })
    await nextTick()
    expect(wrapper.emitted('appearanceChange')).toBeTruthy()
    expect(wrapper.emitted('appearanceChange')![0]).toEqual(['dark'])
  })
})
