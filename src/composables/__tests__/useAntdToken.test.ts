import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, type ComputedRef } from 'vue'
import { createThemeProvider } from '../../factories/createThemeProvider'
import { createEmotion } from '../../core'
import { useAntdToken } from '../useAntdToken'
import type { AntdToken } from '../../types'

const emotion = createEmotion()
const ThemeProvider = createThemeProvider(emotion)

describe('useAntdToken', () => {
  it('should return only antd base tokens from theme prop', () => {
    let tokenResult!: ComputedRef<AntdToken>
    const Consumer = defineComponent({
      setup() {
        tokenResult = useAntdToken()
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      props: {
        theme: { token: { colorPrimary: '#1890ff' } },
        customToken: { myCustomColor: '#ff0000' },
      },
      slots: { default: () => h(Consumer) },
    })

    // antdToken should contain the theme base token
    expect(tokenResult.value.colorPrimary).toBe('#1890ff')
    // antdToken should NOT contain customToken values
    expect((tokenResult.value as any).myCustomColor).toBeUndefined()
  })

  it('should throw when used outside ThemeProvider', () => {
    const Consumer = defineComponent({
      setup() {
        useAntdToken()
        return () => h('div')
      },
    })
    expect(() => mount(Consumer)).toThrow('useAntdToken() must be used within a <ThemeProvider>')
  })
})
