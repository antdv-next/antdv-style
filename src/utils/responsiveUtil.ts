import type { CSSInterpolation } from '@emotion/css/create-instance'
import type { ResponsiveHelpers } from '../types/css'
import type { Theme } from '../types/theme'
import type { EmotionInstance } from '../core'

interface BreakpointMap extends ResponsiveHelpers {}

type ResponsiveInput = Partial<Record<keyof BreakpointMap, CSSInterpolation | string>>

export interface ResponsiveUtil extends BreakpointMap {
  (breakpoints: ResponsiveInput): string
}

/**
 * Create a responsive utility that is both callable and indexable.
 *
 * As object: `responsive.md` → `@media (max-width: 991px)` (media query string)
 * As function: `responsive({ xs: { color: 'red' }, md: { color: 'blue' } })` → CSS text with media queries
 *
 * Breakpoint values are read from token (screenXSMax, etc.) with static fallbacks.
 */
export function createResponsiveUtil(
  token: Theme,
  emotion: EmotionInstance,
): ResponsiveUtil {
  const map: BreakpointMap = {
    xs: `@media (max-width: ${token.screenXSMax ?? 575}px)`,
    sm: `@media (max-width: ${token.screenSMMax ?? 767}px)`,
    md: `@media (max-width: ${token.screenMDMax ?? 991}px)`,
    lg: `@media (max-width: ${token.screenLGMax ?? 1199}px)`,
    xl: `@media (max-width: ${token.screenXLMax ?? 1599}px)`,
    xxl: `@media (min-width: ${token.screenXXL ?? 1600}px)`,
    mobile: `@media (max-width: ${token.screenXSMax ?? 575}px)`,
    tablet: `@media (max-width: ${token.screenMDMax ?? 991}px)`,
    laptop: `@media (max-width: ${token.screenLGMax ?? 1199}px)`,
    desktop: `@media (min-width: ${token.screenXXL ?? 1600}px)`,
  }

  const responsiveFn = (breakpoints: ResponsiveInput): string => {
    return Object.entries(breakpoints)
      .map(([key, value]) => {
        if (value == null) return ''
        const mediaQuery = map[key as keyof BreakpointMap]
        if (!mediaQuery) return ''

        // Get raw CSS text, not class name
        let cssText: string
        if (typeof value === 'string') {
          // Already a class name string from css`` — extract CSS from cache
          const cacheKey = value.replace(`${emotion.cache.key}-`, '')
          const cached = emotion.cache.inserted[cacheKey]
          cssText = typeof cached === 'string' ? cached : value
        } else {
          // CSS object — serialize via emotion and extract from cache
          const className = emotion.css(value)
          const cacheKey = className.replace(`${emotion.cache.key}-`, '')
          const cached = emotion.cache.inserted[cacheKey]
          cssText = typeof cached === 'string' ? cached : ''
        }

        return `${mediaQuery} {${cssText}}`
      })
      .join('')
  }

  Object.assign(responsiveFn, map)

  return responsiveFn as ResponsiveUtil
}
