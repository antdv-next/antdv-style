import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { makeCreateStyles } from '../createStyles/createStyles'
import { createThemeProvider } from '../createThemeProvider'
import { createEmotion } from '../../core'
import type { CreateStylesReturn } from '../../types'

describe('createStyles options', () => {
  describe('label', () => {
    it('should add label suffix to generated class names', () => {
      const emotion = createEmotion()
      const ThemeProvider = createThemeProvider(emotion)
      const createStyles = makeCreateStyles(emotion)

      const useStyles = createStyles(() => ({
        container: { color: 'red' },
      }), { label: 'MyComponent' })

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

      expect(result.styles.container).toContain('MyComponent')
    })

    it('should add label to object styles processed by createStyles', () => {
      const emotion = createEmotion()
      const ThemeProvider = createThemeProvider(emotion)
      const createStyles = makeCreateStyles(emotion)

      const useStyles = createStyles(() => ({
        wrapper: { display: 'flex', alignItems: 'center' },
      }), { label: 'Layout' })

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

      expect(result.styles.wrapper).toContain('Layout')
    })

    it('should work without label option', () => {
      const emotion = createEmotion()
      const ThemeProvider = createThemeProvider(emotion)
      const createStyles = makeCreateStyles(emotion)

      const useStyles = createStyles(({ css }) => ({
        box: css({ color: 'green' }),
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

      expect(result.styles.box).toBeDefined()
      expect(typeof result.styles.box).toBe('string')
    })
  })

  describe('hashPriority', () => {
    it('should accept hashPriority low option at instance level', () => {
      const emotion = createEmotion()
      const ThemeProvider = createThemeProvider(emotion)
      const createStyles = makeCreateStyles(emotion, { hashPriority: 'low' })

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

      expect(result.styles.box).toBeDefined()
      expect(typeof result.styles.box).toBe('string')
    })

    it('should apply hashPriority low to object styles', () => {
      const emotion = createEmotion()
      const ThemeProvider = createThemeProvider(emotion)
      const createStyles = makeCreateStyles(emotion, { hashPriority: 'low' })

      const useStyles = createStyles(() => ({
        container: { color: 'red', fontSize: '14px' },
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
    })

    it('should allow per-createStyles hashPriority override', () => {
      const emotion = createEmotion()
      const ThemeProvider = createThemeProvider(emotion)
      const createStyles = makeCreateStyles(emotion, { hashPriority: 'high' })

      const useStyles = createStyles(() => ({
        box: { color: 'blue' },
      }), { hashPriority: 'low' })

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

      expect(result.styles.box).toBeDefined()
      expect(typeof result.styles.box).toBe('string')
    })

    it('should default to high hashPriority', () => {
      const emotion = createEmotion()
      const ThemeProvider = createThemeProvider(emotion)
      const createStyles = makeCreateStyles(emotion)

      const useStyles = createStyles(({ css }) => ({
        box: css({ color: 'blue' }),
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

      expect(result.styles.box).toBeDefined()
    })
  })

  describe('label + hashPriority combined', () => {
    it('should support both label and hashPriority low together', () => {
      const emotion = createEmotion()
      const ThemeProvider = createThemeProvider(emotion)
      const createStyles = makeCreateStyles(emotion)

      const useStyles = createStyles(() => ({
        header: { backgroundColor: '#fff' },
      }), { label: 'PageHeader', hashPriority: 'low' })

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

      expect(result.styles.header).toBeDefined()
      expect(result.styles.header).toContain('PageHeader')
    })
  })
})
