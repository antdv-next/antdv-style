import { describe, it, expect, vi } from 'vitest'
import { createStaticStylesFactory, makeCreateStaticStyles } from '../createStaticStyles'
import { createEmotion } from '../../core'

const emotion = createEmotion()
const createStaticStyles = makeCreateStaticStyles(emotion)

describe('createStaticStyles', () => {
  it('should create static styles from a factory function', () => {
    const styles = createStaticStyles(({ css }) => ({
      container: css({ display: 'flex', gap: '8px' }),
      title: css({ fontSize: '24px', fontWeight: 'bold' }),
    }))

    expect(typeof styles.container).toBe('string')
    expect(typeof styles.title).toBe('string')
    expect(styles.container.length).toBeGreaterThan(0)
  })

  it('should create static styles from a plain object', () => {
    const styles = createStaticStyles({
      box: { display: 'block', padding: '16px' },
    })

    expect(typeof styles.box).toBe('string')
  })

  it('should cache styles across multiple calls', () => {
    let callCount = 0
    const styles = createStaticStyles(({ css }) => {
      callCount++
      return { box: css({ color: 'red' }) }
    })

    expect(callCount).toBe(1)
    expect(styles.box).toBeDefined()
  })

  it('should allow static styles to be combined with the instance cx utility', () => {
    const styles = createStaticStyles(({ css }) => ({
      a: css({ color: 'red' }),
      b: css({ color: 'blue' }),
    }))

    const combined = emotion.cx(styles.a, styles.b)
    expect(typeof combined).toBe('string')
    expect(combined.length).toBeGreaterThan(0)
  })

  it('should not require ThemeProvider', () => {
    const styles = createStaticStyles(({ css }) => ({
      box: css({ margin: 0 }),
    }))

    // Should work without any provider context
    expect(typeof styles.box).toBe('string')
  })

  it('should support a single class returned from css()', () => {
    const style = createStaticStyles(({ css }) => css({ color: 'tomato' }))

    expect(typeof style).toBe('string')
    expect(style).toContain('acss-')
  })

  it('should apply low hash priority to factory css()', () => {
    const customEmotion = createEmotion({ key: 'static-low' })
    const insert = vi.spyOn(customEmotion.cache, 'insert')
    const { createStaticStyles } = createStaticStylesFactory({
      cache: customEmotion.cache,
      hashPriority: 'low',
    })

    createStaticStyles(({ css }) => ({ box: css({ color: 'red' }) }))

    expect(insert).toHaveBeenCalled()
    expect(insert.mock.calls[0][0]).toMatch(/^:where\(\.static-low-/)
  })

  it('should support style keys that overlap function metadata', () => {
    const styles = createStaticStyles(({ css }) => ({
      name: css({ color: 'red' }),
      length: css({ color: 'blue' }),
    }))

    expect(styles.name).toContain('acss-')
    expect(styles.length).toContain('acss-')
    Object.assign(styles, { name: 'updated-class' })
    expect(styles.name).toBe('updated-class')
  })
})
