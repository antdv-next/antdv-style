export interface StyleCache {
  getOrCompute(key: string, factory: () => Record<string, string>): Record<string, string>
  clear(): void
}

export function createStyleCache(maxSize = 500): StyleCache {
  const cache = new Map<string, Record<string, string>>()

  return {
    getOrCompute(key: string, factory: () => Record<string, string>): Record<string, string> {
      const cached = cache.get(key)
      if (cached) {
        // Move to end for true LRU eviction
        cache.delete(key)
        cache.set(key, cached)
        return cached
      }

      const result = factory()

      if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value!
        cache.delete(firstKey)
      }

      cache.set(key, result)
      return result
    },

    clear() {
      cache.clear()
    },
  }
}
