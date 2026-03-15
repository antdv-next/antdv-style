import { createEmotion, DEFAULT_CSS_PREFIX_KEY } from '../core'
import { createContextKeys } from '../context/createKeys'
import { createThemeProvider } from '../factories/createThemeProvider'
import { makeCreateStyles } from '../factories/createStyles'
import { makeCreateGlobalStyle } from '../factories/createGlobalStyle'
import { makeCreateStylish } from '../factories/createStylish'
import { makeCreateStaticStyles } from '../factories/createStaticStyles'
import { makeUseTheme } from '../composables/useTheme'
import { makeUseThemeMode } from '../composables/useThemeMode'
import { useResponsive } from '../composables/useResponsive'
import { makeUseAntdToken } from '../composables/useAntdToken'
import { makeUseAntdStylish } from '../composables/useAntdStylish'
import { makeUseAntdTheme } from '../composables/useAntdTheme'
import { makeStyleProvider } from '../factories/createStyleProvider'
import { tokenToCSSVar, createCSSVarProxy } from '../utils/cssVar'
import { responsiveHelpers } from '../utils/responsive'

export interface CreateInstanceOptions {
  key?: string
  container?: HTMLElement
  hashPriority?: 'high' | 'low'
  cssVarPrefix?: string
}

export function createInstance(options?: CreateInstanceOptions) {
  const { key = DEFAULT_CSS_PREFIX_KEY, container, cssVarPrefix } = options ?? {}

  const keys = createContextKeys()
  const emotion = createEmotion({ key, container })
  const cssVar = createCSSVarProxy({ prefix: cssVarPrefix })

  const ThemeProvider = createThemeProvider(emotion, keys)
  const createStyles = makeCreateStyles(emotion, {
    hashPriority: options?.hashPriority,
    cssVar,
  }, keys)
  const createGlobalStyle = makeCreateGlobalStyle(emotion, keys, { cssVar })
  const createStylish = makeCreateStylish(emotion, keys, { cssVar })
  const createStaticStyles = makeCreateStaticStyles(emotion, { cssVarPrefix })
  const StyleProvider = makeStyleProvider(keys)

  // Create per-instance composables
  const useTheme = makeUseTheme(keys)
  const useThemeMode = makeUseThemeMode(keys)
  const useAntdToken = makeUseAntdToken(keys)
  const useAntdStylish = makeUseAntdStylish(keys)
  const useAntdTheme = makeUseAntdTheme(keys)

  return {
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
    css: emotion.css,
    cx: emotion.cx,
    keyframes: emotion.keyframes,
    injectGlobal: emotion.injectGlobal,
    cssVar,
    responsive: responsiveHelpers,
    tokenToCSSVar,
  }
}
