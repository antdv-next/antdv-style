import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, type ComputedRef } from 'vue'
import { createInstance } from '../functions'
import type { FullToken, Theme } from '../types'
import type { AntdTheme } from '../composables/useAntdTheme'

// Module augmentation: declare custom token shape
declare module '../types' {
  interface CustomToken {
    brandColor: string
    headerHeight: number
  }
}

describe('Type Safety', () => {
  it('should provide typed token access in createStyles', () => {
    const { ThemeProvider, createStyles } = createInstance()

    const useStyles = createStyles(({ token, css }) => {
      // token should have CustomToken properties available at compile time
      const _brand: string | undefined = token.brandColor
      const _height: number | undefined = token.headerHeight

      return {
        header: css`
          height: ${_height ?? 64}px;
          color: ${_brand ?? '#000'};
        `,
      }
    })

    const Consumer = defineComponent({
      setup() {
        const { styles } = useStyles()
        expect(styles.header).toBeDefined()
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      props: {
        themeMode: 'light',
        customToken: { brandColor: '#7c3aed', headerHeight: 64 },
      },
      slots: { default: () => h(Consumer) },
    })
  })

  it('useTheme should return typed token with CustomToken properties', () => {
    const { ThemeProvider, useTheme } = createInstance()

    let themeResult!: ComputedRef<Theme>
    const Consumer = defineComponent({
      setup() {
        themeResult = useTheme()
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      props: {
        themeMode: 'light',
        customToken: { brandColor: '#7c3aed', headerHeight: 64 },
      },
      slots: { default: () => h(Consumer) },
    })

    expect(themeResult.value.brandColor).toBe('#7c3aed')
    expect(themeResult.value.headerHeight).toBe(64)
  })

  it('useAntdTheme should return antd token spread at top level with stylish', () => {
    const { ThemeProvider, useAntdTheme } = createInstance()

    let themeResult!: ComputedRef<AntdTheme>
    const Consumer = defineComponent({
      setup() {
        themeResult = useAntdTheme()
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      props: {
        themeMode: 'dark',
        theme: { token: { colorPrimary: '#1890ff' } },
        customToken: { brandColor: '#7c3aed', headerHeight: 64 },
      },
      slots: { default: () => h(Consumer) },
    })

    // Token fields are spread at top level (upstream alignment)
    expect(themeResult.value.colorPrimary).toBe('#1890ff')
    expect(themeResult.value.stylish).toBeDefined()
    // customToken is NOT included in useAntdTheme (matches upstream behavior)
    expect((themeResult.value as any).brandColor).toBeUndefined()
  })

  it('FullToken should merge base properties with CustomToken', () => {
    const sample = {
      brandColor: '#fff',
      headerHeight: 64,
      colorPrimary: '#1890ff',
    } as unknown as FullToken
    expect(sample.brandColor).toBe('#fff')
  })
})
