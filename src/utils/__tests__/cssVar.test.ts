import { describe, it, expect } from 'vitest'
import { tokenToCSSVar, createCSSVarProxy } from '../cssVar'

describe('tokenToCSSVar', () => {
  it('should convert token keys to CSS variable declarations with ant prefix', () => {
    const result = tokenToCSSVar({
      colorPrimary: '#1890ff',
      borderRadius: '6px',
      fontSize: 14,
    })

    expect(result).toContain('--ant-color-primary: #1890ff;')
    expect(result).toContain('--ant-border-radius: 6px;')
    expect(result).toContain('--ant-font-size: 14;')
  })

  it('should support custom prefix', () => {
    const result = tokenToCSSVar(
      { colorPrimary: '#ff0000' },
      { prefix: 'my-app' },
    )
    expect(result).toContain('--my-app-color-primary: #ff0000;')
  })

  it('should skip private keys, kebab-case keys, objects, and functions', () => {
    const result = tokenToCSSVar({
      colorPrimary: '#1890ff',
      _stylish: { card: 'some-class' },
      _internal: 'hidden',
      'blue-1': '#e6f7ff',  // kebab-case key — skip
      nested: { deep: true },
      fn: () => {},
    })

    expect(result).toContain('--ant-color-primary: #1890ff;')
    expect(result).not.toContain('_stylish')
    expect(result).not.toContain('_internal')
    expect(result).not.toContain('blue-1')
    expect(result).not.toContain('nested')
    expect(result).not.toContain('fn')
  })

  it('should handle number-containing keys correctly', () => {
    const result = tokenToCSSVar({ yellow1: '#fff', blue10: '#003' })
    expect(result).toContain('--ant-yellow-1: #fff;')
    expect(result).toContain('--ant-blue-10: #003;')
  })
})

describe('createCSSVarProxy', () => {
  it('should return var() references with ant prefix by default', () => {
    const cssVar = createCSSVarProxy()
    expect(cssVar.colorPrimary).toBe('var(--ant-color-primary)')
    expect(cssVar.borderRadius).toBe('var(--ant-border-radius)')
    expect(cssVar.fontSizeLG).toBe('var(--ant-font-size-lg)')
    expect(cssVar.colorBgContainer).toBe('var(--ant-color-bg-container)')
    expect(cssVar.screenXSMax).toBe('var(--ant-screen-xs-max)')
    expect(cssVar.yellow1).toBe('var(--ant-yellow-1)')
  })

  it('should support custom prefix with fallback to ant', () => {
    const cssVar = createCSSVarProxy({ prefix: 'site' })
    expect(cssVar.colorPrimary).toBe('var(--site-color-primary, var(--ant-color-primary))')
  })

  it('should not add fallback when prefix is ant', () => {
    const cssVar = createCSSVarProxy({ prefix: 'ant' })
    expect(cssVar.colorPrimary).toBe('var(--ant-color-primary)')
  })
})
