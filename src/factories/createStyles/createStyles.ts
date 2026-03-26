import { inject, computed, reactive } from 'vue'
import type { EmotionInstance } from '../../core'
import type { CSSInterpolation } from '@emotion/css/create-instance'
import type { CreateStylesUtils, CreateStylesReturn, CreateStylesOptions } from '../../types'
import { ThemeContextKey, ThemeModeKey, StyleEngineKey } from '../../context'
import type { ContextKeys } from '../../context'
import { createResponsiveUtil } from '../../utils'
import { createStyleCache } from './styleCache'

type StyleValue = CSSInterpolation | string
type StyleFactory<P> = (utils: CreateStylesUtils, props: P) => Record<string, StyleValue>
type StyleOrFactory<P> = StyleFactory<P> | Record<string, StyleValue>

export interface MakeCreateStylesOptions {
  hashPriority?: 'high' | 'low'
  cssVar?: Record<string, string>
}

export function makeCreateStyles(defaultEmotion: EmotionInstance, options?: MakeCreateStylesOptions, keys?: ContextKeys) {
  const globalHashPriority = options?.hashPriority ?? 'high'
  const cssVar = options?.cssVar ?? {}
  const themeKey = keys?.themeContextKey ?? ThemeContextKey
  const modeKey = keys?.themeModeKey ?? ThemeModeKey
  const engineKey = keys?.styleEngineKey ?? StyleEngineKey

  return function createStyles<P = void>(factory: StyleOrFactory<P>, styleOptions?: CreateStylesOptions) {
    const effectiveLabel = styleOptions?.label
    const effectiveHashPriority = styleOptions?.hashPriority ?? globalHashPriority
    const cache = createStyleCache()

    return function useStyles(propsOrGetter?: P | (() => P)): CreateStylesReturn {
      const themeCtx = inject(themeKey)
      const modeCtx = inject(modeKey)
      const engine = inject(engineKey) ?? defaultEmotion

      if (!themeCtx || !modeCtx) {
        throw new Error('createStyles: useStyles() must be used within a <ThemeProvider>')
      }

      const resolvedProps = computed(() =>
        typeof propsOrGetter === 'function'
          ? (propsOrGetter as () => P)()
          : propsOrGetter
      )

      const styles = computed(() => {
        const themeValue = themeCtx.theme.value
        const props = resolvedProps.value as P
        const { isDarkMode, appearance, prefixCls, iconPrefixCls, stylish } = themeValue

        // Build cache key from all reactive dependencies (assumes JSON-serializable values)
        const cacheKey = JSON.stringify({ token: themeValue, props, isDarkMode, appearance, prefixCls, stylish })

        return cache.getOrCompute(cacheKey, () => {
          const responsive = createResponsiveUtil(themeValue, engine)

          // Prefer cssVar from ThemeContext (dynamic, from antdv-next ConfigProvider),
          // fall back to the instance-level static cssVar proxy
          const effectiveCssVar = themeCtx.cssVar?.value ?? cssVar

          const utils: CreateStylesUtils = {
            token: themeValue,
            css: engine.css,
            cx: engine.cx,
            prefixCls,
            iconPrefixCls,
            isDarkMode,
            appearance,
            responsive,
            stylish,
            cssVar: effectiveCssVar,
          }

          // Support both function factories and plain style objects
          const rawStyles = typeof factory === 'function'
            ? factory(utils, props)
            : factory

          const processed: Record<string, string> = {}
          for (const [key, value] of Object.entries(rawStyles)) {
            if (typeof value === 'string') {
              processed[key] = value
            } else if (value != null) {
              if (effectiveLabel && typeof value === 'object') {
                const labelled = { ...(value as Record<string, unknown>), label: `${effectiveLabel}-${key}` }
                processed[key] = effectiveHashPriority === 'low'
                  ? engine.css({ ':where(&)': labelled } as CSSInterpolation)
                  : engine.css(labelled as CSSInterpolation)
              } else {
                processed[key] = effectiveHashPriority === 'low'
                  ? engine.css({ ':where(&)': value } as CSSInterpolation)
                  : engine.css(value as CSSInterpolation)
              }
            }
          }

          return processed
        })
      })

      // Force eager evaluation so the factory runs immediately
      void styles.value

      // Use reactive() to auto-unwrap computed refs for convenient direct access:
      //   const s = useStyles() → s.styles.container (no .value needed)
      //
      // For destructuring with reactivity, use toRefs:
      //   const { styles } = toRefs(useStyles()) → styles.value.container
      //   or in template: styles.container (auto-unwrapped)
      return reactive({
        styles,
        cx: engine.cx,
        theme: themeCtx.theme,
        prefixCls: themeCtx.prefixCls,
        iconPrefixCls: themeCtx.iconPrefixCls,
      }) as CreateStylesReturn
    }
  }
}
