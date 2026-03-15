import { describe, it, expect } from 'vitest'
import { responsiveHelpers, breakpoints } from '../responsive'

describe('responsiveHelpers', () => {
  it('should provide max-width media queries matching antdv-next token values', () => {
    expect(responsiveHelpers.xs).toBe('@media (max-width: 575px)')
    expect(responsiveHelpers.sm).toBe('@media (max-width: 767px)')
    expect(responsiveHelpers.md).toBe('@media (max-width: 991px)')
    expect(responsiveHelpers.lg).toBe('@media (max-width: 1199px)')
    expect(responsiveHelpers.xl).toBe('@media (max-width: 1599px)')
    expect(responsiveHelpers.xxl).toBe('@media (min-width: 1600px)')
  })

  it('should provide device aliases', () => {
    expect(responsiveHelpers.mobile).toBe(responsiveHelpers.xs)
    expect(responsiveHelpers.tablet).toBe(responsiveHelpers.md)
    expect(responsiveHelpers.laptop).toBe(responsiveHelpers.lg)
    expect(responsiveHelpers.desktop).toBe(responsiveHelpers.xxl)
  })
})

describe('breakpoints', () => {
  it('should match antdv-next token screen values', () => {
    expect(breakpoints.xs).toBe(480)
    expect(breakpoints.sm).toBe(576)
    expect(breakpoints.md).toBe(768)
    expect(breakpoints.lg).toBe(992)
    expect(breakpoints.xl).toBe(1200)
    expect(breakpoints.xxl).toBe(1600)
    expect(breakpoints.xxxl).toBe(1920)
  })

  it('max values should be next breakpoint - 1 (matching antdv-next token)', () => {
    expect(breakpoints.xsMax).toBe(breakpoints.sm - 1)
    expect(breakpoints.smMax).toBe(breakpoints.md - 1)
    expect(breakpoints.mdMax).toBe(breakpoints.lg - 1)
    expect(breakpoints.lgMax).toBe(breakpoints.xl - 1)
    expect(breakpoints.xlMax).toBe(breakpoints.xxl - 1)
    expect(breakpoints.xxlMax).toBe(breakpoints.xxxl - 1)
  })
})
