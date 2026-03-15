import type { ResponsiveHelpers } from '../types/css'

export type { ResponsiveHelpers } from '../types/css'

/**
 * Breakpoint thresholds aligned with antdv-next's token values:
 *   screenXS=480, screenSM=576, screenMD=768, screenLG=992, screenXL=1200, screenXXL=1600, screenXXXL=1920
 *   screenXSMax=575, screenSMMax=767, screenMDMax=991, screenLGMax=1199, screenXLMax=1599, screenXXLMax=1919
 *
 * Uses integer values matching antdv-next token calculations (nextBreakpoint - 1).
 */
export const breakpoints = {
  xs: 480,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
  xxxl: 1920,
  // Max values = next breakpoint - 1 (matching antdv-next token: screenSM - 1, etc.)
  xsMax: 575,
  smMax: 767,
  mdMax: 991,
  lgMax: 1199,
  xlMax: 1599,
  xxlMax: 1919,
} as const

/**
 * CSS media query helpers for use in createStaticStyles.
 */
export const responsiveHelpers: ResponsiveHelpers = {
  xs: `@media (max-width: ${breakpoints.xsMax}px)`,
  sm: `@media (max-width: ${breakpoints.smMax}px)`,
  md: `@media (max-width: ${breakpoints.mdMax}px)`,
  lg: `@media (max-width: ${breakpoints.lgMax}px)`,
  xl: `@media (max-width: ${breakpoints.xlMax}px)`,
  xxl: `@media (min-width: ${breakpoints.xxl}px)`,
  mobile: `@media (max-width: ${breakpoints.xsMax}px)`,
  tablet: `@media (max-width: ${breakpoints.mdMax}px)`,
  laptop: `@media (max-width: ${breakpoints.lgMax}px)`,
  desktop: `@media (min-width: ${breakpoints.xxl}px)`,
}
