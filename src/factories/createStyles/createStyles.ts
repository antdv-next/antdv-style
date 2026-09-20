import { inject, computed, reactive } from 'vue'
import { createCSS, type EmotionInstance } from '../../core'
import type { CSSInterpolation } from '@emotion/css/create-instance'
import type {
  CreateStylesUtils,
  CreateStylesReturn,
  CreateStylesOptions,
  StyleInput,
  StyleFactoryInput,
  StyleResult,
} from '../../types'
import { ThemeContextKey, ThemeModeKey, StyleEngineKey } from '../../context'
import type { ContextKeys } from '../../context'
import { createResponsiveUtil } from '../../utils'
import { createStyleCache, createStyleCacheKeyFactory } from './styleCache'

type StyleFactory<P, T extends StyleFactoryInput = StyleInput> = (utils: CreateStylesUtils, props: P) => T
type StyleOrFactory<P, T extends StyleFactoryInput = StyleInput> = StyleFactory<P, T> | T

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

  return function createStyles<P = void, T extends StyleFactoryInput = StyleInput>(
    factory: StyleOrFactory<P, T>,
    styleOptions?: CreateStylesOptions,
  ) {
    const effectiveLabel = styleOptions?.label
    const effectiveHashPriority = styleOptions?.hashPriority ?? globalHashPriority
    const cache = createStyleCache()
    const createCacheKey = createStyleCacheKeyFactory()
    const engineIds = new WeakMap<EmotionInstance['cache']['inserted'], number>()
    let nextEngineId = 1

    const getEngineId = (engine: EmotionInstance) => {
      // Emotion replaces inserted on flush; a new generation must regenerate cached rules.
      const generation = engine.cache.inserted
      let id = engineIds.get(generation)
      if (id === undefined) {
        id = nextEngineId++
        engineIds.set(generation, id)
      }
      return id
    }

    return function useStyles(propsOrGetter?: P | (() => P)): CreateStylesReturn<StyleResult<T>> {
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
        const effectiveCssVar = themeCtx.cssVar?.value ?? cssVar
        // One token reference identifies the proxy's prefix without tying reuse to object identity.
        const inputsKey = createCacheKey(themeValue, props, effectiveCssVar.colorPrimary)
        const cacheKey = inputsKey === undefined ? undefined : `${getEngineId(engine)}|${inputsKey}`

        return cache.getOrCompute(cacheKey, () => {
          const responsive = createResponsiveUtil(themeValue, engine)
          const { css, cx } = createCSS(engine.cache, {
            hashPriority: effectiveHashPriority,
            label: effectiveLabel,
          })

          const utils: CreateStylesUtils = {
            token: themeValue,
            css,
            cx,
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
            ? (factory as StyleFactory<P, T>)(utils, props)
            : factory

          if (typeof rawStyles === 'string') return rawStyles

          const processed: Record<string, string> = {}
          for (const [key, value] of Object.entries(rawStyles)) {
            if (typeof value === 'string') {
              processed[key] = value
            } else if (value != null) {
              if (effectiveLabel && typeof value === 'object') {
                const keyCss = createCSS(engine.cache, {
                  hashPriority: effectiveHashPriority,
                  label: `${effectiveLabel}-${key}`,
                }).css
                processed[key] = keyCss(value as CSSInterpolation)
              } else {
                processed[key] = css(value as CSSInterpolation)
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
        cx: createCSS(engine.cache, { hashPriority: effectiveHashPriority }).cx,
        theme: themeCtx.theme,
        prefixCls: themeCtx.prefixCls,
        iconPrefixCls: themeCtx.iconPrefixCls,
      }) as CreateStylesReturn<StyleResult<T>>
    }
  }
}
