import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { createInstance } from '../createInstance'
import type { CreateStylesReturn } from '../../types'

describe('createInstance', () => {
  it('should return all APIs', () => {
    const instance = createInstance()
    expect(instance.createStyles).toBeDefined()
    expect(instance.ThemeProvider).toBeDefined()
    expect(instance.useTheme).toBeDefined()
    expect(instance.useThemeMode).toBeDefined()
    expect(instance.css).toBeDefined()
    expect(instance.cx).toBeDefined()
    expect(instance.keyframes).toBeDefined()
    expect((instance as Record<string, unknown>).createInstance).toBeUndefined()
  })

  it('should work with custom key', () => {
    const instance = createInstance({ key: 'my-app' })
    expect(instance.css).toBeDefined()
  })

  it('should produce working ThemeProvider + createStyles', () => {
    const { ThemeProvider, createStyles } = createInstance()
    const useStyles = createStyles(({ css }) => ({
      box: css({ display: 'flex' }),
    }))

    let result!: CreateStylesReturn
    const Consumer = defineComponent({
      setup() {
        result = useStyles()
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      slots: { default: () => h(Consumer) },
    })

    expect(typeof result.styles.box).toBe('string')
  })
})
