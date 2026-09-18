import { createInstanceWithEmotion } from './functions/createInstance'
import { defaultEmotion } from './factories/createStaticStyles'

const defaultInstance = createInstanceWithEmotion(defaultEmotion)

export const {
  createStyles,
  createGlobalStyle,
  createStylish,
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
  styleManager,
} = defaultInstance

export { createInstance } from './functions'
export { extractStaticStyle } from './functions'
export { createCacheManager } from './core'
export { createContextKeys } from './context'
export { makeStyleProvider } from './factories/createStyleProvider'
export {
  createStaticStyles,
  createStaticStylesFactory,
  staticStylesCache,
} from './factories/createStaticStyles'
export { px2remTransformer } from './utils/px2rem'
export { legacyLogicalPropertiesTransformer } from '@antdv-next/cssinjs'
export { responsiveHelpers } from './utils/responsive'
export { createCSSVarProxy } from './utils/cssVar'
export { createResponsiveUtil } from './utils/responsiveUtil'

export type {
  Appearance,
  ThemeAppearance,
  BrowserPrefers,
  ThemeMode,
  ThemeModeState,
  AppearanceState,
  CustomToken,
  CustomStylish,
  AntdStylish,
  FullStylish,
  FullToken,
  Theme,
  ThemeConfig,
  ThemeFunction,
  GetAntdTheme,
  GetCustomToken,
  GetCustomStylish,
  CustomTheme,
  MappingAlgorithm,
  ResponsiveHelpers,
  HashPriority,
  CssUtil,
  ClassNamesUtil,
  ClassNameGeneratorOption,
  Breakpoint,
  DeviceScreen,
  ResponsiveKey,
  AtomInputType,
  BreakpointMapParams,
  CommonStyleUtils,
  BaseReturnType,
  ReturnStyleToUse,
  GetStyleFn,
  StyleOrGetStyleFn,
  CreateStylesUtils,
  StyleInput,
  StyleAtom,
  StyleFactoryInput,
  StyleResult,
  CreateStylesOptions,
  CreateStylesReturn,
} from './types'

export type { CreateInstanceOptions, CreateInstanceResult } from './functions'
export type { ContextKeys, ThemeModeContext } from './context'
export type {
  StyleProviderProps,
  AntdvStyleCache,
  ThemeProviderProps,
  StaticInstance,
  CreateThemeProviderDefaults,
} from './factories'
export type { ExtractStyleResult } from './functions'
export type { ExtractStyleOptions } from './functions/extractStaticStyle'
export type { EmotionInstance } from './core'
export type { CacheManagerInstance } from './core'
export type { ResponsiveState } from './composables/useResponsive'
export type { Px2RemOptions } from './utils/px2rem'
export type { AntdTheme } from './composables/useAntdTheme'
export type { CSSVarOptions } from './utils/cssVar'
export type { ResponsiveUtil } from './utils/responsiveUtil'
export type { StaticStylesInput, StaticStyleFactory, StaticStyleUtils, StaticStylesResult } from './factories/createStaticStyles'
