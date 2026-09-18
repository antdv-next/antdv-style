import {
  createCSS,
  createEmotion,
  DEFAULT_CSS_VAR_PREFIX,
  registerEmotionInstance,
  unregisterEmotionInstance,
  type EmotionInstance,
} from '../core'
import { createContextKeys } from '../context/createKeys'
import { createThemeProvider } from '../factories/createThemeProvider'
import { makeCreateStyles } from '../factories/createStyles'
import { makeCreateGlobalStyle } from '../factories/createGlobalStyle'
import { makeCreateStylish } from '../factories/createStylish'
import { makeCreateStaticStylesFactory } from '../factories/createStaticStyles'
import { makeUseTheme } from '../composables/useTheme'
import { makeUseThemeMode } from '../composables/useThemeMode'
import { useResponsive } from '../composables/useResponsive'
import { makeUseAntdToken } from '../composables/useAntdToken'
import { makeUseAntdStylish } from '../composables/useAntdStylish'
import { makeUseAntdTheme } from '../composables/useAntdTheme'
import { makeStyleProvider } from '../factories/createStyleProvider'
import { tokenToCSSVar, createCSSVarProxy } from '../utils/cssVar'
import { responsiveHelpers } from '../utils/responsive'
import type { ComputedRef } from 'vue'
import type {
  CreateStylesOptions,
  CreateStylesReturn,
  CreateStylesUtils,
  CustomToken,
  StyleFactoryInput,
  StyleInput,
  StyleResult,
  Theme,
} from '../types'

export interface CreateInstanceOptions<T extends object = CustomToken> {
  key?: string
  container?: Node
  hashPriority?: 'high' | 'low'
  cssVarPrefix?: string
  prefixCls?: string
  iconPrefixCls?: string
  speedy?: boolean
  nonce?: string
  insertionPoint?: HTMLElement
  stylisPlugins?: Parameters<typeof createEmotion>[0] extends infer T
    ? T extends { stylisPlugins?: infer P } ? P : never
    : never
  customToken?: T
}

type InstanceCreateStyles<T extends object> = <P = void, R extends StyleFactoryInput = StyleInput>(
  factory: R | ((utils: CreateStylesUtils<T>, props: P) => R),
  options?: CreateStylesOptions,
) => (propsOrGetter?: P | (() => P)) => CreateStylesReturn<StyleResult<R>, Theme<T>>

type InstanceCreateGlobalStyle<T extends object> = (
  factory: (utils: CreateStylesUtils<T>) => Record<string, unknown> | string | void,
) => () => void

type InstanceCreateStylish<T extends object> = <P = void, R extends StyleFactoryInput = StyleInput>(
  factory: R | ((utils: CreateStylesUtils<T>, props: P) => R),
) => (propsOrGetter?: P | (() => P)) => ComputedRef<StyleResult<R>>

function createInstanceRuntime(emotion: EmotionInstance, options?: CreateInstanceOptions<object>) {
  const { cssVarPrefix } = options ?? {}
  const effectiveCssVarPrefix = cssVarPrefix ?? options?.prefixCls ?? DEFAULT_CSS_VAR_PREFIX

  const keys = createContextKeys()
  const cssVar = createCSSVarProxy({ prefix: effectiveCssVarPrefix })

  const ThemeProvider = createThemeProvider(emotion, keys, {
    prefixCls: options?.prefixCls,
    iconPrefixCls: options?.iconPrefixCls,
    cssVarPrefix,
    customToken: options?.customToken as Record<string, unknown> | undefined,
  })
  const createStyles = makeCreateStyles(emotion, {
    hashPriority: options?.hashPriority,
    cssVar,
  }, keys)
  const createGlobalStyle = makeCreateGlobalStyle(emotion, keys, { cssVar })
  const createStylish = makeCreateStylish(emotion, keys, {
    cssVar,
    hashPriority: options?.hashPriority,
  })
  const staticStyles = makeCreateStaticStylesFactory(emotion, {
    cssVarPrefix: effectiveCssVarPrefix,
    prefix: effectiveCssVarPrefix,
    hashPriority: options?.hashPriority,
    cache: emotion.cache,
  })
  const StyleProvider = makeStyleProvider(keys, emotion)

  // Create per-instance composables
  const useTheme = makeUseTheme(keys)
  const useThemeMode = makeUseThemeMode(keys)
  const useAntdToken = makeUseAntdToken(keys)
  const useAntdStylish = makeUseAntdStylish(keys)
  const useAntdTheme = makeUseAntdTheme(keys)

  const { css, cx } = createCSS(emotion.cache, { hashPriority: options?.hashPriority })
  let disposed = false

  const dispose = () => {
    if (disposed) return
    disposed = true
    unregisterEmotionInstance(emotion)
    emotion.flush()
  }

  return {
    createStyles,
    createGlobalStyle,
    createStylish,
    createStaticStyles: staticStyles.createStaticStyles,
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
    keyframes: emotion.keyframes,
    injectGlobal: emotion.injectGlobal,
    cssVar,
    responsive: responsiveHelpers,
    tokenToCSSVar,
    styleManager: emotion,
    staticStylesCache: staticStyles.cache,
    dispose,
  }
}

type RuntimeInstance = ReturnType<typeof createInstanceRuntime>

export type CreateInstanceResult<T extends object = CustomToken> = Omit<
  RuntimeInstance,
  'createStyles' | 'createGlobalStyle' | 'createStylish' | 'useTheme'
> & {
  createStyles: InstanceCreateStyles<T>
  createGlobalStyle: InstanceCreateGlobalStyle<T>
  createStylish: InstanceCreateStylish<T>
  useTheme: () => ComputedRef<Theme<T>>
}

export function createInstance<T extends object = CustomToken>(
  options?: CreateInstanceOptions<T>,
): CreateInstanceResult<T> {
  const emotion = registerEmotionInstance(createEmotion({
    key: options?.key ?? 'zcss',
    container: options?.container,
    speedy: options?.speedy ?? false,
    nonce: options?.nonce,
    insertionPoint: options?.insertionPoint,
    stylisPlugins: options?.stylisPlugins,
  }))
  return createInstanceWithEmotion(emotion, options)
}

// Internal entry for the public helpers that share the default static style engine.
export function createInstanceWithEmotion<T extends object = CustomToken>(
  emotion: EmotionInstance,
  options?: CreateInstanceOptions<T>,
): CreateInstanceResult<T> {
  return createInstanceRuntime(emotion, options as CreateInstanceOptions<object>) as CreateInstanceResult<T>
}
