import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, type ComputedRef } from 'vue'
import { createStyles, ThemeProvider, useTheme, useThemeMode, createInstance } from '../index'
import type { CreateStylesReturn, Theme } from '../types'
import type { ThemeModeContext } from '../context'

describe('integration: full flow', () => {
  it('should work end-to-end with createStyles + ThemeProvider', () => {
    const useStyles = createStyles(({ css, isDarkMode }) => ({
      container: css({
        color: isDarkMode ? 'white' : 'black',
      }),
      title: {
        fontSize: '16px',
      },
    }))

    let result: CreateStylesReturn
    const Page = defineComponent({
      setup() {
        result = useStyles()
        return () => h('div', { class: result.styles.container }, [
          h('h1', { class: result.styles.title }, 'Hello'),
        ])
      },
    })

    const wrapper = mount(ThemeProvider, {
      props: {
        themeMode: 'dark',
        customToken: { brandColor: '#1890ff' },
      },
      slots: { default: () => h(Page) },
    })

    expect(result.styles.container).toBeDefined()
    expect(result.styles.title).toBeDefined()
    expect(typeof result.styles.container).toBe('string')
    expect(typeof result.styles.title).toBe('string')
    expect(wrapper.find('div').exists()).toBe(true)
  })

  it('should reactively update when theme switches', async () => {
    const useStyles = createStyles(({ css, isDarkMode }) => ({
      box: css({ background: isDarkMode ? '#000' : '#fff' }),
    }))

    let result: CreateStylesReturn
    const Consumer = defineComponent({
      setup() {
        result = useStyles()
        return () => h('div')
      },
    })

    const wrapper = mount(ThemeProvider, {
      props: { themeMode: 'light' },
      slots: { default: () => h(Consumer) },
    })

    const lightClass = result.styles.box
    await wrapper.setProps({ themeMode: 'dark' })
    await nextTick()
    const darkClass = result.styles.box
    expect(lightClass).not.toBe(darkClass)
  })

  it('should work with useTheme inside ThemeProvider', () => {
    let themeValue: ComputedRef<Theme>
    const Consumer = defineComponent({
      setup() {
        themeValue = useTheme()
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      props: { customToken: { myColor: 'red' } },
      slots: { default: () => h(Consumer) },
    })

    expect(themeValue.value.myColor).toBe('red')
  })

  it('should work with useThemeMode inside ThemeProvider', () => {
    let modeValue: ThemeModeContext
    const Consumer = defineComponent({
      setup() {
        modeValue = useThemeMode()
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      props: { themeMode: 'dark' },
      slots: { default: () => h(Consumer) },
    })

    expect(modeValue.appearance.value).toBe('dark')
    expect(modeValue.isDarkMode.value).toBe(true)
    expect(modeValue.themeMode.value).toBe('dark')
  })

  it('should truly isolate multiple instances with nested providers', () => {
    const instance1 = createInstance({ key: 'inst-a' })
    const instance2 = createInstance({ key: 'inst-b' })

    let theme1: ComputedRef<Theme>
    let theme2: ComputedRef<Theme>

    const Consumer1 = defineComponent({
      setup() {
        theme1 = instance1.useTheme()
        return () => h('div')
      },
    })

    const Consumer2 = defineComponent({
      setup() {
        theme2 = instance2.useTheme()
        return () => h('div')
      },
    })

    // Nest instance2 inside instance1 — they should not interfere
    const App = defineComponent({
      setup() {
        return () => h(instance1.ThemeProvider, { customToken: { color: 'red' } }, {
          default: () => [
            h(Consumer1),
            h(instance2.ThemeProvider, { customToken: { color: 'blue' } }, {
              default: () => h(Consumer2),
            }),
          ],
        })
      },
    })

    mount(App)

    expect(theme1.value.color).toBe('red')
    expect(theme2.value.color).toBe('blue')
  })

  it('should support multiple isolated instances', () => {
    const instance1 = createInstance({ key: 'app-one' })
    const instance2 = createInstance({ key: 'app-two' })

    const useStyles1 = instance1.createStyles(({ css }) => ({
      box: css({ color: 'red' }),
    }))
    const useStyles2 = instance2.createStyles(({ css }) => ({
      box: css({ color: 'blue' }),
    }))

    let result1: CreateStylesReturn
    let result2: CreateStylesReturn

    const Consumer1 = defineComponent({
      setup() {
        result1 = useStyles1()
        return () => h('div')
      },
    })
    const Consumer2 = defineComponent({
      setup() {
        result2 = useStyles2()
        return () => h('div')
      },
    })

    mount(instance1.ThemeProvider, {
      slots: { default: () => h(Consumer1) },
    })
    mount(instance2.ThemeProvider, {
      slots: { default: () => h(Consumer2) },
    })

    expect(result1.styles.box).toBeDefined()
    expect(result2.styles.box).toBeDefined()
    expect(typeof result1.styles.box).toBe('string')
    expect(typeof result2.styles.box).toBe('string')
  })
})
