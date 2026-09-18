import { describe, it, expect } from 'vitest'

import { createStyleCache, createStyleCacheKeyFactory } from '../styleCache'

describe('styleCache', () => {
  it('bypasses arrays with non-index own properties', () => {
    const key = createStyleCacheKeyFactory()
    for (const property of ['tone', '01', '-1', '1.5', '4294967295']) {
      expect(key(Object.assign([], { [property]: 'red' }))).toBeUndefined()
    }
    const hidden = Object.defineProperty([], 'tone', { value: 'red' })
    expect(key(hidden)).toBeUndefined()
    expect(key({ values: Object.assign([1], { tone: 'blue' }) })).toBeUndefined()
    expect(key([1, 2])).toBeDefined()
  })

  it('distinguishes array lengths, holes, undefined values and hole positions', () => {
    const key = createStyleCacheKeyFactory()
    const leadingHole = new Array(2)
    leadingHole[1] = 'value'
    const trailingHole = new Array(2)
    trailingHole[0] = 'value'
    const inputs = [[], new Array(1), new Array(2), [undefined], leadingHole, trailingHole]
    expect(new Set(inputs.map(value => key(value))).size).toBe(inputs.length)
    expect(key(new Array(2))).toBe(key(new Array(2)))
    expect(key({ values: [] })).not.toBe(key({ values: new Array(1) }))
    const circular: unknown[] = new Array(2)
    circular[1] = circular
    expect(key(circular)).toBe(key(circular))
  })

  it('includes symbol-keyed state and distinguishes symbols with the same description', () => {
    const key = createStyleCacheKeyFactory()
    const first = Symbol('tone')
    const second = Symbol('tone')
    expect(key({ [first]: 'red' })).not.toBe(key({ [first]: 'blue' }))
    expect(key({ [first]: 'red' })).not.toBe(key({ [second]: 'red' }))
    expect(key({ [first]: 'red', a: 1 })).toBe(key({ a: 1, [first]: 'red' }))
    const nested = { value: { [first]: 'red' } }
    const before = key(nested)
    nested.value[first] = 'green'
    expect(key(nested)).not.toBe(before)
    expect(key(Object.assign([], { [first]: 'red' }))).toBeUndefined()
  })

  it('bypasses shared results when no safe key can be produced', () => {
    const cache = createStyleCache(1)
    const first = {}
    const second = {}

    expect(cache.getOrCompute('retained', () => first)).toBe(first)
    expect(cache.getOrCompute(undefined, () => first)).toBe(first)
    expect(cache.getOrCompute(undefined, () => second)).toBe(second)
    expect(cache.getOrCompute('retained', () => second)).toBe(first)
  })

  it('does not memoize class inputs or traverse their accessors', () => {
    const createKey = createStyleCacheKeyFactory()
    let reads = 0
    class Palette {
      color = 'red'
      constructor() {
        Object.defineProperty(this, 'secret', {
          enumerable: true,
          get() {
            reads++
            throw new Error('Must not inspect opaque inputs')
          },
        })
      }
    }
    const palette = new Palette()
    const circular: Record<string, unknown> = { palette }
    circular.self = circular

    expect(createKey(palette)).toBeUndefined()
    expect(createKey({ nested: [circular] })).toBeUndefined()
    expect(reads).toBe(0)
  })

  it('does not reuse a partial key when reading an input fails', () => {
    const createKey = createStyleCacheKeyFactory()
    const input = {
      get color() {
        throw new Error('Unavailable')
      },
    }
    expect(createKey(input)).toBeUndefined()
  })

  it('should return cached result for same inputs', () => {
    const cache = createStyleCache()
    let callCount = 0

    const factory = () => {
      callCount++
      return { container: 'css-abc123' }
    }

    const key1 = JSON.stringify({ colorPrimary: '#1890ff' })
    const result1 = cache.getOrCompute(key1, factory)
    const result2 = cache.getOrCompute(key1, factory)

    expect(result1).toBe(result2)
    expect(callCount).toBe(1)
  })

  it('should recompute for different inputs', () => {
    const cache = createStyleCache()
    let callCount = 0

    const factory = () => {
      callCount++
      return { container: `css-${callCount}` }
    }

    cache.getOrCompute('a', factory)
    cache.getOrCompute('b', factory)

    expect(callCount).toBe(2)
  })

  it('should respect max size', () => {
    const cache = createStyleCache(2)

    cache.getOrCompute('a', () => ({ a: '1' }))
    cache.getOrCompute('b', () => ({ b: '2' }))
    cache.getOrCompute('c', () => ({ c: '3' }))

    let recomputed = false
    cache.getOrCompute('a', () => {
      recomputed = true
      return { a: 'new' }
    })

    expect(recomputed).toBe(true)
  })

  it('should create stable keys for circular objects and BigInt values', () => {
    const createKey = createStyleCacheKeyFactory()
    const first: Record<string, unknown> = { count: 1n }
    const second: Record<string, unknown> = { count: 1n }
    first.self = first
    second.self = second

    expect(createKey(first)).toBe(createKey(second))
  })

  it('should distinguish function identities', () => {
    const createKey = createStyleCacheKeyFactory()
    const first = () => 'red'
    const second = () => 'red'

    expect(createKey(first)).toBe(createKey(first))
    expect(createKey(first)).not.toBe(createKey(second))
  })

  it('should create a stable key for invalid dates', () => {
    const createKey = createStyleCacheKeyFactory()

    expect(createKey(new Date(Number.NaN))).toBe('date:Invalid')
  })
})
