import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'

describe('Performance: Style Factory Cache', () => {
  it('should not re-run factory for same inputs across components', async () => {
    const { createInstance } = await import('../functions')
    const { ThemeProvider, createStyles } = createInstance()

    let factoryCallCount = 0
    const useStyles = createStyles(({ css }) => {
      factoryCallCount++
      return { box: css`color: red;` }
    })

    const Consumer = defineComponent({
      setup() {
        useStyles()
        return () => h('div')
      },
    })

    for (let i = 0; i < 3; i++) {
      mount(ThemeProvider, {
        props: { themeMode: 'light' },
        slots: { default: () => h(Consumer) },
      })
    }

    expect(factoryCallCount).toBe(1)
  })
})

describe('Performance: Singleton useResponsive', () => {
  it('should share listeners across multiple components', async () => {
    const addEventSpy = vi.fn()
    const mockMediaQuery = {
      matches: false,
      addEventListener: addEventSpy,
      removeEventListener: vi.fn(),
    }
    vi.spyOn(window, 'matchMedia').mockReturnValue(mockMediaQuery as unknown as MediaQueryList)

    // Dynamic import after spy to get fresh state
    const mod = await import('../composables/useResponsive')

    const Consumer = defineComponent({
      setup() {
        mod.useResponsive()
        return () => h('div')
      },
    })

    const wrappers = []
    for (let i = 0; i < 5; i++) {
      wrappers.push(mount(Consumer))
    }
    await nextTick()

    // With singleton: matchMedia called at most 10 times (6 breakpoints + 4 device aliases)
    // Without singleton: 50 times (10 * 5)
    const matchMediaCalls = vi.mocked(window.matchMedia).mock.calls.length
    expect(matchMediaCalls).toBeLessThanOrEqual(10)

    for (const w of wrappers) w.unmount()
    vi.restoreAllMocks()
  })
})
