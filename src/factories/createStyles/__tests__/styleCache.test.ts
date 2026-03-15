import { describe, it, expect } from 'vitest'
import { createStyleCache } from '../styleCache'

describe('styleCache', () => {
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
})
