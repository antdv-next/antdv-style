import { describe, it, expect, vi } from 'vitest'
import { createEmotion } from '../createEmotion'
import { createCacheManager } from '../CacheManager'

describe('CacheManager', () => {
  it.each(['</style>', '</StYlE >', '</STYLE/>'])(
    'escapes HTML raw-text terminators without changing raw CSS: %s', (closing) => {
      const emotion = createEmotion({ key: 'raw-text' })
      const manager = createCacheManager(emotion)
      const css = `.raw-text-test::before{content:"${closing}<script>marker=true</script>";}`
        + `/* ${closing} */@media (width < 900px){.raw-text-test{color:red}}`
      emotion.cache.inserted.test = css
      const tags = manager.getStyleTags()
      const body = tags.slice(tags.indexOf('>') + 1, tags.lastIndexOf('</style>'))
      expect(body).not.toMatch(/<\/style/i)
      expect(body).toContain('@media (width < 900px)')
      expect(body.replace(/<\\\//g, '</')).toBe(css)
      expect(manager.getStyles()).toBe(css)
    },
  )
  it('should create a cache manager wrapping an emotion instance', () => {
    const emotion = createEmotion({ key: 'ssr-test' })
    const manager = createCacheManager(emotion)

    expect(manager.emotion).toBe(emotion)
    expect(typeof manager.getStyles).toBe('function')
    expect(typeof manager.getStyleTags).toBe('function')
    expect(typeof manager.reset).toBe('function')
  })

  it('should reuse the same manager without wrapping cache.insert again', () => {
    const emotion = createEmotion({ key: 'ssr-idempotent' })
    const first = createCacheManager(emotion)
    const wrappedInsert = emotion.cache.insert
    const second = createCacheManager(emotion)

    expect(second).toBe(first)
    expect(emotion.cache.insert).toBe(wrappedInsert)
  })

  it('should collect styles after css() calls', () => {
    const emotion = createEmotion({ key: 'ssr-collect' })
    const manager = createCacheManager(emotion)

    // Generate some styles
    const className = emotion.css({ color: 'red' })
    emotion.css({ backgroundColor: 'blue' })

    const tags = manager.getStyleTags()
    expect(typeof tags).toBe('string')
    expect(tags).toContain('data-emotion')
    expect(tags).toContain(className.replace(`${emotion.cache.key}-`, ''))
  })

  it('should extract CSS from speedy CSSOM rules', () => {
    const emotion = createEmotion({ key: 'ssr-speedy', speedy: true })
    const manager = createCacheManager(emotion)

    emotion.css({ color: 'rebeccapurple' })

    expect(manager.getStyles()).toContain('rebeccapurple')
    expect(manager.getStyleTags()).toContain('data-emotion="ssr-speedy ')
  })

  it('should preserve and escape the configured CSP nonce in style tags', () => {
    const emotion = createEmotion({ key: 'ssr-nonce', nonce: 'a"&<b>' })
    const manager = createCacheManager(emotion)

    emotion.css({ color: 'red' })

    expect(manager.getStyleTags()).toContain('nonce="a&quot;&amp;&lt;b&gt;"')
  })

  it('should tolerate browsers that deny CSSOM rule access', () => {
    const emotion = createEmotion({ key: 'ssr-cssom-denied', speedy: true })
    const manager = createCacheManager(emotion)

    emotion.css({ color: 'red' })
    const tag = emotion.sheet.tags[0]
    Object.defineProperty(tag, 'sheet', {
      configurable: true,
      get() {
        throw new DOMException('Access denied', 'SecurityError')
      },
    })

    expect(manager.getStyles()).toBe('')
    expect(manager.getStyleTags()).toBe('')
  })

  it('should reset collected styles', () => {
    const emotion = createEmotion({ key: 'ssr-reset' })
    const manager = createCacheManager(emotion)

    emotion.css({ color: 'red' })
    manager.reset()

    expect(manager.getStyles()).toBe('')
    expect(manager.getStyleTags()).toBe('')
  })

  it('should return empty string when no styles generated', () => {
    const emotion = createEmotion({ key: 'ssr-empty' })
    const manager = createCacheManager(emotion)

    expect(manager.getStyleTags()).toBe('')
  })

  it('should share registered instances across module copies', async () => {
    const emotion = createEmotion({ key: 'shared-registry' })
    const firstModule = await import('../CacheManager')
    firstModule.registerEmotionInstance(emotion)

    vi.resetModules()
    const secondModule = await import('../CacheManager')

    expect(secondModule.getRegisteredEmotionInstances()).toContain(emotion)
    expect(secondModule.createCacheManager(emotion)).toBe(firstModule.createCacheManager(emotion))

    secondModule.unregisterEmotionInstance(emotion)
  })
})
