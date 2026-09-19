import { inject, watchEffect, onUnmounted, useId } from 'vue'
import type { CSSInterpolation } from '@emotion/css/create-instance'
import { serializeStyles, type SerializedStyles } from '@emotion/serialize'
import { StyleSheet } from '@emotion/sheet'
import type { EmotionInstance } from '../core'
import { getGlobalStyleElements, prepareGlobalStyleOrder, registerManagedSheet, setServerGlobalStyle } from '../core/CacheManager'
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

      prepareGlobalStyleOrder(engine.cache)
      const owner = useId()
      let globalSheet: StyleSheet | undefined
      let anchor: HTMLMetaElement | undefined
      let unregisterSheet: (() => void) | undefined

      const getGlobalSheet = () => {
        if (globalSheet) return globalSheet

        const { container, insertionPoint, prepend, before } = engine.sheet
        const sheetKey = `${engine.cache.key}-global`
        const globalElements = getGlobalStyleElements(engine.cache)
        const serverTag = globalElements
          .filter((node): node is HTMLStyleElement => node.nodeName === 'STYLE')
          .find(tag => tag.hasAttribute('data-antdv-global-ssr')
            && tag.getAttribute('data-emotion') === sheetKey
            && tag.getAttribute('data-antdv-global') === owner)
        // Keep a permanent position even when a reactive factory temporarily returns no styles.
        anchor = (container.ownerDocument ?? document).createElement('meta')
        anchor.setAttribute('data-antdv-global-anchor', engine.cache.key)
        const previous = globalElements[globalElements.length - 1]
          ?? engine.sheet.tags[engine.sheet.tags.length - 1]
        container.insertBefore(anchor, serverTag ? serverTag.nextSibling : previous
          ? previous.nextSibling : insertionPoint
          ? insertionPoint.nextSibling
          : prepend ? container.firstChild : before)
        globalSheet = new StyleSheet({
          key: sheetKey,
          container,
          nonce: engine.sheet.nonce,
          speedy: engine.sheet.isSpeedy,
        })
        globalSheet.before = anchor
        if (serverTag) globalSheet.hydrate([serverTag])
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
        const sheet = isBrowser ? getGlobalSheet() : engine.sheet
        if (isBrowser) sheet.flush()
        let css = ''
        let serialized: SerializedStyles | undefined = rawStyles
          ? serializeStyles([rawStyles], engine.cache.registered)
          : undefined

        while (serialized) {
          // Distinguish unscoped CSS from the same serialization used by css().
          const rules = engine.cache.insert('', { ...serialized, name: `${serialized.name}-global` }, sheet, false)
          if (typeof rules === 'string') css += rules
          serialized = serialized.next
        }
        if (isBrowser) sheet.tags.forEach(tag => tag.setAttribute('data-antdv-global', owner))
        else setServerGlobalStyle(engine.cache, owner, css)
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
