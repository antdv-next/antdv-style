import { describe, it, expect } from 'vitest'
import { createEmotion } from '../../core'
import { createCacheManager } from '../../core'
import { extractStaticStyle } from '../extractStaticStyle'

describe('extractStaticStyle', () => {
  it('should extract styles from a CacheManager', () => {
    const emotion = createEmotion({ key: 'extract-test' })
    const manager = createCacheManager(emotion)

    emotion.css({ color: 'red' })

    const result = extractStaticStyle(manager)
    expect(typeof result.css).toBe('string')
    expect(typeof result.tags).toBe('string')
  })

  it('should extract styles from an EmotionInstance', () => {
    const emotion = createEmotion({ key: 'extract-emo' })
    emotion.css({ fontSize: '16px' })

    const result = extractStaticStyle(emotion)
    expect(typeof result.css).toBe('string')
    expect(typeof result.tags).toBe('string')
  })

  it('should return empty when no styles exist', () => {
    const emotion = createEmotion({ key: 'extract-none' })
    const result = extractStaticStyle(emotion)
    expect(result.tags).toBe('')
  })
})
