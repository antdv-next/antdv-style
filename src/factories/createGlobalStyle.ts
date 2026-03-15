import { inject, watchEffect, onUnmounted } from 'vue'
import type { CSSInterpolation } from '@emotion/css/create-instance'
import type { EmotionInstance } from '../core'
import type { CreateStylesUtils } from '../types'
import { ThemeContextKey, ThemeModeKey, StyleEngineKey } from '../context'
import type { ContextKeys } from '../context'
import { createResponsiveUtil } from '../utils'
import { isBrowser } from '../utils/env'

type GlobalStyleFactory = (utils: CreateStylesUtils) => Record<string, unknown> | string | void

export interface MakeCreateGlobalStyleOptions {
  cssVar?: Record<string, string>
}

export function makeCreateGlobalStyle(defaultEmotion: EmotionInstance, keys?: ContextKeys, options?: MakeCreateGlobalStyleOptions) {
  const cssVar = options?.cssVar ?? {}
  const themeKey = keys?.themeContextKey ?? ThemeContextKey
  const modeKey = keys?.themeModeKey ?? ThemeModeKey
  const engineKey = keys?.styleEngineKey ?? StyleEngineKey

  return function createGlobalStyle(factory: GlobalStyleFactory) {
    return function useGlobalStyle(): void {
      const themeCtx = inject(themeKey)
      const modeCtx = inject(modeKey)
      const engine = inject(engineKey) ?? defaultEmotion

      if (!themeCtx || !modeCtx) {
        throw new Error('createGlobalStyle: must be used within a <ThemeProvider>')
      }

      let styleEl: HTMLStyleElement | null = null

      watchEffect(() => {
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

        const rawStyles = factory(utils)

        // Serialize: delegate leaf-level CSS object serialization to Emotion's css(),
        // only handle selector wrapping ourselves.
        const cssText = rawStyles
          ? (typeof rawStyles === 'string' ? rawStyles : serializeGlobalStyles(rawStyles, engine))
          : ''

        if (!cssText) {
          // Factory returned nothing — clear any previously injected styles
          if (styleEl) styleEl.textContent = ''
          return
        }

        if (isBrowser) {
          // Browser: managed <style> tag — replaces content on each update (no accumulation)
          if (!styleEl) {
            styleEl = document.createElement('style')
            styleEl.setAttribute('data-antdv-global', '')
            document.head.appendChild(styleEl)
          }
          styleEl.textContent = cssText
        } else {
          // SSR: inject through emotion for extraction via CacheManager (one-shot, no accumulation concern)
          engine.injectGlobal(cssText)
        }
      })

      onUnmounted(() => {
        if (styleEl) {
          styleEl.remove()
          styleEl = null
        }
      })
    }
  }
}

/**
 * Serialize a selector-to-styles mapping into a CSS string.
 * Uses Emotion's css() for leaf-level style objects, so vendor prefixes,
 * numeric px units, and camelCase conversion are handled by Emotion.
 * We only handle selector wrapping and nesting.
 *
 * Trade-off: css() generates class names as a side-effect in Emotion's cache.
 * These are unused but deduplicated by content, so the overhead is bounded
 * by the number of distinct style objects (not the number of re-renders).
 */
function serializeGlobalStyles(
  styles: Record<string, unknown>,
  engine: EmotionInstance,
): string {
  const parts: string[] = []

  for (const [selector, value] of Object.entries(styles)) {
    if (value == null) continue

    if (typeof value === 'string') {
      // Pre-serialized CSS string for this selector
      parts.push(`${selector} { ${value} }`)
    } else if (typeof value === 'object') {
      // Use Emotion to serialize the style object — this handles camelCase,
      // numeric px units, vendor prefixes, and all CSS edge cases.
      const className = engine.css(value as CSSInterpolation)
      // Extract the generated CSS from Emotion's cache
      const cachedCSS = engine.cache.inserted[className.replace(engine.cache.key + '-', '')]
      if (typeof cachedCSS === 'string') {
        parts.push(`${selector}{${cachedCSS}}`)
      } else {
        // Fallback: look up from registered styles
        const registered = engine.cache.registered[className]
        if (registered) {
          parts.push(`${selector}{${registered}}`)
        }
      }
    }
  }

  return parts.join('\n')
}
