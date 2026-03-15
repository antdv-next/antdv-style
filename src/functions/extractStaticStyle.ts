import type { EmotionInstance } from '../core'
import { createCacheManager, type CacheManagerInstance } from '../core'

export interface ExtractStyleResult {
  /** CSS content as a string */
  css: string
  /** Complete <style> tag(s) ready to insert in HTML */
  tags: string
}

export function extractStaticStyle(emotionOrManager: EmotionInstance | CacheManagerInstance): ExtractStyleResult {
  const manager = 'getStyles' in emotionOrManager
    ? emotionOrManager
    : createCacheManager(emotionOrManager)

  return {
    css: manager.getStyles(),
    tags: manager.getStyleTags(),
  }
}
