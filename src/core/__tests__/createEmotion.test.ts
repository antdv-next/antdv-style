import { describe, it, expect } from 'vitest'
import { createEmotion } from '../createEmotion'

describe('createEmotion', () => {
  it.each([false, true])('hydrates all main tags before owned globals (speedy=%s)', (speedy) => {
    const container = document.createElement('section')
    document.head.append(container)
    container.innerHTML = '<meta id="point">'
      + '<style data-emotion="hydrate-order-global" data-antdv-global="v-0" data-antdv-global-ssr="">.target{color:red;}</style>'
      + '<style data-emotion="hydrate-order first">.hydrate-order-first{color:blue;}</style>'
      + '<style data-emotion="hydrate-order-global" data-antdv-global="v-1" data-antdv-global-ssr=""></style>'
      + '<style data-emotion="hydrate-order second">.hydrate-order-second{color:green;}</style>'
      + '<style data-emotion="foreign-global" data-antdv-global="v-0">.foreign{color:purple;}</style>'
    const foreign = container.lastChild
    const emotion = createEmotion({
      key: 'hydrate-order', container, speedy,
      insertionPoint: container.querySelector('meta')!,
    })
    try {
      expect([...container.querySelectorAll('style')].map(tag => tag.getAttribute('data-emotion')))
        .toEqual([
          'hydrate-order first', 'hydrate-order second',
          'hydrate-order-global', 'hydrate-order-global', 'foreign-global',
        ])
      emotion.css({ color: 'orange' })
      const firstGlobal = container.querySelector('style[data-antdv-global]')!
      for (const tag of emotion.sheet.tags) {
        expect(tag.compareDocumentPosition(firstGlobal) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      }
      expect(container.lastChild).toBe(foreign)
    } finally {
      emotion.flush()
      container.remove()
    }
  })

  it('should create an emotion instance with default key', () => {
    const emotion = createEmotion()
    expect(typeof emotion.css).toBe('function')
    expect(typeof emotion.cx).toBe('function')
    expect(typeof emotion.keyframes).toBe('function')
    expect(emotion.cache).toBeDefined()
    expect(emotion.cache.key).toBe('acss')
  })

  it('should create an emotion instance with custom key', () => {
    const emotion = createEmotion({ key: 'custom' })
    expect(emotion.cache.key).toBe('custom')
  })

  it('should generate class names with css()', () => {
    const emotion = createEmotion()
    const className = emotion.css({ color: 'red' })
    expect(typeof className).toBe('string')
    expect(className.length).toBeGreaterThan(0)
  })

  it('should combine class names with cx()', () => {
    const emotion = createEmotion()
    const combined = emotion.cx('foo', 'bar', undefined, 'baz')
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
