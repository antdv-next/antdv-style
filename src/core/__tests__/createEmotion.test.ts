import { describe, it, expect } from 'vitest'
import { createEmotion } from '../createEmotion'

describe('createEmotion', () => {
  it('should create an emotion instance with default key', () => {
    const emotion = createEmotion()
    expect(emotion.css).toBeDefined()
    expect(emotion.cx).toBeDefined()
    expect(emotion.keyframes).toBeDefined()
    expect(emotion.cache).toBeDefined()
    expect(emotion.cache.key).toBe('acss')
  })

  it('should create an emotion instance with custom key', () => {
    const emotion = createEmotion({ key: 'custom' })
    expect(emotion.cache.key).toBe('custom')
  })

  it('should generate class names with css()', () => {
    const { css } = createEmotion()
    const className = css({ color: 'red' })
    expect(typeof className).toBe('string')
    expect(className.length).toBeGreaterThan(0)
  })

  it('should combine class names with cx()', () => {
    const { cx } = createEmotion()
    const combined = cx('foo', 'bar', undefined, 'baz')
    expect(combined).toContain('foo')
    expect(combined).toContain('bar')
    expect(combined).toContain('baz')
  })

  it('should produce scoped instances with different cache keys', () => {
    const instance1 = createEmotion({ key: 'a' })
    const instance2 = createEmotion({ key: 'b' })
    expect(instance1.cache.key).toBe('a')
    expect(instance2.cache.key).toBe('b')
    const cls1 = instance1.css({ color: 'red' })
    const cls2 = instance2.css({ color: 'red' })
    expect(typeof cls1).toBe('string')
    expect(typeof cls2).toBe('string')
  })
})
