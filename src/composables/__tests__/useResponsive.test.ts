import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { useResponsive, _resetResponsiveForTesting, type ResponsiveState } from '../useResponsive'
import { breakpoints as bp } from '../../utils/responsive'

describe('useResponsive', () => {
  // Map media queries to breakpoint keys matching the new min-width semantics
  const queryToKey: Record<string, string> = {
    [`(max-width: ${bp.xsMax}px)`]: 'xs',
    [`(min-width: ${bp.sm}px)`]: 'sm',
    [`(min-width: ${bp.md}px)`]: 'md',
    [`(min-width: ${bp.lg}px)`]: 'lg',
    [`(min-width: ${bp.xl}px)`]: 'xl',
    [`(min-width: ${bp.xxl}px)`]: 'xxl',
  }

  const mockMatchMedia = (matches: Record<string, boolean>) => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
      const key = queryToKey[query] ?? ''
      return {
        matches: matches[key] ?? false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as MediaQueryList
    })
  }

  beforeEach(() => {
    _resetResponsiveForTesting()
    vi.restoreAllMocks()
  })

  it('should return responsive state with min-width semantics', () => {
    // Simulate a ~1024px screen: xs=false, sm=true, md=true, lg=true, xl=false, xxl=false
    mockMatchMedia({ xs: false, sm: true, md: true, lg: true, xl: false, xxl: false })

    let result: ResponsiveState
    const Consumer = defineComponent({
      setup() {
        result = useResponsive()
        return () => h('div')
      },
    })

    mount(Consumer)

    expect(result.xs).toBe(false)
    expect(result.sm).toBe(true)
    expect(result.md).toBe(true)
    expect(result.lg).toBe(true)
    expect(result.xl).toBe(false)
    expect(result.xxl).toBe(false)
  })

  it('should detect xxl screen', () => {
    mockMatchMedia({ xs: false, sm: true, md: true, lg: true, xl: true, xxl: true })

    let result: ResponsiveState
    const Consumer = defineComponent({
      setup() {
        result = useResponsive()
        return () => h('div')
      },
    })

    mount(Consumer)

    expect(result.xs).toBe(false)
    expect(result.xxl).toBe(true)
  })

  it('should detect xs screen', () => {
    // Small screen: only xs is true (max-width), all min-width queries are false
    mockMatchMedia({ xs: true, sm: false, md: false, lg: false, xl: false, xxl: false })

    let result: ResponsiveState
    const Consumer = defineComponent({
      setup() {
        result = useResponsive()
        return () => h('div')
      },
    })

    mount(Consumer)

    expect(result.xs).toBe(true)
    expect(result.sm).toBe(false)
  })

  it('should have all breakpoint keys', () => {
    mockMatchMedia({})

    let result: ResponsiveState
    const Consumer = defineComponent({
      setup() {
        result = useResponsive()
        return () => h('div')
      },
    })

    mount(Consumer)

    expect('xs' in result).toBe(true)
    expect('sm' in result).toBe(true)
    expect('md' in result).toBe(true)
    expect('lg' in result).toBe(true)
    expect('xl' in result).toBe(true)
    expect('xxl' in result).toBe(true)
  })

  it('should clean up listeners on unmount', () => {
    mockMatchMedia({})

    const Consumer = defineComponent({
      setup() {
        useResponsive()
        return () => h('div')
      },
    })

    const wrapper = mount(Consumer)
    wrapper.unmount()

    expect(window.matchMedia).toHaveBeenCalled()
  })

  it('should return safe defaults when matchMedia is unavailable', () => {
    const originalMatchMedia = window.matchMedia
    // @ts-ignore
    delete window.matchMedia

    const Consumer = defineComponent({
      setup() {
        const state = useResponsive()
        expect(state.xs).toBe(false)
        expect(state.sm).toBe(false)
        return () => h('div')
      },
    })

    mount(Consumer)
    window.matchMedia = originalMatchMedia
  })
})
