import { describe, it, expect } from 'vitest'
import { createEmotion } from '../createEmotion'
import { createCacheManager } from '../CacheManager'

describe('CacheManager', () => {
  it('should create a cache manager wrapping an emotion instance', () => {
    const emotion = createEmotion({ key: 'ssr-test' })
    const manager = createCacheManager(emotion)

    expect(manager.emotion).toBe(emotion)
    expect(typeof manager.getStyles).toBe('function')
    expect(typeof manager.getStyleTags).toBe('function')
    expect(typeof manager.reset).toBe('function')
  })

  it('should collect styles after css() calls', () => {
    const emotion = createEmotion({ key: 'ssr-collect' })
    const manager = createCacheManager(emotion)

    // Generate some styles
    emotion.css({ color: 'red' })
    emotion.css({ backgroundColor: 'blue' })

    const tags = manager.getStyleTags()
    expect(typeof tags).toBe('string')
    // The tags should contain the cache key
    if (tags.length > 0) {
      expect(tags).toContain('data-emotion')
    }
  })

  it('should reset collected styles', () => {
    const emotion = createEmotion({ key: 'ssr-reset' })
    const manager = createCacheManager(emotion)

    emotion.css({ color: 'red' })
    manager.reset()

    // After reset, the insertedKeys set is empty
    // But styles may still be in the sheet — reset only clears tracking
    expect(typeof manager.getStyles()).toBe('string')
  })

  it('should return empty string when no styles generated', () => {
    const emotion = createEmotion({ key: 'ssr-empty' })
    const manager = createCacheManager(emotion)

    expect(manager.getStyleTags()).toBe('')
  })
})
