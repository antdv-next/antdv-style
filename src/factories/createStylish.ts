import { inject, computed, type ComputedRef } from 'vue'
import type { EmotionInstance } from '../core'
import type { CreateStylesUtils } from '../types'
import { ThemeContextKey, ThemeModeKey, StyleEngineKey } from '../context'
import type { ContextKeys } from '../context'
import { createResponsiveUtil } from '../utils'

type StylishFactory<T extends Record<string, string>> = (utils: CreateStylesUtils) => T

export interface MakeCreateStylishOptions {
  cssVar?: Record<string, string>
}

export function makeCreateStylish(defaultEmotion: EmotionInstance, keys?: ContextKeys, options?: MakeCreateStylishOptions) {
  const cssVar = options?.cssVar ?? {}
  const themeKey = keys?.themeContextKey ?? ThemeContextKey
  const modeKey = keys?.themeModeKey ?? ThemeModeKey
  const engineKey = keys?.styleEngineKey ?? StyleEngineKey

  return function createStylish<T extends Record<string, string>>(factory: StylishFactory<T>) {
    return function useStylish(): ComputedRef<T> {
      const themeCtx = inject(themeKey)
      const modeCtx = inject(modeKey)
      const engine = inject(engineKey) ?? defaultEmotion

      if (!themeCtx || !modeCtx) {
        throw new Error('createStylish: must be used within a <ThemeProvider>')
      }

      return computed(() => {
        const themeValue = themeCtx.theme.value
        const responsive = createResponsiveUtil(themeValue, engine)
        const effectiveCssVar = themeCtx.cssVar?.value ?? cssVar

        const utils: CreateStylesUtils = {
          token: themeValue,
          css: engine.css,
          cx: engine.cx,
          prefixCls: themeValue.prefixCls,
          iconPrefixCls: themeValue.iconPrefixCls,
          isDarkMode: themeValue.isDarkMode,
          appearance: themeValue.appearance,
          responsive,
          stylish: themeValue.stylish,
          cssVar: effectiveCssVar,
        }

        return factory(utils)
      })
    }
  }
}
