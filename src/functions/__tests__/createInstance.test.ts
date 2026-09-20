import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { createInstance } from '../createInstance'
import { extractStaticStyle } from '../extractStaticStyle'
import type { CreateStylesReturn } from '../../types'

describe('createInstance', () => {
  it('should return all APIs', () => {
    const instance = createInstance()
    expect(instance.createStyles).toBeDefined()
    expect(instance.ThemeProvider).toBeDefined()
    expect(instance.useTheme).toBeDefined()
    expect(instance.useThemeMode).toBeDefined()
    expect(instance.css).toBeDefined()
    expect(instance.cx).toBeDefined()
    expect(instance.keyframes).toBeDefined()
    expect(instance.styleManager).toBeDefined()
    expect(instance.staticStylesCache).toBe(instance.styleManager.cache)
    expect(instance.injectGlobal).toBeDefined()
    expect(instance.responsive).toBeDefined()
    expect(instance.styleManager.cache.key).toBe('zcss')
    expect((instance as Record<string, unknown>).createInstance).toBeUndefined()
  })

  it('should work with custom key', () => {
    const instance = createInstance({ key: 'my-app' })
    expect(instance.css).toBeDefined()
  })

  it.each(['object', 'template'] as const)('keeps detached utility helpers scoped to their instance (%s)', (format) => {
    const instance = createInstance({ key: 'detached-helpers' })
    const other = createInstance({ key: 'other-helpers' })
    const { keyframes, injectGlobal } = instance
    try {
      const animation = format === 'object'
        ? keyframes({ from: { opacity: 0 }, to: { opacity: 1 } })
        : keyframes`from { opacity: ${0}; } to { opacity: ${1}; }`
      const injected = format === 'object'
        ? injectGlobal({ '.detached-api-target': { animation: `${animation} 1s`, color: 'tomato' } })
        : injectGlobal`.detached-api-target { animation: ${animation} 1s; color: tomato; }`
      expect(injected).toBeUndefined()
      const result = extractStaticStyle(instance.styleManager, { includeAntdv: false })
      expect(result.css).toContain('@keyframes')
      expect(result.css).toContain(animation)
      expect(result.css).toContain('.detached-api-target')
      expect(result.css).toContain('tomato')
      expect(extractStaticStyle(other.styleManager, { includeAntdv: false }).css).toBe('')
    } finally {
      instance.dispose()
      other.dispose()
    }
  })

  it('should preserve distinct configurations for instances sharing a key', () => {
    const speedy = createInstance({ key: 'shared-config', speedy: true })
    const regular = createInstance({ key: 'shared-config', speedy: false })

    expect(regular.styleManager).not.toBe(speedy.styleManager)
    expect(speedy.styleManager.sheet.isSpeedy).toBe(true)
    expect(regular.styleManager.sheet.isSpeedy).toBe(false)
  })

  it('should dispose request-scoped instances from aggregate extraction', () => {
    const instance = createInstance({ key: 'request-dispose' })
    instance.css({ color: 'tomato' })

    expect(extractStaticStyle(undefined, { includeAntdv: false }).tags)
      .toContain('data-emotion="request-dispose ')

    instance.dispose()

    expect(extractStaticStyle(undefined, { includeAntdv: false }).tags)
      .not.toContain('data-emotion="request-dispose ')
    expect(instance.styleManager.cache.inserted).toEqual({})
  })

  it('should apply instance hashPriority to exported css()', () => {
    const instance = createInstance({ key: 'low-app', hashPriority: 'low' })
    const insert = vi.spyOn(instance.styleManager.cache, 'insert')

    instance.css({ color: 'red' })

    expect(insert).toHaveBeenCalled()
    expect(insert.mock.calls[0][0]).toMatch(/^:where\(\.low-app-/)
  })

  it('should derive cssVar prefix from prefixCls when not explicitly set', () => {
    const instance = createInstance({ prefixCls: 'site' })
    expect(instance.cssVar.colorPrimary).toBe('var(--site-color-primary, var(--ant-color-primary))')
  })

  it('should expose the same cssVar prefix through ThemeProvider composables', () => {
    const instance = createInstance({ prefixCls: 'site' })
    let colorPrimary = ''
    const Consumer = defineComponent({
      setup() {
        const theme = instance.useAntdTheme()
        colorPrimary = theme.value.cssVar.colorPrimary
        return () => h('div')
      },
    })

    mount(instance.ThemeProvider, {
      slots: { default: () => h(Consumer) },
    })

    expect(colorPrimary).toBe('var(--site-color-primary, var(--ant-color-primary))')
  })

  it('should produce working ThemeProvider + createStyles', () => {
    const { ThemeProvider, createStyles } = createInstance()
    const useStyles = createStyles(({ css }) => ({
      box: css({ display: 'flex' }),
    }))

    let result!: CreateStylesReturn
    const Consumer = defineComponent({
      setup() {
        result = useStyles()
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      slots: { default: () => h(Consumer) },
    })

    expect(typeof result.styles.box).toBe('string')
  })
})
