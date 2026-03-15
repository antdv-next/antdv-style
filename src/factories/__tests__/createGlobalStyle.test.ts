import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { makeCreateGlobalStyle } from '../createGlobalStyle'
import { createThemeProvider } from '../createThemeProvider'
import { createEmotion } from '../../core'

// Clean up any injected style elements after each test
afterEach(() => {
  document.querySelectorAll('style[data-antdv-global]').forEach(el => el.remove())
})

describe('createGlobalStyle', () => {
  it('should inject global styles into document head', () => {
    const emotion = createEmotion()
    const ThemeProvider = createThemeProvider(emotion)
    const createGlobalStyle = makeCreateGlobalStyle(emotion)

    const useGlobalStyle = createGlobalStyle(() => ({
      body: {
        margin: 0,
        padding: 0,
      },
    }))

    const Consumer = defineComponent({
      setup() {
        useGlobalStyle()
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      slots: { default: () => h(Consumer) },
    })

    const styleEl = document.querySelector('style[data-antdv-global]')
    expect(styleEl).not.toBeNull()
    expect(styleEl!.textContent).toContain('margin')
    expect(styleEl!.textContent).toContain('padding')
  })

  it('should use theme tokens in global styles', () => {
    const emotion = createEmotion()
    const ThemeProvider = createThemeProvider(emotion)
    const createGlobalStyle = makeCreateGlobalStyle(emotion)

    const useGlobalStyle = createGlobalStyle(({ token }) => ({
      body: {
        backgroundColor: token.bgColor,
      },
    }))

    const Consumer = defineComponent({
      setup() {
        useGlobalStyle()
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      props: { customToken: { bgColor: '#f0f0f0' } },
      slots: { default: () => h(Consumer) },
    })

    const styleEl = document.querySelector('style[data-antdv-global]')
    expect(styleEl!.textContent).toContain('#f0f0f0')
  })

  it('should reactively update when theme changes (replace, not accumulate)', async () => {
    const emotion = createEmotion()
    const ThemeProvider = createThemeProvider(emotion)
    const createGlobalStyle = makeCreateGlobalStyle(emotion)

    const useGlobalStyle = createGlobalStyle(({ isDarkMode }) => ({
      body: {
        backgroundColor: isDarkMode ? '#000' : '#fff',
      },
    }))

    const Consumer = defineComponent({
      setup() {
        useGlobalStyle()
        return () => h('div')
      },
    })

    const wrapper = mount(ThemeProvider, {
      props: { themeMode: 'light' },
      slots: { default: () => h(Consumer) },
    })

    let styleEl = document.querySelector('style[data-antdv-global]')
    expect(styleEl!.textContent).toContain('#fff')
    expect(styleEl!.textContent).not.toContain('#000')

    await wrapper.setProps({ themeMode: 'dark' })
    await nextTick()

    styleEl = document.querySelector('style[data-antdv-global]')
    // Should REPLACE, not accumulate — old #fff should be gone
    expect(styleEl!.textContent).toContain('#000')
    expect(styleEl!.textContent).not.toContain('#fff')
  })

  it('should clean up styles on unmount', () => {
    const emotion = createEmotion()
    const ThemeProvider = createThemeProvider(emotion)
    const createGlobalStyle = makeCreateGlobalStyle(emotion)

    const useGlobalStyle = createGlobalStyle(() => ({
      body: { margin: 0 },
    }))

    const Consumer = defineComponent({
      setup() {
        useGlobalStyle()
        return () => h('div')
      },
    })

    const wrapper = mount(ThemeProvider, {
      slots: { default: () => h(Consumer) },
    })

    expect(document.querySelector('style[data-antdv-global]')).not.toBeNull()
    wrapper.unmount()
    expect(document.querySelector('style[data-antdv-global]')).toBeNull()
  })

  it('should throw when used outside ThemeProvider', () => {
    const emotion = createEmotion()
    const createGlobalStyle = makeCreateGlobalStyle(emotion)

    const useGlobalStyle = createGlobalStyle(() => ({
      body: { margin: 0 },
    }))

    const Consumer = defineComponent({
      setup() {
        useGlobalStyle()
        return () => h('div')
      },
    })

    expect(() => mount(Consumer)).toThrow()
  })

  it('should handle CSS string input', () => {
    const emotion = createEmotion()
    const ThemeProvider = createThemeProvider(emotion)
    const createGlobalStyle = makeCreateGlobalStyle(emotion)

    const useGlobalStyle = createGlobalStyle(() =>
      'body { font-family: sans-serif; }'
    )

    const Consumer = defineComponent({
      setup() {
        useGlobalStyle()
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      slots: { default: () => h(Consumer) },
    })

    const styleEl = document.querySelector('style[data-antdv-global]')
    expect(styleEl!.textContent).toContain('font-family')
  })
})
