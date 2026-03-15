import type { Theme, Appearance } from './theme'
import type { ResponsiveUtil } from '../utils/responsiveUtil'
import type { CSSInterpolation, ClassNamesArg } from '@emotion/css/create-instance'

export interface ResponsiveHelpers {
  xs: string
  sm: string
  md: string
  lg: string
  xl: string
  xxl: string
  mobile: string
  tablet: string
  laptop: string
  desktop: string
}

export interface CreateStylesUtils {
  token: Theme
  css: (...args: Array<CSSInterpolation>) => string
  cx: (...classNames: Array<ClassNamesArg>) => string
  prefixCls: string
  iconPrefixCls: string
  isDarkMode: boolean
  appearance: Appearance
  responsive: ResponsiveUtil
  stylish: Record<string, string>
  cssVar: Record<string, string>
}

export type StyleInput = Record<string, CSSInterpolation | string>

export interface CreateStylesOptions {
  label?: string
  hashPriority?: 'high' | 'low'
}

export interface CreateStylesReturn {
  /** Generated class name map. Access via `s.styles.container` etc. */
  styles: Record<string, string>
  /** Emotion cx utility for merging class names. */
  cx: (...classNames: Array<ClassNamesArg>) => string
  /**
   * Full theme object (tokens + state). Use for reading style variables like `s.theme.colorPrimary`.
   * Note: `prefixCls` and `iconPrefixCls` also exist inside `theme` — prefer the top-level
   * `s.prefixCls` / `s.iconPrefixCls` for clarity.
   */
  theme: Theme
  /** Antdv component class prefix. Prefer this over `theme.prefixCls`. */
  prefixCls: string
  /** Antdv icon class prefix. Prefer this over `theme.iconPrefixCls`. */
  iconPrefixCls: string
}
