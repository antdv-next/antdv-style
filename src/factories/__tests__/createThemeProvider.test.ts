import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, inject, h, nextTick } from 'vue'
import { ConfigProvider } from 'antdv-next'
import { useConfig } from 'antdv-next/dist/config-provider/context'
import { createThemeProvider } from '../createThemeProvider'
import { createEmotion } from '../../core'
import { ThemeContextKey, ThemeModeKey, StyleEngineKey } from '../../context'
import type { Theme } from '../../types'
import type { ThemeModeContext } from '../../context'

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
  const HashConsumer = defineComponent({
    setup() {
      const config = useConfig()
      return () => h('div', { 'data-hashed': String(config.value.theme?.hashed) })
    },
  })

  it('enables component hash isolation by default', () => {
    const wrapper = mount(ThemeProvider, { slots: { default: () => h(HashConsumer) } })
    expect(wrapper.find('div').attributes('data-hashed')).toBe('true')
    wrapper.unmount()
  })

  it('preserves an explicit hash opt-out and reactive changes', async () => {
    const wrapper = mount(ThemeProvider, {
      props: { theme: { hashed: false } },
      slots: { default: () => h(HashConsumer) },
    })
    expect(wrapper.find('div').attributes('data-hashed')).toBe('false')
    await wrapper.setProps({ theme: { hashed: true } })
    expect(wrapper.find('div').attributes('data-hashed')).toBe('true')
    await wrapper.setProps({ theme: {} })
    expect(wrapper.find('div').attributes('data-hashed')).toBe('true')
    wrapper.unmount()
  })

  it.each([true, false])('inherits ancestor hashed=%s unless locally overridden', async (hashed) => {
    const wrapper = mount(ConfigProvider, {
      props: { theme: { hashed } },
      slots: { default: () => h(ThemeProvider, null, { default: () => h(HashConsumer) }) },
    })
    expect(wrapper.find('div').attributes('data-hashed')).toBe(String(hashed))
    await wrapper.setProps({ theme: { hashed: !hashed } })
    expect(wrapper.find('div').attributes('data-hashed')).toBe(String(!hashed))
    wrapper.unmount()
    const overridden = mount(ConfigProvider, {
      props: { theme: { hashed } },
      slots: { default: () => h(ThemeProvider, { theme: { hashed: !hashed } }, {
        default: () => h(HashConsumer),
      }) },
    })
    expect(overridden.find('div').attributes('data-hashed')).toBe(String(!hashed))
    overridden.unmount()
  })

  it.each(['appearance', 'themeMode'] as const)('notifies controlled %s requests once without changing rejected state', async (property) => {
    let mode!: ThemeModeContext
    const callback = vi.fn()
    const Child = defineComponent({
      setup() {
        mode = inject(ThemeModeKey)!
        return () => h('div', mode.appearance.value)
      },
    })
    const wrapper = mount(ThemeProvider, {
      props: property === 'appearance'
        ? { appearance: 'light', onAppearanceChange: callback }
        : { themeMode: 'light', onThemeModeChange: callback },
      slots: { default: () => h(Child) },
    })
    const setter = property === 'appearance' ? mode.setAppearance : mode.setThemeMode
    setter('dark')
    await nextTick()
    expect(callback).toHaveBeenCalledExactlyOnceWith('dark')
    expect(wrapper.text()).toBe('light')
    await wrapper.setProps({ [property]: 'dark' })
    expect(wrapper.text()).toBe('dark')
    expect(callback).toHaveBeenCalledTimes(1)
    await wrapper.setProps({ [property]: 'light' })
    expect(callback).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })

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

  it('should inherit prefixes from a parent ThemeProvider', () => {
    const PrefixConsumer = defineComponent({
      setup() {
        const themeCtx = inject(ThemeContextKey)!
        return () => h('div', {
          'data-prefix': themeCtx.prefixCls.value,
          'data-icon-prefix': themeCtx.iconPrefixCls.value,
        })
      },
    })

    const wrapper = mount(ThemeProvider, {
      props: { prefixCls: 'outer', iconPrefixCls: 'outer-icon' },
      slots: {
        default: () => h(ThemeProvider, null, {
          default: () => h(PrefixConsumer),
        }),
      },
    })

    expect(wrapper.find('div').attributes('data-prefix')).toBe('outer')
    expect(wrapper.find('div').attributes('data-icon-prefix')).toBe('outer-icon')
  })

  it('should inherit prefixes from antdv-next ConfigProvider', () => {
    const PrefixConsumer = defineComponent({
      setup() {
        const themeCtx = inject(ThemeContextKey)!
        return () => h('div', {
          'data-prefix': themeCtx.prefixCls.value,
          'data-icon-prefix': themeCtx.iconPrefixCls.value,
        })
      },
    })

    const wrapper = mount(ConfigProvider, {
      props: { prefixCls: 'host', iconPrefixCls: 'host-icon' },
      slots: {
        default: () => h(ThemeProvider, null, {
          default: () => h(PrefixConsumer),
        }),
      },
    })

    expect(wrapper.find('div').attributes('data-prefix')).toBe('host')
    expect(wrapper.find('div').attributes('data-icon-prefix')).toBe('host-icon')
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

  it('should inherit custom tokens that override built-in token names', () => {
    const TokenConsumer = defineComponent({
      setup() {
        const themeCtx = inject(ThemeContextKey)!
        return () => h('div', {
          'data-primary': themeCtx.theme.value.colorPrimary,
          'data-brand': (themeCtx.theme.value as Theme & { brandColor?: string }).brandColor,
        })
      },
    })

    const wrapper = mount(ThemeProvider, {
      props: { customToken: { colorPrimary: '#123456', brandColor: '#abcdef' } },
      slots: {
        default: () => h(ThemeProvider, null, {
          default: () => h(TokenConsumer),
        }),
      },
    })

    expect(wrapper.find('div').attributes('data-primary')).toBe('#123456')
    expect(wrapper.find('div').attributes('data-brand')).toBe('#abcdef')
  })

  it('should use controlled appearance prop over themeMode', () => {
    const wrapper = mount(ThemeProvider, {
      props: { themeMode: 'light', appearance: 'dark' },
      slots: { default: () => h(Consumer) },
    })
    expect(wrapper.find('div').attributes('data-appearance')).toBe('dark')
  })

  it('should fall back to themeMode after appearance becomes uncontrolled', async () => {
    const wrapper = mount(ThemeProvider, {
      props: { themeMode: 'light', appearance: 'dark' as string | undefined },
      slots: { default: () => h(Consumer) },
    })

    await wrapper.setProps({ appearance: undefined })
    await nextTick()

    expect(wrapper.find('div').attributes('data-appearance')).toBe('light')
  })

  it('should let a nested local themeMode override the parent appearance', () => {
    const wrapper = mount(ThemeProvider, {
      props: { themeMode: 'dark' },
      slots: {
        default: () => h(ThemeProvider, { themeMode: 'light' }, {
          default: () => h(Consumer),
        }),
      },
    })

    expect(wrapper.find('div').attributes('data-appearance')).toBe('light')
  })

  it('should reactively inherit parent appearance when no local mode is set', async () => {
    const wrapper = mount(ThemeProvider, {
      props: { themeMode: 'light' },
      slots: {
        default: () => h(ThemeProvider, null, {
          default: () => h(Consumer),
        }),
      },
    })

    expect(wrapper.find('div').attributes('data-appearance')).toBe('light')
    await wrapper.setProps({ themeMode: 'dark' })
    await nextTick()
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

  it('should invoke change callbacks exactly once', async () => {
    const onAppearanceChange = vi.fn()
    const onThemeModeChange = vi.fn()
    const wrapper = mount(ThemeProvider, {
      props: {
        themeMode: 'light',
        onAppearanceChange,
        onThemeModeChange,
      },
      slots: { default: () => h(Consumer) },
    })

    await wrapper.setProps({ themeMode: 'dark' })
    await nextTick()

    expect(onAppearanceChange).toHaveBeenCalledTimes(1)
    expect(onAppearanceChange).toHaveBeenCalledWith('dark')
    expect(onThemeModeChange).toHaveBeenCalledTimes(1)
    expect(onThemeModeChange).toHaveBeenCalledWith('dark')
  })
})
