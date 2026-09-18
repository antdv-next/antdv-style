import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { makeCreateGlobalStyle } from '../createGlobalStyle'
import { createThemeProvider } from '../createThemeProvider'
import { createEmotion } from '../../core'
import { createCacheManager } from '../../core/CacheManager'

// Clean up any injected style elements after each test
afterEach(() => {
  document.querySelectorAll('style[data-antdv-global]').forEach(el => el.remove())
})

describe('createGlobalStyle', () => {
  it.each([false, true])('collects and resets owned global sheets (speedy=%s)', async (speedy) => {
    const emotion = createEmotion({ key: 'owned-global', speedy, nonce: 'owned-nonce' })
    const other = createEmotion({ key: 'other-global', speedy: false })
    const manager = createCacheManager(emotion)
    const otherManager = createCacheManager(other)
    const color = ref('red')
    const mountGlobal = (engine: typeof emotion, selector: string) => {
      const useGlobal = makeCreateGlobalStyle(engine)(() => ({ [selector]: { color: color.value } }))
      const Consumer = defineComponent({
        setup() {
          useGlobal()
          return () => h('div')
        },
      })
      return mount(createThemeProvider(engine), { slots: { default: () => h(Consumer) } })
    }
    const wrapper = mountGlobal(emotion, '.owned-rule')
    const otherWrapper = mountGlobal(other, '.other-rule')
    try {
      expect(manager.getStyles()).toContain('.owned-rule')
      expect(manager.getStyles()).not.toContain('.other-rule')
      expect(manager.getStyleTags()).toContain('nonce="owned-nonce"')
      manager.reset()
      expect(manager.getStyles()).toBe('')
      expect(document.querySelector('style[data-emotion="owned-global-global"]')).toBeNull()
      expect(otherManager.getStyles()).toContain('.other-rule')
      color.value = 'blue'
      await nextTick()
      expect(manager.getStyles()).toContain('blue')
      for (const next of ['green', 'purple', 'red']) {
        manager.reset()
        expect(document.querySelectorAll('style[data-emotion="owned-global-global"]')).toHaveLength(0)
        color.value = next
        await nextTick()
        expect(document.querySelectorAll('style[data-emotion="owned-global-global"]')).toHaveLength(1)
        expect(manager.getStyles()).toContain(next)
      }
      wrapper.unmount()
      expect(manager.getStyles()).toBe('')
    } finally {
      if (wrapper.exists()) wrapper.unmount()
      otherWrapper.unmount()
      emotion.flush()
      other.flush()
    }
  })

  it.each(['append', 'prepend', 'insertionPoint'] as const)('collects sheets in %s DOM cascade order', (placement) => {
    const container = document.createElement('section')
    const point = document.createElement('meta')
    container.append(point)
    document.head.append(container)
    const emotion = createEmotion({
      key: 'collect-order', container, speedy: false,
      prepend: placement === 'prepend', insertionPoint: placement === 'insertionPoint' ? point : undefined,
    })
    emotion.css({ color: 'red' })
    const useGlobal = makeCreateGlobalStyle(emotion)(() => ({ '.global-order': { color: 'blue' } }))
    const Consumer = defineComponent({ setup() { useGlobal(); return () => h('div') } })
    const wrapper = mount(createThemeProvider(emotion), { slots: { default: () => h(Consumer) } })
    try {
      expect(createCacheManager(emotion).getStyles()).toBe(
        [...container.querySelectorAll('style')].map(tag => tag.textContent).join(''),
      )
      emotion.flush()
      expect(container.querySelectorAll('style')).toHaveLength(0)
    } finally {
      wrapper.unmount()
      emotion.flush()
      container.remove()
    }
  })

  it.each(['append', 'prepend', 'insertionPoint'] as const)('preserves %s cascade order across updates and empty styles', async (placement) => {
    const container = document.createElement('section')
    const insertionPoint = document.createElement('meta')
    container.append(insertionPoint)
    document.head.append(container)
    const emotion = createEmotion({
      key: 'global-order',
      container,
      speedy: false,
      prepend: placement === 'prepend',
      insertionPoint: placement === 'insertionPoint' ? insertionPoint : undefined,
    })
    const ThemeProvider = createThemeProvider(emotion)
    const createGlobalStyle = makeCreateGlobalStyle(emotion)
    const color = ref<string | undefined>('red')
    const first = createGlobalStyle(() => color.value ? { body: { color: color.value } } : undefined)
    const second = createGlobalStyle(() => ({ body: { color: 'blue' } }))
    const Consumer = defineComponent({
      setup() {
        first()
        second()
        return () => h('div')
      },
    })
    const wrapper = mount(ThemeProvider, { slots: { default: () => h(Consumer) } })
    const css = () => [...container.querySelectorAll('style[data-antdv-global]')]
      .map(tag => tag.textContent).join('')
    const initial = css()
    try {
      color.value = 'green'
      await nextTick()
      expect(css()).toBe(initial.replace('red', 'green'))
      color.value = undefined
      await nextTick()
      expect(css()).toBe('body{color:blue;}')
      color.value = 'purple'
      await nextTick()
      expect(css()).toBe(initial.replace('red', 'purple'))
    } finally {
      wrapper.unmount()
      emotion.flush()
      expect([...container.childNodes]).toEqual([insertionPoint])
      container.remove()
    }
  })

  it('should inject global styles into document head', () => {
    const emotion = createEmotion()
    const ThemeProvider = createThemeProvider(emotion)
    const createGlobalStyle = makeCreateGlobalStyle(emotion)

    const useGlobalStyle = createGlobalStyle(() => ({
      body: {
        margin: 0,
        padding: 0,
      },
    }))

    const Consumer = defineComponent({
      setup() {
        useGlobalStyle()
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      slots: { default: () => h(Consumer) },
    })

    const styleEl = document.querySelector('style[data-antdv-global]')
    expect(styleEl).not.toBeNull()
    expect(styleEl!.textContent).toContain('margin')
    expect(styleEl!.textContent).toContain('padding')
  })

  it('should use theme tokens in global styles', () => {
    const emotion = createEmotion()
    const ThemeProvider = createThemeProvider(emotion)
    const createGlobalStyle = makeCreateGlobalStyle(emotion)

    const useGlobalStyle = createGlobalStyle(({ token }) => ({
      body: {
        backgroundColor: (token as any).bgColor,
      },
    }))

    const Consumer = defineComponent({
      setup() {
        useGlobalStyle()
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      props: { customToken: { bgColor: '#f0f0f0' } },
      slots: { default: () => h(Consumer) },
    })

    const styleEl = document.querySelector('style[data-antdv-global]')
    expect(styleEl!.textContent).toContain('#f0f0f0')
  })

  it('should reactively update when theme changes (replace, not accumulate)', async () => {
    const emotion = createEmotion()
    const ThemeProvider = createThemeProvider(emotion)
    const createGlobalStyle = makeCreateGlobalStyle(emotion)

    const useGlobalStyle = createGlobalStyle(({ isDarkMode }) => ({
      body: {
        backgroundColor: isDarkMode ? '#000' : '#fff',
      },
    }))

    const Consumer = defineComponent({
      setup() {
        useGlobalStyle()
        return () => h('div')
      },
    })

    const wrapper = mount(ThemeProvider, {
      props: { themeMode: 'light' },
      slots: { default: () => h(Consumer) },
    })

    let styleEl = document.querySelector('style[data-antdv-global]')
    expect(styleEl!.textContent).toContain('#fff')
    expect(styleEl!.textContent).not.toContain('#000')

    await wrapper.setProps({ themeMode: 'dark' })
    await nextTick()

    styleEl = document.querySelector('style[data-antdv-global]')
    // Should REPLACE, not accumulate — old #fff should be gone
    expect(styleEl!.textContent).toContain('#000')
    expect(styleEl!.textContent).not.toContain('#fff')
  })

  it('should clean up styles on unmount', () => {
    const emotion = createEmotion()
    const ThemeProvider = createThemeProvider(emotion)
    const createGlobalStyle = makeCreateGlobalStyle(emotion)

    const useGlobalStyle = createGlobalStyle(() => ({
      body: { margin: 0 },
    }))

    const Consumer = defineComponent({
      setup() {
        useGlobalStyle()
        return () => h('div')
      },
    })

    const wrapper = mount(ThemeProvider, {
      slots: { default: () => h(Consumer) },
    })

    expect(document.querySelector('style[data-antdv-global]')).not.toBeNull()
    wrapper.unmount()
    expect(document.querySelector('style[data-antdv-global]')).toBeNull()
  })

  it('should throw when used outside ThemeProvider', () => {
    const emotion = createEmotion()
    const createGlobalStyle = makeCreateGlobalStyle(emotion)

    const useGlobalStyle = createGlobalStyle(() => ({
      body: { margin: 0 },
    }))

    const Consumer = defineComponent({
      setup() {
        useGlobalStyle()
        return () => h('div')
      },
    })

    expect(() => mount(Consumer)).toThrow('createGlobalStyle: must be used within a <ThemeProvider>')
  })

  it('should handle CSS string input', () => {
    const emotion = createEmotion()
    const ThemeProvider = createThemeProvider(emotion)
    const createGlobalStyle = makeCreateGlobalStyle(emotion)

    const useGlobalStyle = createGlobalStyle(() =>
      'body { font-family: sans-serif; }'
    )

    const Consumer = defineComponent({
      setup() {
        useGlobalStyle()
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      slots: { default: () => h(Consumer) },
    })

    const styleEl = document.querySelector('style[data-antdv-global]')
    expect(styleEl!.textContent).toContain('font-family')
  })

  it('should honor the active engine container and CSP nonce', () => {
    const container = document.createElement('section')
    document.body.appendChild(container)
    const emotion = createEmotion({ key: 'global-scope', container, nonce: 'nonce-123' })
    const ThemeProvider = createThemeProvider(emotion)
    const createGlobalStyle = makeCreateGlobalStyle(emotion)
    const useGlobalStyle = createGlobalStyle(() => ({ body: { color: 'red' } }))

    const Consumer = defineComponent({
      setup() {
        useGlobalStyle()
        return () => h('div')
      },
    })

    const wrapper = mount(ThemeProvider, {
      slots: { default: () => h(Consumer) },
    })

    const styleEl = container.querySelector('style[data-antdv-global]')
    expect(styleEl).not.toBeNull()
    expect(styleEl?.getAttribute('nonce')).toBe('nonce-123')
    expect(document.head.querySelector('style[data-emotion="global-scope-global"]')).toBeNull()

    wrapper.unmount()
    container.remove()
  })

  it('should process nesting and media queries through Stylis', () => {
    const emotion = createEmotion({ key: 'global-stylis' })
    const ThemeProvider = createThemeProvider(emotion)
    const createGlobalStyle = makeCreateGlobalStyle(emotion)
    const useGlobalStyle = createGlobalStyle(() => ({
      body: {
        color: 'red',
        '&:hover': { color: 'blue' },
        '@media (min-width: 600px)': { color: 'green' },
      },
    }))

    const Consumer = defineComponent({
      setup() {
        useGlobalStyle()
        return () => h('div')
      },
    })

    mount(ThemeProvider, { slots: { default: () => h(Consumer) } })

    const css = Array.from(document.querySelectorAll('style[data-antdv-global]'))
      .map(tag => tag.textContent ?? '')
      .join('')
    expect(css).toContain('body:hover')
    expect(css).toContain('@media')
    expect(css).not.toContain('&:hover')
  })
})
