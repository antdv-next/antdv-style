export interface StyleCache {
  getOrCompute<T>(key: string | undefined, factory: () => T): T
  clear(): void
}

export function createStyleCacheKeyFactory() {
  const identityIds = new WeakMap<object, number>()
  const symbolIds = new Map<symbol, number>()
  let nextIdentityId = 1
  let nextSymbolId = 1

  const identity = (value: object) => {
    let id = identityIds.get(value)
    if (id === undefined) {
      id = nextIdentityId++
      identityIds.set(value, id)
    }
    return id
  }

  const symbolIdentity = (value: symbol) => {
    let id = symbolIds.get(value)
    if (id === undefined) {
      id = nextSymbolId++
      symbolIds.set(value, id)
    }
    return id
  }

  return (...values: unknown[]): string | undefined => {
    const seen = new WeakMap<object, number>()
    let nextReferenceId = 1
    let cacheable = true

    const serialize = (value: unknown): string => {
      if (value === null) return 'null'
      switch (typeof value) {
        case 'undefined':
          return 'undefined'
        case 'boolean':
          return value ? 'boolean:1' : 'boolean:0'
        case 'string':
          return `string:${JSON.stringify(value)}`
        case 'number':
          if (Number.isNaN(value)) return 'number:NaN'
          if (Object.is(value, -0)) return 'number:-0'
          return `number:${value}`
        case 'bigint':
          return `bigint:${value.toString()}`
        case 'symbol':
          return `symbol:${symbolIdentity(value)}`
        case 'function':
          return `function:${identity(value)}`
        case 'object':
          break
      }

      const object = value as object
      const reference = seen.get(object)
      if (reference !== undefined) return `reference:${reference}`
      seen.set(object, nextReferenceId++)

      if (Array.isArray(object)) {
        // Indexed serialization cannot represent additional own properties.
        const hasNamedProperties = Object.getOwnPropertyNames(object).some(key =>
          key !== 'length' && (!/^(0|[1-9]\d*)$/.test(key) || Number(key) >= object.length),
        )
        if (hasNamedProperties || Object.getOwnPropertySymbols(object).length > 0) cacheable = false
        const items: string[] = []
        for (let index = 0; index < object.length; index++) {
          items.push(index in object ? serialize(object[index]) : 'hole')
        }
        return `array:${object.length}:[${items.join(',')}]`
      }
      if (object instanceof Date) {
        const timestamp = object.getTime()
        return Number.isNaN(timestamp) ? 'date:Invalid' : `date:${object.toISOString()}`
      }

      const prototype = Object.getPrototypeOf(object)
      if (prototype !== Object.prototype && prototype !== null) {
        // Identity alone cannot represent mutable class/host state.
        cacheable = false
        return ''
      }

      try {
        const strings = Object.keys(object)
          .sort()
          .map(
            key => `${JSON.stringify(key)}:${serialize((object as Record<string, unknown>)[key])}`,
          )
        const symbols = Object.getOwnPropertySymbols(object)
          .map(key => ({ key, id: symbolIdentity(key) }))
          .sort((a, b) => a.id - b.id)
          .map(({ key, id }) => `symbol:${id}:${serialize((object as Record<symbol, unknown>)[key])}`)
        return `object:{${[...strings, ...symbols].join(',')}}`
      } catch {
        cacheable = false
        return ''
      }
    }

    const key = values.map(serialize).join('|')
    return cacheable ? key : undefined
  }
}

export function createStyleCache(maxSize = 500): StyleCache {
  const cache = new Map<string, unknown>()

  return {
    getOrCompute<T>(key: string | undefined, factory: () => T): T {
      if (key === undefined) return factory()

      const cached = cache.get(key)
      if (cached !== undefined) {
        // Move to end for true LRU eviction
        cache.delete(key)
        cache.set(key, cached)
        return cached as T
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
