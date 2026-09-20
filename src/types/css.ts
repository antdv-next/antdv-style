import type {
  Theme,
  Appearance,
  FullStylish,
  CustomToken,
  CustomStylish,
} from './theme'
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

export type HashPriority = 'high' | 'low'
export type CssUtil = (...styles: Array<CSSInterpolation>) => string
export type ClassNamesUtil = (...classNames: Array<ClassNamesArg>) => string
export interface ClassNameGeneratorOption {
  hashPriority?: HashPriority
  label?: string
}

export type Breakpoint = 'xxl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs'
export type DeviceScreen = 'mobile' | 'tablet' | 'laptop' | 'desktop'
export type ResponsiveKey = Breakpoint | DeviceScreen
export type AtomInputType = string | CSSInterpolation
export type BreakpointMapParams = Partial<Record<ResponsiveKey, AtomInputType>>

export interface CreateStylesUtils<
  T extends object = CustomToken,
  S extends object = CustomStylish,
> {
  token: Theme<T, S>
  css: CssUtil
  cx: ClassNamesUtil
  prefixCls: string
  iconPrefixCls: string
  isDarkMode: boolean
  appearance: Appearance
  responsive: ResponsiveUtil
  stylish: FullStylish<S>
  cssVar: Record<string, string>
}

export type StyleInput = Record<string, CSSInterpolation | string>

/**
 * A single generated class name. In the Vue API, `css()` returns a string,
 * so atom styles are represented without React's SerializedStyles object.
 */
export type StyleAtom = string

export type StyleFactoryInput = StyleInput | StyleAtom

export type BaseReturnType = StyleFactoryInput
export type ReturnStyleToUse<T extends BaseReturnType> = StyleResult<T>
export type GetStyleFn<Input extends BaseReturnType, Props = void> = (utils: CreateStylesUtils, props: Props) => Input
export type StyleOrGetStyleFn<Input extends BaseReturnType, Props = void> = Input | GetStyleFn<Input, Props>
export interface CommonStyleUtils {
  css: CssUtil
  cx: ClassNamesUtil
  responsive: ResponsiveUtil
}

export type StyleResult<T extends StyleFactoryInput> = T extends string
  ? string
  : { [K in keyof T]: string }

export interface CreateStylesOptions {
  label?: string
  hashPriority?: 'high' | 'low'
}

export interface CreateStylesReturn<
  T = Record<string, string>,
  TTheme = Theme,
> {
  /** Generated class name map. Access via `s.styles.container` etc. */
  styles: T
  /** Emotion cx utility for merging class names. */
  cx: (...classNames: Array<ClassNamesArg>) => string
  /**
   * Full theme object (tokens + state). Use for reading style variables like `s.theme.colorPrimary`.
   * Note: `prefixCls` and `iconPrefixCls` also exist inside `theme` — prefer the top-level
   * `s.prefixCls` / `s.iconPrefixCls` for clarity.
   */
  theme: TTheme
  /** Antdv component class prefix. Prefer this over `theme.prefixCls`. */
  prefixCls: string
  /** Antdv icon class prefix. Prefer this over `theme.iconPrefixCls`. */
  iconPrefixCls: string
}
