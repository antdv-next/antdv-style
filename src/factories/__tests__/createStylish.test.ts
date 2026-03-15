import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, type ComputedRef } from 'vue'
import { makeCreateStylish } from '../createStylish'
import { createThemeProvider } from '../createThemeProvider'
import { createEmotion } from '../../core'

const emotion = createEmotion()
const ThemeProvider = createThemeProvider(emotion)
const createStylish = makeCreateStylish(emotion)

describe('createStylish', () => {
  it('should create reusable style presets', () => {
    const useStylish = createStylish(({ css }) => ({
      resetButton: css({
        border: 'none',
        background: 'none',
        padding: 0,
        cursor: 'pointer',
      }),
      cardShadow: css({
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }),
    }))

    let result: ComputedRef<Record<string, string>>
    const Consumer = defineComponent({
      setup() {
        result = useStylish()
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      slots: { default: () => h(Consumer) },
    })

    expect(typeof result.value.resetButton).toBe('string')
    expect(typeof result.value.cardShadow).toBe('string')
    expect(result.value.resetButton.length).toBeGreaterThan(0)
  })

  it('should use theme tokens', () => {
    const useStylish = createStylish(({ css, token }) => ({
      brandText: css({ color: token.brandColor }),
    }))

    let result: ComputedRef<Record<string, string>>
    const Consumer = defineComponent({
      setup() {
        result = useStylish()
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      props: { customToken: { brandColor: '#1890ff' } },
      slots: { default: () => h(Consumer) },
    })

    expect(typeof result.value.brandText).toBe('string')
  })

  it('should reactively update when theme changes', async () => {
    const useStylish = createStylish(({ css, isDarkMode }) => ({
      bg: css({ background: isDarkMode ? '#000' : '#fff' }),
    }))

    let result: ComputedRef<Record<string, string>>
    const Consumer = defineComponent({
      setup() {
        result = useStylish()
        return () => h('div')
      },
    })

    const wrapper = mount(ThemeProvider, {
      props: { themeMode: 'light' },
      slots: { default: () => h(Consumer) },
    })

    const lightClass = result.value.bg
    await wrapper.setProps({ themeMode: 'dark' })
    await nextTick()
    const darkClass = result.value.bg

    expect(lightClass).not.toBe(darkClass)
  })

  it('should throw when used outside ThemeProvider', () => {
    const useStylish = createStylish(({ css }) => ({
      box: css({ display: 'flex' }),
    }))

    const Consumer = defineComponent({
      setup() {
        useStylish()
        return () => h('div')
      },
    })

    expect(() => mount(Consumer)).toThrow()
  })
})
