import type { EmotionInstance } from './createEmotion'

export interface CacheManagerInstance {
  /** Get all collected CSS as a single string */
  getStyles(): string
  /** Get all collected CSS as individual style tag strings */
  getStyleTags(): string
  /** Reset the collected styles */
  reset(): void
  /** Get the emotion instance this manager wraps */
  emotion: EmotionInstance
}

export function createCacheManager(emotion: EmotionInstance): CacheManagerInstance {
  const insertedKeys = new Set<string>()

  // Hook into the emotion cache to track inserted styles
  const cache = emotion.cache
  const originalInsert = cache.insert.bind(cache)

  cache.insert = (...args: Parameters<typeof originalInsert>) => {
    const result = originalInsert(...args)
    // Track the serialized style's name
    if (args[1] && args[1].name) {
      insertedKeys.add(args[1].name)
    }
    return result
  }

  return {
    getStyles(): string {
      const { sheet } = cache
      if (sheet.tags && sheet.tags.length > 0) {
        return sheet.tags
          .map((tag: HTMLStyleElement) => tag.textContent || '')
          .join('')
      }
      // Fallback: collect from cache registered styles
      return Array.from(insertedKeys)
        .map(key => cache.registered[`${cache.key}-${key}`] || '')
        .filter(Boolean)
        .join('\n')
    },

    getStyleTags(): string {
      const css = this.getStyles()
      if (!css) return ''
      return `<style data-emotion="${cache.key}">${css}</style>`
    },

    reset(): void {
      insertedKeys.clear()
    },

    emotion,
  }
}
