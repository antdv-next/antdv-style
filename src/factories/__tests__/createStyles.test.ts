import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, reactive, ref, nextTick } from 'vue'
import { makeCreateStyles } from '../createStyles/createStyles'
import { createThemeProvider } from '../createThemeProvider'
import { createEmotion } from '../../core'
import type { CreateStylesReturn, Theme, Appearance } from '../../types'

const emotion = createEmotion()
const ThemeProvider = createThemeProvider(emotion)
const createStyles = makeCreateStyles(emotion)

describe('createStyles', () => {
  it('isolates array consumers with named properties through repeated updates', async () => {
    const values = [
      reactive(Object.assign([], { tone: 'red' })),
      reactive(Object.assign([], { tone: 'blue' })),
    ]
    const useStyles = createStyles((_utils, props: unknown[] & { tone: string }) => ({
      root: { color: props.tone },
    }))
    const Consumer = defineComponent({
      props: { index: { type: Number, required: true } },
      setup(props) {
        const state = useStyles(() => values[props.index])
        return () => h('div', { class: state.styles.root })
      },
    })
    const wrapper = mount(ThemeProvider, {
      slots: { default: () => values.map((_, index) => h(Consumer, { index })) },
    })
    const cssAt = (index: number) => emotion.cache.registered[wrapper.findAll('div')[index].element.className]
    try {
      for (const color of ['red', 'green', 'red', 'purple']) {
        values[0].tone = color
        await nextTick()
        expect(cssAt(0)).toContain(`color:${color};`)
        expect(cssAt(1)).toContain('color:blue;')
      }
    } finally {
      wrapper.unmount()
    }
  })

  it('isolates empty and sparse array consumers through length and hole changes', async () => {
    const values = [
      reactive<unknown[]>([]),
      reactive<unknown[]>(new Array(1)),
      reactive<unknown[]>([undefined]),
    ]
    const useStyles = createStyles((_utils, props: unknown[]) => ({
      root: { padding: props.length * 10, color: 0 in props ? 'blue' : 'red' },
    }))
    const Consumer = defineComponent({
      props: { index: { type: Number, required: true } },
      setup(props) {
        const state = useStyles(() => values[props.index])
        return () => h('div', { class: state.styles.root })
      },
    })
    const wrapper = mount(ThemeProvider, {
      slots: { default: () => values.map((_, index) => h(Consumer, { index })) },
    })
    const cssAt = (index: number) => emotion.cache.registered[wrapper.findAll('div')[index].element.className]
    try {
      expect(cssAt(0)).toContain('padding:0;')
      expect(cssAt(1)).toContain('padding:10px;')
      expect(cssAt(1)).toContain('color:red;')
      expect(cssAt(2)).toContain('padding:10px;')
      expect(cssAt(2)).toContain('color:blue;')
      values[1][0] = 'present'
      await nextTick()
      expect(cssAt(1)).toContain('color:blue;')
      values[1][0] = undefined
      await nextTick()
      expect(cssAt(1)).toContain('color:blue;')
      Reflect.deleteProperty(values[1], '0')
      await nextTick()
      expect(cssAt(1)).toContain('color:red;')
      values[1].length = 2
      await nextTick()
      expect(cssAt(1)).toContain('padding:20px;')
      values[1].length = 0
      await nextTick()
      expect(cssAt(1)).toContain('padding:0;')
      expect(cssAt(0)).toContain('padding:0;')
    } finally {
      wrapper.unmount()
    }
  })

  it('keeps symbol-keyed consumers isolated and tracks repeated symbol mutations', async () => {
    const tone = Symbol('tone')
    const values = [reactive({ [tone]: 'red' }), reactive({ [tone]: 'blue' })]
    const useStyles = createStyles((_utils, props: { [tone]: string }) => ({
      root: { color: props[tone] },
    }))
    const Consumer = defineComponent({
      props: { index: { type: Number, required: true } },
      setup(props) {
        const state = useStyles(() => values[props.index])
        return () => h('div', { class: state.styles.root })
      },
    })
    const wrapper = mount(ThemeProvider, {
      slots: { default: () => values.map((_, index) => h(Consumer, { index })) },
    })
    try {
      for (const color of ['red', 'green', 'red', 'purple']) {
        values[0][tone] = color
        await nextTick()
        const nodes = wrapper.findAll('div')
        expect(emotion.cache.registered[nodes[0].element.className]).toContain(`color:${color}`)
        expect(emotion.cache.registered[nodes[1].element.className]).toContain('color:blue')
      }
    } finally {
      wrapper.unmount()
    }
  })

  it.each(['direct', 'nested'] as const)(
    'updates reactive class props repeatedly through a %s getter',
    async (shape) => {
      class Palette {
        color = 'red'
      }
      const palette = reactive(new Palette())
      const useStyles = createStyles((_utils, props: Palette | { palette: Palette }) => ({
        root: { color: 'palette' in props ? props.palette.color : props.color },
      }))
      const Consumer = defineComponent({
        setup() {
          const state = useStyles(() => shape === 'direct' ? palette : { palette })
          return () => h('div', { class: state.styles.root })
        },
      })
      const wrapper = mount(ThemeProvider, { slots: { default: () => h(Consumer) } })
      try {
        for (const color of ['red', 'blue', 'green', 'red', 'purple']) {
          palette.color = color
          await nextTick()
          const className = wrapper.get('div').element.className
          expect(emotion.cache.registered[className]).toContain(`color:${color}`)
        }
      } finally {
        wrapper.unmount()
      }
    },
  )

  it('tracks reactive class accessors without sharing dependency state between consumers', async () => {
    class Palette {
      constructor(public source: { color: string }) {}
      get color() {
        return this.source.color
      }
    }
    const source = reactive({ color: 'red' })
    const palette = new Palette(source)
    const useStyles = createStyles((_utils, props: { palette: Palette }) => ({
      root: { color: props.palette.color },
    }))
    const Consumer = defineComponent({
      setup() {
        const state = useStyles(() => ({ palette }))
        return () => h('div', { class: state.styles.root })
      },
    })
    const wrapper = mount(ThemeProvider, {
      slots: { default: () => [h(Consumer), h(Consumer)] },
    })
    try {
      for (const color of ['red', 'blue', 'green']) {
        source.color = color
        await nextTick()
        for (const element of wrapper.findAll('div')) {
          expect(emotion.cache.registered[element.element.className]).toContain(`color:${color}`)
        }
      }
    } finally {
      wrapper.unmount()
    }
  })

  it('regenerates styles when only the CSS variable prefix changes', async () => {
    const useStyles = createStyles(({ cssVar }) => ({
      root: { color: cssVar.colorPrimary },
    }))
    const Consumer = defineComponent({
      setup() {
        const state = useStyles()
        return () => h('div', { class: state.styles.root })
      },
    })
    const wrapper = mount(ThemeProvider, {
      props: { theme: { cssVar: { prefix: 'first' } } },
      slots: { default: () => h(Consumer) },
    })
    try {
      const first = wrapper.get('div').element.className
      await wrapper.setProps({ theme: { cssVar: { prefix: 'second' } } })
      const second = wrapper.get('div').element.className
      expect(second).not.toBe(first)
      expect(emotion.cache.registered[second]).toContain('--second-color-primary')
      await wrapper.setProps({ theme: { cssVar: { prefix: 'third' } } })
      expect(emotion.cache.registered[wrapper.get('div').element.className]).toContain('--third-color-primary')
    } finally {
      wrapper.unmount()
    }
  })

  it('should create a composable that returns styles', () => {
    const useStyles = createStyles(({ css }) => ({
      container: css({ color: 'red' }),
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

    expect(result.styles.container).toBeDefined()
    expect(typeof result.styles.container).toBe('string')
    expect(result.cx).toBeDefined()
    expect(result.theme).toBeDefined()
    expect(result.prefixCls).toBe('ant')
  })

  it('should support external props via getter', () => {
    const useStyles = createStyles(({ css }, props: { color: string }) => ({
      box: css({ color: props.color }),
    }))

    let result!: CreateStylesReturn
    const Consumer = defineComponent({
      setup() {
        result = useStyles(() => ({ color: 'blue' }))
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      slots: { default: () => h(Consumer) },
    })

    expect(result.styles.box).toBeDefined()
    expect(typeof result.styles.box).toBe('string')
  })

  it('should return a single class name when the factory returns css()', () => {
    const useStyles = createStyles(({ css }) => css({ color: 'red' }))

    let result!: CreateStylesReturn<string>
    const Consumer = defineComponent({
      setup() {
        result = useStyles()
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      slots: { default: () => h(Consumer) },
    })

    expect(typeof result.styles).toBe('string')
    expect(result.styles).toContain('acss-')
  })

  it('should preserve a class-name map as a style map', () => {
    const useStyles = createStyles({ root: 'existing-class-name' })

    let result!: CreateStylesReturn<{ root: string }>
    const Consumer = defineComponent({
      setup() {
        result = useStyles()
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      slots: { default: () => h(Consumer) },
    })

    expect(result.styles).toEqual({ root: 'existing-class-name' })
  })

  it('should provide token from ThemeProvider', () => {
    let receivedToken!: Theme<{ brandColor?: string }>
    const useStyles = createStyles(({ token }) => {
      receivedToken = token
      return {}
    })

    const Consumer = defineComponent({
      setup() {
        useStyles()
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      props: { customToken: { brandColor: '#abc' } },
      slots: { default: () => h(Consumer) },
    })

    expect(receivedToken.brandColor).toBe('#abc')
  })

  it('should provide isDarkMode and appearance', () => {
    let receivedAppearance!: Appearance
    let receivedIsDark!: boolean

    const useStyles = createStyles(({ appearance, isDarkMode }) => {
      receivedAppearance = appearance
      receivedIsDark = isDarkMode
      return {}
    })

    const Consumer = defineComponent({
      setup() {
        useStyles()
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      props: { themeMode: 'dark' },
      slots: { default: () => h(Consumer) },
    })

    expect(receivedAppearance).toBe('dark')
    expect(receivedIsDark).toBe(true)
  })

  it('should reactively update styles when theme changes', async () => {
    const useStyles = createStyles(({ css, isDarkMode }) => ({
      box: css({ color: isDarkMode ? 'white' : 'black' }),
    }))

    let result!: CreateStylesReturn
    const Consumer = defineComponent({
      setup() {
        result = useStyles()
        return () => h('div')
      },
    })

    const wrapper = mount(ThemeProvider, {
      props: { themeMode: 'light' },
      slots: { default: () => h(Consumer) },
    })

    const lightClass = result.styles.box
    await wrapper.setProps({ themeMode: 'dark' })
    await nextTick()
    const darkClass = result.styles.box

    expect(lightClass).not.toBe(darkClass)
  })

  it('should reactively update styles when props change', async () => {
    const useStyles = createStyles(({ css }, props: { color: string }) => ({
      box: css({ color: props.color }),
    }))

    let result!: CreateStylesReturn
    const colorRef = ref('red')

    const Consumer = defineComponent({
      setup() {
        result = useStyles(() => ({ color: colorRef.value }))
        return () => h('div')
      },
    })

    mount(ThemeProvider, {
      slots: { default: () => h(Consumer) },
    })

    const firstClass = result.styles.box
    colorRef.value = 'blue'
    await nextTick()
    const secondClass = result.styles.box

    expect(firstClass).not.toBe(secondClass)
  })

  it('should support circular and BigInt props without serializing them', () => {
    type ComplexProps = {
      circular: Record<string, unknown>
      count: bigint
    }
    const circular: Record<string, unknown> = {}
    circular.self = circular

    const useStyles = createStyles(({ css }, props: ComplexProps) => ({
      box: css({ zIndex: Number(props.count) }),
    }))

    const Consumer = defineComponent({
      setup() {
        expect(() => useStyles({ circular, count: 1n })).not.toThrow()
        return () => h('div')
      },
    })

    expect(() => mount(ThemeProvider, {
      slots: { default: () => h(Consumer) },
    })).not.toThrow()
  })

  it('should react to function-valued props without cache-key collisions', async () => {
    const formatter = ref<() => string>(() => 'red')
    const useStyles = createStyles(({ css }, props: { format: () => string }) => ({
      box: css({ color: props.format() }),
    }))

    let result!: CreateStylesReturn
    const Consumer = defineComponent({
      setup() {
        result = useStyles(() => ({ format: formatter.value }))
        return () => h('div')
      },
    })

    mount(ThemeProvider, { slots: { default: () => h(Consumer) } })
    const firstClass = result.styles.box
    formatter.value = () => 'blue'
    await nextTick()

    expect(result.styles.box).not.toBe(firstClass)
  })

  it('should throw when used outside ThemeProvider', () => {
    const useStyles = createStyles(() => ({}))
    const Consumer = defineComponent({
      setup() {
        useStyles()
        return () => h('div')
      },
    })
    expect(() => mount(Consumer)).toThrow('createStyles: useStyles() must be used within a <ThemeProvider>')
  })
})
