import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, type ComputedRef } from 'vue'
import { createThemeProvider } from '../../factories/createThemeProvider'
import { createEmotion } from '../../core'
import { useAntdStylish } from '../useAntdStylish'

const emotion = createEmotion()
const ThemeProvider = createThemeProvider(emotion)

describe('useAntdStylish', () => {
  it('should return empty object when no stylish defined', () => {
    let result!: ComputedRef<Record<string, string>>
    const Consumer = defineComponent({
      setup() {
        result = useAntdStylish()
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      slots: { default: () => h(Consumer) },
    })

    expect(result.value).toEqual({})
  })

  it('should return stylish from ThemeProvider stylish prop', () => {
    let result!: ComputedRef<Record<string, string>>
    const Consumer = defineComponent({
      setup() {
        result = useAntdStylish()
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      props: { stylish: { card: 'card-class' } },
      slots: { default: () => h(Consumer) },
    })

    expect(result.value.card).toBe('card-class')
  })

  it('should throw when used outside ThemeProvider', () => {
    const Consumer = defineComponent({
      setup() {
        useAntdStylish()
        return () => h('div')
      },
    })
    expect(() => mount(Consumer)).toThrow('useAntdStylish() must be used within a <ThemeProvider>')
  })
})
