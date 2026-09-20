import { createCache, extractStyle, type StyleProviderProps } from '@antdv-next/cssinjs'
import type { EmotionInstance } from '../core'
import {
  createCacheManager,
  getRegisteredEmotionInstances,
  type CacheManagerInstance,
} from '../core'

type AntdvStyleCache = StyleProviderProps['cache']

export interface ExtractStyleOptions {
  includeAntdv?: boolean
  antdCache?: AntdvStyleCache
  /** Rendered HTML used to keep only critical Emotion styles. */
  html?: string
}

export interface ExtractStyleResult {
  /** CSS content as a string */
  css: string
  /** Complete <style> tag(s) ready to insert in HTML */
  tags: string
}

export interface ExtractStaticStyle {
  (
    htmlOrEmotion?: string | EmotionInstance | CacheManagerInstance,
    options?: ExtractStyleOptions,
  ): ExtractStyleResult
  cache: AntdvStyleCache
}

const defaultAntdvCache = createCache()

export const extractStaticStyle: ExtractStaticStyle = Object.assign(
  (
    htmlOrEmotion?: string | EmotionInstance | CacheManagerInstance,
    options?: ExtractStyleOptions,
  ): ExtractStyleResult => {
    const html = typeof htmlOrEmotion === 'string' ? htmlOrEmotion : options?.html
    const emotionOrManager = typeof htmlOrEmotion === 'string' ? undefined : htmlOrEmotion
    const managers = emotionOrManager
      ? ['getStyles' in emotionOrManager
          ? emotionOrManager
          : createCacheManager(emotionOrManager)]
      : getRegisteredEmotionInstances().map((emotion) => createCacheManager(emotion))

    const emotionCss = managers.map((manager) => manager.getStyles(html)).filter(Boolean).join('\n')
    const emotionTags = managers.map((manager) => manager.getStyleTags(html)).filter(Boolean).join('')

    if (options?.includeAntdv === false) {
      return { css: emotionCss, tags: emotionTags }
    }

    const antdCache = options?.antdCache ?? defaultAntdvCache
    const antdCss = extractStyle(antdCache, { plain: true })
    const antdTags = extractStyle(antdCache)

    return {
      css: [antdCss, emotionCss].filter(Boolean).join('\n'),
      tags: `${antdTags}${emotionTags}`,
    }
  },
  { cache: defaultAntdvCache },
)
