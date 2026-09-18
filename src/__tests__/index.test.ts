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
  styleManager,
  staticStylesCache,
  createStaticStylesFactory,
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
    expect(styleManager).toBeDefined()
    expect(staticStylesCache).toBeDefined()
    expect(createStaticStylesFactory).toBeDefined()
    expect(styleManager.cache.key).toBe('acss')
  })

  it('should expose the cache used by the default static styles factory', () => {
    expect(createStaticStylesFactory().cache).toBe(staticStylesCache)
    expect(staticStylesCache).toBe(styleManager.cache)
  })

  it.each(['default', 'factory'] as const)('merges %s static styles with top-level cx in argument order', (kind) => {
    const makeStyles = kind === 'default' ? createStaticStyles : createStaticStylesFactory().createStaticStyles
    const blue = css({ color: 'blue' })
    const red = makeStyles({ root: { color: 'red' } }).root
    const element = document.createElement('div')
    document.body.append(element)
    try {
      element.className = cx(red, blue)
      expect(element.className.split(' ')).toHaveLength(1)
      expect(getComputedStyle(element).color).toBe('blue')
      element.className = cx(blue, red)
      expect(getComputedStyle(element).color).toBe('red')
    } finally {
      element.remove()
    }
  })
})
