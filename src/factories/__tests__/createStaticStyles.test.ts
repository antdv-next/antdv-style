import { describe, it, expect } from 'vitest'
import { makeCreateStaticStyles } from '../createStaticStyles'
import { createEmotion } from '../../core'

const emotion = createEmotion()
const createStaticStyles = makeCreateStaticStyles(emotion)

describe('createStaticStyles', () => {
  it('should create static styles from a factory function', () => {
    const useStyles = createStaticStyles(({ css }) => ({
      container: css({ display: 'flex', gap: '8px' }),
      title: css({ fontSize: '24px', fontWeight: 'bold' }),
    }))

    const { styles } = useStyles()
    expect(typeof styles.container).toBe('string')
    expect(typeof styles.title).toBe('string')
    expect(styles.container.length).toBeGreaterThan(0)
  })

  it('should create static styles from a plain object', () => {
    const useStyles = createStaticStyles({
      box: { display: 'block', padding: '16px' },
    })

    const { styles } = useStyles()
    expect(typeof styles.box).toBe('string')
  })

  it('should cache styles across multiple calls', () => {
    let callCount = 0
    const useStyles = createStaticStyles(({ css }) => {
      callCount++
      return { box: css({ color: 'red' }) }
    })

    useStyles()
    useStyles()
    useStyles()

    expect(callCount).toBe(1)
  })

  it('should return cx utility', () => {
    const useStyles = createStaticStyles(({ css }) => ({
      a: css({ color: 'red' }),
      b: css({ color: 'blue' }),
    }))

    const { styles, cx } = useStyles()
    const combined = cx(styles.a, styles.b)
    expect(typeof combined).toBe('string')
    expect(combined.length).toBeGreaterThan(0)
  })

  it('should not require ThemeProvider', () => {
    const useStyles = createStaticStyles(({ css }) => ({
      box: css({ margin: 0 }),
    }))

    // Should work without any provider context
    const { styles } = useStyles()
    expect(typeof styles.box).toBe('string')
  })
})
