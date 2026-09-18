import { describe, it, expect } from 'vitest'
import { px2remTransformer } from '../px2rem'

describe('px2remTransformer', () => {
  it('supports the component transformer contract without removing the string API', () => {
    const input = { padding: 32, lineHeight: 2, borderWidth: 1, '@media (min-width: 640px)': { margin: 16 } }
    for (const mediaQuery of [false, true]) {
      const options = { rootValue: 16, mediaQuery }
      const transform = px2remTransformer(options)
      expect(transform.visit(input)).toEqual({
        padding: '2rem',
        lineHeight: 2,
        borderWidth: '1px',
        [mediaQuery ? '@media (min-width: 40rem)' : '@media (min-width: 640px)']: { margin: 16 },
      })
      expect(transform('padding: 32px')).toBe('padding: 2rem')
    }
    expect(input.padding).toBe(32)
  })

  it('preserves numeric unitless declarations across SSR module loaders', () => {
    const input = { lineHeight: 2, opacity: 0.8, zIndex: 20, flexGrow: 2, WebkitLineClamp: 3, width: 32 }
    expect(px2remTransformer().visit(input)).toEqual({ ...input, width: '2rem' })
  })

  it('can preserve media-query pixels in the legacy string API', () => {
    expect(px2remTransformer({ mediaQuery: false })('@media (width > 640px) { .a { padding: 16px } }'))
      .toBe('@media (width > 640px) { .a { padding: 1rem } }')
  })

  it('preserves URLs, strings, comments and identifiers while converting dimensions', () => {
    const css = `.icon-16px {
  /* keep 16px */
  background: url("/assets/icon-16px.png");
  mask: URL(/assets/mask-16px.svg);
  content: "16px";
  --size-16px: 16px;
  padding: var(--size-16px, 32px);
}`
    expect(px2remTransformer()(css)).toBe(css
      .replace('--size-16px: 16px', '--size-16px: 1rem')
      .replace('--size-16px, 32px', '--size-16px, 2rem'))
  })

  it('converts signed dimensions, math and media queries without changing quoted attributes', () => {
    expect(px2remTransformer()('@media (width > 640px) { [data-size="16px"] { margin: -16px; width: calc(100% - 32px); } }'))
      .toBe('@media (width > 40rem) { [data-size="16px"] { margin: -1rem; width: calc(100% - 2rem); } }')
  })

  it('keeps escaped strings and data URLs intact', () => {
    const css = 'content:"say \\"16px\\"";background:url(data:image/svg+xml;base64,16px);padding:16px'
    expect(px2remTransformer()(css)).toBe(css.replace('padding:16px', 'padding:1rem'))
  })

  it('returns malformed CSS unchanged without a partial conversion', () => {
    const css = '.root { padding:16px; content:"unterminated }'
    expect(px2remTransformer()(css)).toBe(css)
  })

  it('compares signed pixel values by absolute magnitude', () => {
    expect(px2remTransformer({ minPixelValue: 2 })('margin: -1px -16px'))
      .toBe('margin: -1px -1rem')
  })

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
