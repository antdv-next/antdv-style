import { createInstance } from './functions'

const defaultInstance = createInstance()

export const {
  createStyles,
  createGlobalStyle,
  createStylish,
  createStaticStyles,
  ThemeProvider,
  StyleProvider,
  useTheme,
  useThemeMode,
  useResponsive,
  useAntdToken,
  useAntdStylish,
  useAntdTheme,
  css,
  cx,
  keyframes,
  cssVar,
  tokenToCSSVar,
  injectGlobal,
  responsive,
} = defaultInstance

export { createInstance } from './functions'
export { extractStaticStyle } from './functions'
export { createCacheManager } from './core'
export { createContextKeys } from './context'
export { makeStyleProvider } from './factories/createStyleProvider'
export { px2remTransformer } from './utils/px2rem'
export { responsiveHelpers } from './utils/responsive'
export { createCSSVarProxy } from './utils/cssVar'
export { createResponsiveUtil } from './utils/responsiveUtil'

export type {
  Appearance,
  BrowserPrefers,
  ThemeMode,
  ThemeModeState,
  CustomToken,
  FullToken,
  Theme,
  ThemeConfig,
  ThemeFunction,
  ResponsiveHelpers,
  CreateStylesUtils,
  StyleInput,
  CreateStylesOptions,
  CreateStylesReturn,
} from './types'

export type { CreateInstanceOptions } from './functions'
export type { ContextKeys, ThemeModeContext } from './context'
export type { ExtractStyleResult } from './functions'
export type { EmotionInstance } from './core'
export type { CacheManagerInstance } from './core'
export type { ResponsiveState } from './composables/useResponsive'
export type { Px2RemOptions } from './utils/px2rem'
export type { AntdTheme } from './composables/useAntdTheme'
export type { CSSVarOptions } from './utils/cssVar'
export type { ResponsiveUtil } from './utils/responsiveUtil'
export type { StaticStyleUtils } from './factories/createStaticStyles'
