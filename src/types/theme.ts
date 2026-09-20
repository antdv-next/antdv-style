import type { GlobalToken, ThemeConfig as AntdvThemeConfig } from 'antdv-next'
import type { CssUtil } from './css'

export type MappingAlgorithm = Exclude<NonNullable<AntdvThemeConfig['algorithm']>, unknown[]>

/**
 * Browser's preferred color scheme.
 */
export type BrowserPrefers = 'dark' | 'light'

/**
 * Theme appearance. Supports 'dark', 'light', and custom strings.
 * Matches upstream: `ThemeAppearance = 'dark' | 'light' | string`
 */
export type Appearance = 'dark' | 'light' | (string & {})
export type ThemeAppearance = Appearance

export type ThemeMode = 'light' | 'dark' | 'auto'

export interface ThemeModeState {
  themeMode: ThemeMode
  appearance: Appearance
  isDarkMode: boolean
  browserPrefers: BrowserPrefers
}

export type AppearanceState = Pick<ThemeModeState, 'appearance' | 'isDarkMode'>

/**
 * Base antd token type, re-exported from antdv-next.
 */
export type AntdToken = GlobalToken

/**
 * Augmentable interface for custom token types.
 * Users declare their tokens via module augmentation:
 *
 * ```ts
 * declare module 'antdv-style' {
 *   interface CustomToken {
 *     brandColor: string
 *     headerHeight: number
 *   }
 * }
 * ```
 */
export interface CustomToken {}

export interface AntdStylish {
  buttonDefaultHover: string
}

export interface CustomStylish {}

export interface CustomTheme extends CustomStylish, CustomToken {}

export type FullStylish<S extends object = CustomStylish> = AntdStylish & S

/**
 * Full token type: antdv-next's GlobalToken merged with user's CustomToken.
 */
export type FullToken<T extends object = CustomToken> = AntdToken & T

/**
 * Complete theme object.
 * Contains merged tokens + theme state + stylish + prefixCls.
 */
export type Theme<
  T extends object = CustomToken,
  S extends object = CustomStylish,
> = FullToken<T> & {
  stylish: FullStylish<S>
  appearance: Appearance
  isDarkMode: boolean
  themeMode: ThemeMode
  browserPrefers: BrowserPrefers
  prefixCls: string
  iconPrefixCls: string
}

export type ThemeConfig = AntdvThemeConfig

export type ThemeFunction = (appearance: Appearance) => ThemeConfig
export type GetAntdTheme = ThemeFunction
export type GetCustomToken<T> = (params: {
  token: AntdToken
  appearance: Appearance
  isDarkMode: boolean
}) => T
export type GetCustomStylish<S = Record<string, string>> = (params: {
  token: FullToken
  stylish: AntdStylish
  appearance: Appearance
  isDarkMode: boolean
  css: CssUtil
}) => S
