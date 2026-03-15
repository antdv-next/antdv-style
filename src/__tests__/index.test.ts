import { describe, it, expect } from 'vitest'
import {
  createStyles,
  createGlobalStyle,
  createStylish,
  createStaticStyles,
  ThemeProvider,
  useTheme,
  useThemeMode,
  useResponsive,
  useAntdToken,
  useAntdStylish,
  createInstance,
  extractStaticStyle,
  createCacheManager,
  css,
  cx,
  keyframes,
  StyleProvider,
  px2remTransformer,
  responsiveHelpers,
} from '../index'

describe('barrel export', () => {
  it('should export all P0 APIs', () => {
    expect(createStyles).toBeDefined()
    expect(createGlobalStyle).toBeDefined()
    expect(createStylish).toBeDefined()
    expect(ThemeProvider).toBeDefined()
    expect(useTheme).toBeDefined()
    expect(useThemeMode).toBeDefined()
    expect(useResponsive).toBeDefined()
    expect(createInstance).toBeDefined()
    expect(css).toBeDefined()
    expect(cx).toBeDefined()
    expect(keyframes).toBeDefined()
  })

  it('should export all P2 APIs', () => {
    expect(createStaticStyles).toBeDefined()
    expect(extractStaticStyle).toBeDefined()
    expect(createCacheManager).toBeDefined()
    expect(useAntdToken).toBeDefined()
    expect(useAntdStylish).toBeDefined()
  })

  it('should export new feature APIs', () => {
    expect(StyleProvider).toBeDefined()
    expect(px2remTransformer).toBeDefined()
    expect(responsiveHelpers).toBeDefined()
  })
})
