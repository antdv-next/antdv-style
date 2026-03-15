import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { createThemeProvider } from '../createThemeProvider'
import { makeCreateStyles } from '../createStyles'
import { createEmotion } from '../../core'

const emotion = createEmotion()
const ThemeProvider = createThemeProvider(emotion)
const createStyles = makeCreateStyles(emotion)

describe('createStyles stylish injection', () => {
  it('should provide stylish in the factory utils', () => {
    let receivedStylish: Record<string, string>

    const useStyles = createStyles(({ stylish }) => {
      receivedStylish = stylish
      return { container: { display: 'block' } }
    })

    const Consumer = defineComponent({
      setup() {
        useStyles()
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      props: { themeMode: 'light' },
      slots: { default: () => h(Consumer) },
    })

    expect(receivedStylish).toEqual({})
  })

  it('should pass stylish prop from ThemeProvider', () => {
    let receivedStylish: Record<string, string>

    const useStyles = createStyles(({ stylish }) => {
      receivedStylish = stylish
      return { container: { display: 'block' } }
    })

    const Consumer = defineComponent({
      setup() {
        useStyles()
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      props: {
        themeMode: 'light',
        stylish: { defaultCard: 'card-class-name' },
      },
      slots: { default: () => h(Consumer) },
    })

    expect(receivedStylish).toEqual({ defaultCard: 'card-class-name' })
  })
})
