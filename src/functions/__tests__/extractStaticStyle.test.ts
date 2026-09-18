import { describe, it, expect } from 'vitest'
import { createEmotion, registerEmotionInstance } from '../../core'
import { createCacheManager } from '../../core'
import { extractStaticStyle } from '../extractStaticStyle'
import { createStaticStylesFactory } from '../../factories/createStaticStyles'
import { createCache } from '@antdv-next/cssinjs'

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

    const result = extractStaticStyle(emotion, { includeAntdv: false })
    expect(typeof result.css).toBe('string')
    expect(typeof result.tags).toBe('string')
  })

  it('should return empty when no styles exist', () => {
    const emotion = createEmotion({ key: 'extract-none' })
    const result = extractStaticStyle(emotion, { includeAntdv: false })
    expect(result.tags).toBe('')
  })

  it('should aggregate registered instances when called without arguments', () => {
    const emotion = registerEmotionInstance(createEmotion({ key: 'extract-registered' }))
    emotion.css({ color: 'rebeccapurple' })

    const result = extractStaticStyle()
    expect(result.tags).toContain('data-emotion="extract-registered ')
  })

  it('should include the default static styles cache without arguments', () => {
    const { createStaticStyles } = createStaticStylesFactory()
    createStaticStyles(({ css }) => ({ box: css({ color: 'tomato' }) }))

    const result = extractStaticStyle(undefined, { includeAntdv: false })
    expect(result.tags).toContain('data-emotion="acss ')
  })

  it('should preserve antdv cssinjs hydration attributes', () => {
    const antdCache = createCache()
    antdCache.update(['style', 'demo'], () => [
      1,
      ['.demo{color:red}', 'demo-style', {}, false, 0],
    ])

    const result = extractStaticStyle(undefined, { antdCache })

    expect(result.tags).toContain('data-vc-order="prependQueue"')
    expect(result.tags).toContain('data-vc-priority="0"')
    expect(result.tags).toContain('data-css-hash="demo-style"')
  })
})
