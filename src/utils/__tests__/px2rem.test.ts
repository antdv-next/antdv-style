import { describe, it, expect } from 'vitest'
import { px2remTransformer } from '../px2rem'

describe('px2remTransformer', () => {
  it('should convert px to rem with default root value (16)', () => {
    const transform = px2remTransformer()
    expect(transform('font-size: 16px')).toBe('font-size: 1rem')
    expect(transform('padding: 32px')).toBe('padding: 2rem')
    expect(transform('margin: 8px')).toBe('margin: 0.5rem')
  })

  it('should handle custom root value', () => {
    const transform = px2remTransformer({ rootValue: 10 })
    expect(transform('font-size: 10px')).toBe('font-size: 1rem')
    expect(transform('padding: 20px')).toBe('padding: 2rem')
  })

  it('should handle multiple px values in one string', () => {
    const transform = px2remTransformer()
    expect(transform('padding: 16px 32px')).toBe('padding: 1rem 2rem')
    expect(transform('margin: 8px 16px 24px 32px')).toBe('margin: 0.5rem 1rem 1.5rem 2rem')
  })

  it('should respect minPixelValue', () => {
    const transform = px2remTransformer({ minPixelValue: 2 })
    expect(transform('border: 1px solid red')).toBe('border: 1px solid red')
    expect(transform('padding: 16px')).toBe('padding: 1rem')
  })

  it('should handle decimal px values', () => {
    const transform = px2remTransformer()
    expect(transform('font-size: 14.5px')).toBe('font-size: 0.90625rem')
  })

  it('should not affect non-px values', () => {
    const transform = px2remTransformer()
    expect(transform('font-size: 1em')).toBe('font-size: 1em')
    expect(transform('width: 100%')).toBe('width: 100%')
    expect(transform('opacity: 0.5')).toBe('opacity: 0.5')
  })

  it('should handle 0px', () => {
    const transform = px2remTransformer()
    expect(transform('margin: 0px')).toBe('margin: 0rem')
  })

  it('should handle precision option', () => {
    const transform = px2remTransformer({ precision: 2 })
    expect(transform('font-size: 14px')).toBe('font-size: 0.88rem')
  })
})
