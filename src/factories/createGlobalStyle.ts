import { inject, watchEffect, onUnmounted } from 'vue'
import type { CSSInterpolation } from '@emotion/css/create-instance'
import { serializeStyles } from '@emotion/serialize'
import { StyleSheet } from '@emotion/sheet'
import type { EmotionInstance } from '../core'
import { registerManagedSheet } from '../core/CacheManager'
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

      let globalSheet: StyleSheet | undefined
      let anchor: HTMLMetaElement | undefined
      let unregisterSheet: (() => void) | undefined

      const getGlobalSheet = () => {
        if (globalSheet) return globalSheet

        const { container, insertionPoint, prepend, before } = engine.sheet
        // Keep a permanent position even when a reactive factory temporarily returns no styles.
        anchor = (container.ownerDocument ?? document).createElement('meta')
        anchor.setAttribute('data-antdv-global-anchor', '')
        container.insertBefore(anchor, insertionPoint
          ? insertionPoint.nextSibling
          : prepend ? container.firstChild : before)
        globalSheet = new StyleSheet({
          key: `${engine.cache.key}-global`,
          container,
          nonce: engine.sheet.nonce,
          speedy: engine.sheet.isSpeedy,
        })
        globalSheet.before = anchor
        unregisterSheet = registerManagedSheet(engine.cache, globalSheet)
        return globalSheet
      }

      watchEffect(() => {
        const themeValue = themeCtx.theme.value
        const responsive = createResponsiveUtil(themeValue, engine)

        const effectiveCssVar = themeCtx.cssVar?.value ?? cssVar

        const utils: CreateStylesUtils = {
          token: themeValue,
          css: engine.css.bind(engine),
          cx: engine.cx.bind(engine),
          prefixCls: themeValue.prefixCls,
          iconPrefixCls: themeValue.iconPrefixCls,
          isDarkMode: themeValue.isDarkMode,
          appearance: themeValue.appearance,
          responsive,
          stylish: themeValue.stylish,
          cssVar: effectiveCssVar,
        }

        const rawStyles = factory(utils) as CSSInterpolation | void

        if (isBrowser) {
          const sheet = getGlobalSheet()
          sheet.flush()
          if (!rawStyles) return

          const serialized = serializeStyles([rawStyles], engine.cache.registered)
          engine.cache.insert('', serialized, sheet, false)
          sheet.tags.forEach(tag => tag.setAttribute('data-antdv-global', ''))
        } else {
          if (rawStyles) engine.injectGlobal(rawStyles)
        }
      })

      onUnmounted(() => {
        globalSheet?.flush()
        unregisterSheet?.()
        globalSheet = undefined
        anchor?.remove()
        anchor = undefined
      })
    }
  }
}
