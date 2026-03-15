import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { makeCreateStyles } from '../createStyles/createStyles'
import { createThemeProvider } from '../createThemeProvider'
import { createEmotion } from '../../core'
import type { CreateStylesReturn } from '../../types'
import type { ResponsiveUtil } from '../../utils'

const emotion = createEmotion()
const ThemeProvider = createThemeProvider(emotion)
const createStyles = makeCreateStyles(emotion)

describe('createStyles responsive', () => {
  it('should provide responsive helpers in factory callback', () => {
    let receivedResponsive: ResponsiveUtil

    const useStyles = createStyles(({ responsive }) => {
      receivedResponsive = responsive
      return {}
    })

    const Consumer = defineComponent({
      setup() {
        useStyles()
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      slots: { default: () => h(Consumer) },
    })

    expect(receivedResponsive).toBeDefined()
    expect(receivedResponsive.md).toBe('@media (max-width: 991px)')
    expect(receivedResponsive.xxl).toBe('@media (min-width: 1600px)')
  })

  it('should allow using responsive in css template literals', () => {
    const useStyles = createStyles(({ css, responsive }) => ({
      container: css`
        padding: 24px;
        ${responsive.md} {
          padding: 16px;
        }
      `,
    }))

    let result: CreateStylesReturn
    const Consumer = defineComponent({
      setup() {
        result = useStyles()
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      slots: { default: () => h(Consumer) },
    })

    expect(typeof result.styles.container).toBe('string')
    expect(result.styles.container.length).toBeGreaterThan(0)
  })
})
