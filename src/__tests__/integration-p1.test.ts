import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, type ComputedRef } from 'vue'
import { createInstance } from '../functions'
import type { CreateStylesReturn } from '../types'

afterEach(() => {
  document.querySelectorAll('style[data-antdv-global]').forEach(el => el.remove())
})

describe('P1 integration', () => {
  it('should use createGlobalStyle with ThemeProvider', () => {
    const { ThemeProvider, createGlobalStyle } = createInstance()

    const useGlobal = createGlobalStyle(({ token }) => ({
      body: {
        backgroundColor: token.bgColor,
      },
    }))

    const Consumer = defineComponent({
      setup() {
        useGlobal()
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      props: { customToken: { bgColor: '#fafafa' } },
      slots: { default: () => h(Consumer) },
    })

    const styleEl = document.querySelector('style[data-antdv-global]')
    expect(styleEl).not.toBeNull()
    expect(styleEl!.textContent).toContain('#fafafa')
  })

  it('should compose createStylish with createStyles', () => {
    const { ThemeProvider, createStylish, createStyles } = createInstance()

    const useStylish = createStylish(({ css }) => ({
      card: css({
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }),
    }))

    const useStyles = createStyles(({ css }) => ({
      container: css({ padding: '16px' }),
    }))

    let stylishResult: ComputedRef<Record<string, string>>
    let stylesResult: CreateStylesReturn

    const Consumer = defineComponent({
      setup() {
        stylishResult = useStylish()
        stylesResult = useStyles()
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      slots: { default: () => h(Consumer) },
    })

    expect(typeof stylishResult.value.card).toBe('string')
    expect(typeof stylesResult.styles.container).toBe('string')
  })
})
