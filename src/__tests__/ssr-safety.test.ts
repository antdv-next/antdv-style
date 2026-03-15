import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { createInstance } from '../functions'
import { createCacheManager, createEmotion } from '../core'
import type { CreateStylesReturn } from '../types'

describe('SSR Safety', () => {
  it('should create instance without accessing DOM', () => {
    expect(() => createInstance()).not.toThrow()
  })

  it('should render ThemeProvider and createStyles without DOM errors', () => {
    const { ThemeProvider, createStyles } = createInstance()

    const useStyles = createStyles(({ token, css }) => ({
      container: css`color: red;`,
    }))

    let stylesResult: CreateStylesReturn
    const Consumer = defineComponent({
      setup() {
        stylesResult = useStyles()
        return () => h('div')
      },
    })

    expect(() => {
      mount(ThemeProvider, {
        props: { themeMode: 'light' },
        slots: { default: () => h(Consumer) },
      })
    }).not.toThrow()

    expect(stylesResult.styles.container).toBeDefined()
  })

  it('should extract styles via CacheManager for SSR', () => {
    const emotion = createEmotion()
    const manager = createCacheManager(emotion)

    emotion.css({ color: 'red' })
    emotion.css({ backgroundColor: 'blue' })

    const result = manager.getStyles()
    expect(result).toContain('color')
  })
})
