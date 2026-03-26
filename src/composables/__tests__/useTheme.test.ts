import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, type ComputedRef } from 'vue'
import { createThemeProvider } from '../../factories/createThemeProvider'
import { createEmotion } from '../../core'
import { useTheme } from '../useTheme'
import type { Theme } from '../../types'

const emotion = createEmotion()
const ThemeProvider = createThemeProvider(emotion)

describe('useTheme', () => {
  it('should return theme token object', () => {
    let themeResult!: ComputedRef<Theme>
    const Consumer = defineComponent({
      setup() {
        themeResult = useTheme()
        return () => h('div')
      },
    })
    mount(ThemeProvider, {
      props: { customToken: { brandColor: '#ff0' } },
      slots: { default: () => h(Consumer) },
    })
    expect(themeResult.value.brandColor).toBe('#ff0')
  })

  it('should throw when used outside ThemeProvider', () => {
    const Consumer = defineComponent({
      setup() {
        useTheme()
        return () => h('div')
      },
    })
    expect(() => mount(Consumer)).toThrow('useTheme() must be used within a <ThemeProvider>')
  })
})
