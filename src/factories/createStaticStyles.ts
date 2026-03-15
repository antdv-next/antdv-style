import type { EmotionInstance } from '../core'
import type { CSSInterpolation } from '@emotion/css/create-instance'
import type { ResponsiveHelpers } from '../types'
import { responsiveHelpers } from '../utils'
import { createCSSVarProxy } from '../utils/cssVar'

export interface StaticStyleUtils {
  css: EmotionInstance['css']
  cx: EmotionInstance['cx']
  cssVar: Record<string, string>
  responsive: ResponsiveHelpers
}

type StaticStyleFactory = (utils: StaticStyleUtils) => Record<string, CSSInterpolation | string>

export interface MakeCreateStaticStylesOptions {
  cssVarPrefix?: string
}

export function makeCreateStaticStyles(emotion: EmotionInstance, options?: MakeCreateStaticStylesOptions) {
  const cssVar = createCSSVarProxy({ prefix: options?.cssVarPrefix })

  return function createStaticStyles(factoryOrStyles: StaticStyleFactory | Record<string, CSSInterpolation | string>) {
    let cachedStyles: Record<string, string> | null = null

    function getStyles(): Record<string, string> {
      if (cachedStyles) return cachedStyles

      const rawStyles = typeof factoryOrStyles === 'function'
        ? factoryOrStyles({ css: emotion.css, cx: emotion.cx, cssVar, responsive: responsiveHelpers })
        : factoryOrStyles

      const processed: Record<string, string> = {}
      for (const [key, value] of Object.entries(rawStyles)) {
        if (typeof value === 'string') {
          processed[key] = value
        } else if (value != null) {
          processed[key] = emotion.css(value as CSSInterpolation)
        }
      }

      cachedStyles = processed
      return cachedStyles
    }

    return function useStaticStyles() {
      return {
        styles: getStyles(),
        cx: emotion.cx,
      }
    }
  }
}
