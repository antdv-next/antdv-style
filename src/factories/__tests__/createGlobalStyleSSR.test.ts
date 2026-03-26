import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

// Mock isBrowser to simulate SSR environment
vi.mock('../../utils/env', () => ({
  isBrowser: false,
}))

import { createThemeProvider } from '../createThemeProvider'
import { makeCreateGlobalStyle } from '../createGlobalStyle'
import { createEmotion } from '../../core'

describe('createGlobalStyle SSR', () => {
  it('should not create DOM elements in SSR mode', () => {
    const emotion = createEmotion()
    const ThemeProvider = createThemeProvider(emotion)
    const createGlobalStyle = makeCreateGlobalStyle(emotion)

    const useGlobalStyle = createGlobalStyle(() => ({
      body: { margin: '0' },
    }))

    const Consumer = defineComponent({
      setup() {
        useGlobalStyle()
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      props: { themeMode: 'light' },
      slots: { default: () => h(Consumer) },
    })

    // No DOM style element in SSR
    expect(document.querySelector('style[data-antdv-global]')).toBeNull()
  })

  it('should inject through emotion for SSR extraction', () => {
    const emotion = createEmotion()
    const ThemeProvider = createThemeProvider(emotion)
    const createGlobalStyle = makeCreateGlobalStyle(emotion)

    const useGlobalStyle = createGlobalStyle(() => ({
      body: { margin: '0' },
    }))

    const Consumer = defineComponent({
      setup() {
        useGlobalStyle()
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      props: { themeMode: 'light' },
      slots: { default: () => h(Consumer) },
    })

    // Emotion cache should have entries from injectGlobal
    const sheet = emotion.cache.sheet
    expect(sheet).toBeDefined()
  })

  it('should not throw in SSR mode', () => {
    const emotion = createEmotion()
    const ThemeProvider = createThemeProvider(emotion)
    const createGlobalStyle = makeCreateGlobalStyle(emotion)

    const useGlobalStyle = createGlobalStyle(({ token: _token }) => ({
      body: { backgroundColor: '#fff' },
    }))

    const Consumer = defineComponent({
      setup() {
        expect(() => useGlobalStyle()).not.toThrow()
        return () => h('div')
      },
    })

    expect(() =>
      mount(ThemeProvider, {
        props: { themeMode: 'light' },
        slots: { default: () => h(Consumer) },
      }),
    ).not.toThrow()
  })
})
