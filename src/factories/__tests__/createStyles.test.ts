import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref, nextTick } from 'vue'
import { makeCreateStyles } from '../createStyles/createStyles'
import { createThemeProvider } from '../createThemeProvider'
import { createEmotion } from '../../core'
import type { CreateStylesReturn, Theme, Appearance } from '../../types'

const emotion = createEmotion()
const ThemeProvider = createThemeProvider(emotion)
const createStyles = makeCreateStyles(emotion)

describe('createStyles', () => {
  it('should create a composable that returns styles', () => {
    const useStyles = createStyles(({ css }) => ({
      container: css({ color: 'red' }),
    }))

    let result!: CreateStylesReturn
    const Consumer = defineComponent({
      setup() {
        result = useStyles()
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      slots: { default: () => h(Consumer) },
    })

    expect(result.styles.container).toBeDefined()
    expect(typeof result.styles.container).toBe('string')
    expect(result.cx).toBeDefined()
    expect(result.theme).toBeDefined()
    expect(result.prefixCls).toBe('ant')
  })

  it('should support external props via getter', () => {
    const useStyles = createStyles(({ css }, props: { color: string }) => ({
      box: css({ color: props.color }),
    }))

    let result!: CreateStylesReturn
    const Consumer = defineComponent({
      setup() {
        result = useStyles(() => ({ color: 'blue' }))
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      slots: { default: () => h(Consumer) },
    })

    expect(result.styles.box).toBeDefined()
    expect(typeof result.styles.box).toBe('string')
  })

  it('should provide token from ThemeProvider', () => {
    let receivedToken!: Theme
    const useStyles = createStyles(({ token }) => {
      receivedToken = token
      return {}
    })

    const Consumer = defineComponent({
      setup() {
        useStyles()
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      props: { customToken: { brandColor: '#abc' } },
      slots: { default: () => h(Consumer) },
    })

    expect(receivedToken.brandColor).toBe('#abc')
  })

  it('should provide isDarkMode and appearance', () => {
    let receivedAppearance!: Appearance
    let receivedIsDark!: boolean

    const useStyles = createStyles(({ appearance, isDarkMode }) => {
      receivedAppearance = appearance
      receivedIsDark = isDarkMode
      return {}
    })

    const Consumer = defineComponent({
      setup() {
        useStyles()
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      props: { themeMode: 'dark' },
      slots: { default: () => h(Consumer) },
    })

    expect(receivedAppearance).toBe('dark')
    expect(receivedIsDark).toBe(true)
  })

  it('should reactively update styles when theme changes', async () => {
    const useStyles = createStyles(({ css, isDarkMode }) => ({
      box: css({ color: isDarkMode ? 'white' : 'black' }),
    }))

    let result!: CreateStylesReturn
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

  it('should reactively update styles when props change', async () => {
    const useStyles = createStyles(({ css }, props: { color: string }) => ({
      box: css({ color: props.color }),
    }))

    let result!: CreateStylesReturn
    const colorRef = ref('red')

    const Consumer = defineComponent({
      setup() {
        result = useStyles(() => ({ color: colorRef.value }))
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      slots: { default: () => h(Consumer) },
    })

    const firstClass = result.styles.box
    colorRef.value = 'blue'
    await nextTick()
    const secondClass = result.styles.box

    expect(firstClass).not.toBe(secondClass)
  })

  it('should throw when used outside ThemeProvider', () => {
    const useStyles = createStyles(() => ({}))
    const Consumer = defineComponent({
      setup() {
        useStyles()
        return () => h('div')
      },
    })
    expect(() => mount(Consumer)).toThrow()
  })
})
