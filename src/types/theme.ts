import type { GlobalToken } from 'antdv-next'

/**
 * Theme algorithm function type.
 * Matches antdv-next's MappingAlgorithm (DerivativeFunc<SeedToken, MapToken>).
 */
type ThemeAlgorithm = (...args: unknown[]) => unknown

/**
 * Browser's preferred color scheme.
 */
export type BrowserPrefers = 'dark' | 'light'

/**
 * Theme appearance. Supports 'dark', 'light', and custom strings.
 * Matches upstream: `ThemeAppearance = 'dark' | 'light' | string`
 */
export type Appearance = 'dark' | 'light' | (string & {})

export type ThemeMode = 'light' | 'dark' | 'auto'

export interface ThemeModeState {
  themeMode: ThemeMode
  appearance: Appearance
  isDarkMode: boolean
  browserPrefers: BrowserPrefers
}

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

// TODO: Add CustomStylish augmentable interface when antdv-next introduces built-in stylish presets.
// Upstream antd-style has CustomStylish + AntdStylish → FullStylish.
// Currently antdv-next has no built-in stylish (verified in source), so stylish is Record<string, string>.

/**
 * Full token type: antdv-next's GlobalToken merged with user's CustomToken.
 */
export type FullToken = AntdToken & CustomToken

/**
 * Complete theme object.
 * Contains merged tokens + theme state + stylish + prefixCls.
 */
export interface Theme extends FullToken {
  stylish: Record<string, string>
  appearance: Appearance
  isDarkMode: boolean
  themeMode: ThemeMode
  browserPrefers: BrowserPrefers
  prefixCls: string
  iconPrefixCls: string
}

export interface ThemeConfig {
  token?: Partial<AntdToken>
  algorithm?: ThemeAlgorithm | ThemeAlgorithm[]
}

export type ThemeFunction = (appearance: Appearance) => ThemeConfig
