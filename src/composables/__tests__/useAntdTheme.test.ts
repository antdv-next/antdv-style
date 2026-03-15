import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, type ComputedRef } from 'vue'
import { createThemeProvider } from '../../factories/createThemeProvider'
import { createEmotion } from '../../core'
import { useAntdTheme, type AntdTheme } from '../useAntdTheme'

const emotion = createEmotion()
const ThemeProvider = createThemeProvider(emotion)

describe('useAntdTheme', () => {
  it('should return token fields spread at top level with stylish', () => {
    let themeResult: ComputedRef<AntdTheme>
    const Consumer = defineComponent({
      setup() {
        themeResult = useAntdTheme()
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      props: {
        themeMode: 'light',
        theme: { token: { colorPrimary: '#1890ff' } },
        customToken: { brandColor: '#ff0000' },
      },
      slots: { default: () => h(Consumer) },
    })

    // Token fields are spread at top level (upstream alignment)
    expect(themeResult.value.colorPrimary).toBe('#1890ff')
    expect(themeResult.value.stylish).toEqual({})
    // No nested token, no appearance/isDarkMode (those come from useThemeMode)
    expect(themeResult.value.token).toBeUndefined()
  })

  it('should throw when used outside ThemeProvider', () => {
    const Consumer = defineComponent({
      setup() {
        useAntdTheme()
        return () => h('div')
      },
    })
    expect(() => mount(Consumer)).toThrow('useAntdTheme() must be used within a <ThemeProvider>')
  })
})
