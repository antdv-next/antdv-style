import { describe, it, expect } from 'vitest'

import { createStyleCache, createStyleCacheKeyFactory } from '../styleCache'
import { computed, reactive } from 'vue'

describe('styleCache', () => {
  it('bypasses Date own state and subclasses before evaluating accessors', () => {
    const key = createStyleCacheKeyFactory()
    let reads = 0
    const color = Symbol('color')
    class ColoredDate extends Date {}
    for (const value of [
      Object.defineProperty(new Date(0), 'color', { value: 'red' }),
      Object.assign(new Date(0), { color: 'blue' }),
      Object.defineProperty(new Date(0), color, { value: 'blue' }),
      Object.defineProperty(new Date(0), 'getTime', { get() { reads++; throw Error('unused') } }),
      new ColoredDate(0),
    ]) {
      expect(key(value)).toBeUndefined()
      expect(key({ value })).toBeUndefined()
    }
    expect(reads).toBe(0)
    const cache = createStyleCache()
    let calls = 0
    for (const date of [new Date(0), new Date(0)]) cache.getOrCompute(key(date), () => ++calls)
    expect(calls).toBe(1)
  })

  it.each([false, true])('bypasses hidden/accessor array indices without reading them (nested=%s)', (nested) => {
    const key = createStyleCacheKeyFactory()
    let reads = 0
    for (const enumerable of [false, true]) {
      const values = Object.defineProperty([], '0', {
        enumerable,
        get() { reads++; throw Error('unused array getter') },
      })
      expect(key(nested ? { values } : values)).toBeUndefined()
    }
    expect(reads).toBe(0)
    expect(key(Object.defineProperty([], '0', { value: 'red' }))).toBeUndefined()
    class Colors extends Array {}
    const custom = new Colors()
    custom.push('red')
    expect(key(custom)).toBeUndefined()
  })

  it('does not inspect indices after detecting extra array state', () => {
    const key = createStyleCacheKeyFactory()
    let reads = 0
    const values = Object.defineProperty(['red'], '1', {
      enumerable: true,
      get() { reads++; throw Error('must bypass before indexing') },
    })
    Object.defineProperty(values, 'tone', { value: 'blue' })
    expect(key(values)).toBeUndefined()
    expect(reads).toBe(0)
  })

  it('keeps tracking normal reactive array indices and length', () => {
    const key = createStyleCacheKeyFactory()
    const values = reactive(['red'])
    const result = computed(() => key(values))
    const first = result.value
    expect(first).toBe(key(['red']))
    values[0] = 'blue'
    expect(result.value).toBe(key(['blue']))
    values.push('green')
    expect(result.value).toBe(key(['blue', 'green']))
    Reflect.deleteProperty(values, '0')
    const sparse = new Array<string>(2)
    sparse[1] = 'green'
    expect(result.value).toBe(key(sparse))
  })

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

  it('bypasses objects with hidden own fields without reading hidden getters', () => {
    const key = createStyleCacheKeyFactory()
    let stringReads = 0
    const hidden = Object.defineProperty({}, 'color', {
      enumerable: false,
      get() {
        stringReads++
        return 'red'
      },
    })
    const hiddenSymbol = Symbol('hidden')
    let symbolReads = 0
    const withHiddenSymbol = Object.defineProperty({}, hiddenSymbol, {
      enumerable: false,
      get() {
        symbolReads++
        return 'red'
      },
    })

    expect(key(hidden)).toBeUndefined()
    expect(key(withHiddenSymbol)).toBeUndefined()
    expect(stringReads).toBe(0)
    expect(symbolReads).toBe(0)
    expect(key({ color: 'red' })).not.toBe(key({ color: 'blue' }))
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
