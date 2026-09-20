import type { EmotionInstance } from '../core'
import type { CSSInterpolation } from '@emotion/css/create-instance'
import type { ResponsiveHelpers } from '../types'
import { responsiveHelpers } from '../utils'
import { createCSSVarProxy } from '../utils/cssVar'
import type { EmotionCache } from '@emotion/css/create-instance'
import { createCSS, createEmotion, registerEmotionInstance } from '../core'

export interface StaticStyleUtils {
  css: EmotionInstance['css']
  cx: EmotionInstance['cx']
  cssVar: Record<string, string>
  responsive: ResponsiveHelpers
}

export type StaticStylesInput = string | Record<string, CSSInterpolation | string>
export type StaticStyleFactory<T extends StaticStylesInput = Record<string, CSSInterpolation | string>> = (utils: StaticStyleUtils) => T

export interface MakeCreateStaticStylesOptions {
  cssVarPrefix?: string
  prefix?: string
  hashPriority?: 'high' | 'low'
  cache?: EmotionCache
}

export interface StaticStylesInstance {
  createStaticStyles: <T extends StaticStylesInput>(factoryOrStyles: StaticStyleFactory<T> | T) => StaticStylesResult<T>
  cssVar: Record<string, string>
  responsive: ResponsiveHelpers
  cache: EmotionCache
}

export type StaticStylesResult<T extends StaticStylesInput = Record<string, CSSInterpolation | string>> = T extends string
  ? string
  : Record<string, string> & (() => {
  styles: Record<string, string>
  cx: EmotionInstance['cx']
})

export function makeCreateStaticStylesFactory(emotion: EmotionInstance, options?: MakeCreateStaticStylesOptions): StaticStylesInstance {
  const cssVar = createCSSVarProxy({ prefix: options?.cssVarPrefix })
  const cache = options?.cache ?? emotion.cache
  const { css, cx } = createCSS(cache, { hashPriority: options?.hashPriority ?? 'high' })

  const createStaticStyles = <T extends StaticStylesInput>(factoryOrStyles: StaticStyleFactory<T> | T): StaticStylesResult<T> => {
      const rawStyles = typeof factoryOrStyles === 'function'
        ? (factoryOrStyles as StaticStyleFactory<T>)({ css, cx, cssVar, responsive: responsiveHelpers })
        : factoryOrStyles

      if (typeof rawStyles === 'string') return rawStyles as unknown as StaticStylesResult<T>

      const processed: Record<string, string> = {}
      for (const [key, value] of Object.entries(rawStyles)) {
        if (typeof value === 'string') {
          processed[key] = value
        } else if (value != null) {
          processed[key] = css(value as CSSInterpolation)
        }
      }

      const callable = (() => ({ styles: processed, cx })) as StaticStylesResult<T>
      for (const [key, value] of Object.entries(processed)) {
        Object.defineProperty(callable, key, {
          value,
          configurable: true,
          enumerable: true,
          writable: true,
        })
      }
      return callable
  }

  return { createStaticStyles, cssVar, responsive: responsiveHelpers, cache }
}

export function makeCreateStaticStyles(emotion: EmotionInstance, options?: MakeCreateStaticStylesOptions) {
  return makeCreateStaticStylesFactory(emotion, options).createStaticStyles
}

export const defaultEmotion = registerEmotionInstance(createEmotion({ speedy: false }))
export const staticStylesCache = defaultEmotion.cache

export function createStaticStylesFactory(options: MakeCreateStaticStylesOptions = {}): StaticStylesInstance {
  return makeCreateStaticStylesFactory(defaultEmotion, {
    ...options,
    cssVarPrefix: options.cssVarPrefix ?? options.prefix,
  })
}

const defaultStaticStylesInstance = createStaticStylesFactory()
export const createStaticStyles = defaultStaticStylesInstance.createStaticStyles
