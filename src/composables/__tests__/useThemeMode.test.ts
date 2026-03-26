import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { createThemeProvider } from '../../factories/createThemeProvider'
import { createEmotion } from '../../core'
import { useThemeMode } from '../useThemeMode'
import type { ThemeModeContext } from '../../context'

const emotion = createEmotion()
const ThemeProvider = createThemeProvider(emotion)

describe('useThemeMode', () => {
  it('should return theme mode state', () => {
    let modeResult!: ThemeModeContext
    const Consumer = defineComponent({
      setup() {
        modeResult = useThemeMode()
        return () => h('div')
      },
    })
    mount(ThemeProvider, {
      props: { themeMode: 'dark' },
      slots: { default: () => h(Consumer) },
    })
    expect(modeResult.themeMode.value).toBe('dark')
    expect(modeResult.appearance.value).toBe('dark')
    expect(modeResult.isDarkMode.value).toBe(true)
  })

  it('should throw when used outside ThemeProvider', () => {
    const Consumer = defineComponent({
      setup() {
        useThemeMode()
        return () => h('div')
      },
    })
    expect(() => mount(Consumer)).toThrow('useThemeMode() must be used within a <ThemeProvider>')
  })
})
