import {
  defineComponent,
  provide,
  inject,
  computed,
  ref,
  toRef,
  watch,
  onMounted,
  onUnmounted,
  type PropType,
  type Ref,
} from 'vue'
import type { EmotionInstance } from '../core'
import { DEFAULT_PREFIX_CLS, DEFAULT_ICON_PREFIX_CLS, DEFAULT_CSS_VAR_PREFIX } from '../core/constants'
import type { AntdToken, FullToken, ThemeMode, Appearance, BrowserPrefers, ThemeConfig, ThemeFunction, Theme } from '../types'
import { StyleEngineKey, ThemeModeKey, ThemeContextKey } from '../context'
import type { ContextKeys, ThemeModeContext } from '../context'
import { createCSSVarProxy } from '../utils/cssVar'
import { theme as antdTheme } from 'antdv-next'

export function createThemeProvider(emotion: EmotionInstance, keys?: ContextKeys) {
  const styleEngineKey = keys?.styleEngineKey ?? StyleEngineKey
  const themeModeKey = keys?.themeModeKey ?? ThemeModeKey
  const themeContextKey = keys?.themeContextKey ?? ThemeContextKey

  return defineComponent({
    name: 'ThemeProvider',
    props: {
      themeMode: {
        type: String as PropType<ThemeMode>,
        default: undefined,
      },
      defaultThemeMode: {
        type: String as PropType<ThemeMode>,
        default: undefined,
      },
      appearance: {
        type: String as PropType<Appearance>,
        default: undefined,
      },
      defaultAppearance: {
        type: String as PropType<Appearance>,
        default: undefined,
      },
      customToken: {
        type: [Object, Function] as PropType<
          | Record<string, unknown>
          | ((params: { token: AntdToken; appearance: Appearance; isDarkMode: boolean }) => Record<string, unknown>)
        >,
        default: undefined,
      },
      theme: {
        type: [Object, Function] as PropType<ThemeConfig | ThemeFunction>,
        default: undefined,
      },
      prefixCls: {
        type: String,
        default: DEFAULT_PREFIX_CLS,
      },
      iconPrefixCls: {
        type: String,
        default: DEFAULT_ICON_PREFIX_CLS,
      },
      stylish: {
        type: [Object, Function] as PropType<
          | Record<string, string>
          | ((params: { token: FullToken; stylish: Record<string, string>; appearance: Appearance; isDarkMode: boolean; css: EmotionInstance['css'] }) => Record<string, string>)
        >,
        default: undefined,
      },
    },
    emits: ['appearanceChange', 'themeModeChange'],
    setup(props, { slots, emit }) {
      const prefixCls = toRef(props, 'prefixCls')
      const iconPrefixCls = toRef(props, 'iconPrefixCls')

      // Get antdv-next's token from the nearest ConfigProvider via theme.useToken().
      // Returns { theme, token, hashId } where token is a Ref<GlobalToken>.
      // Gracefully handle when useToken fails (e.g., no ConfigProvider ancestor in tests).
      let antdTokenRef: Ref<AntdToken> | null = null
      try {
        if (antdTheme?.useToken) {
          const result = antdTheme.useToken()
          antdTokenRef = result.token
        }
      } catch {
        // useToken() failed — fall back to manual token from props
      }

      // Build cssVar proxy — prefix defaults to 'ant' matching antdv-next's cssVar.prefix
      const cssVarComputed = computed<Record<string, string>>(() => {
        return createCSSVarProxy({ prefix: DEFAULT_CSS_VAR_PREFIX })
      })

      // Try to inject parent contexts for nesting inheritance
      const parentModeCtx = inject(themeModeKey, undefined) as ThemeModeContext | undefined
      const parentThemeCtx = inject(themeContextKey, undefined)

      // Internal themeMode state (for uncontrolled mode)
      const internalThemeMode = ref<ThemeMode>(
        props.themeMode ?? props.defaultThemeMode ?? parentModeCtx?.themeMode.value ?? 'light',
      )

      // Internal appearance state (for uncontrolled mode when appearance prop is set directly)
      const internalAppearance = ref<Appearance | undefined>(
        props.appearance ?? props.defaultAppearance ?? undefined,
      )

      // Effective themeMode: controlled prop > internal state
      const effectiveThemeMode = computed<ThemeMode>(() => {
        return props.themeMode ?? internalThemeMode.value
      })

      // Track browser's preferred color scheme
      const canMatchMedia = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      const browserPrefers = ref<BrowserPrefers>(
        canMatchMedia ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : 'light',
      )
      let mediaQuery: MediaQueryList | null = null

      onMounted(() => {
        if (canMatchMedia) {
          mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
          browserPrefers.value = mediaQuery.matches ? 'dark' : 'light'
          const handler = (e: MediaQueryListEvent) => {
            browserPrefers.value = e.matches ? 'dark' : 'light'
          }
          mediaQuery.addEventListener('change', handler)
          onUnmounted(() => {
            mediaQuery?.removeEventListener('change', handler)
          })
        }
      })

      // Computed appearance: controlled appearance > derived from themeMode
      const computedAppearance = computed<Appearance>(() => {
        // If controlled appearance prop is provided, use it
        if (props.appearance) return props.appearance
        // If internal appearance is set (from setAppearance or defaultAppearance), use it
        if (internalAppearance.value) return internalAppearance.value
        // Otherwise derive from themeMode
        switch (effectiveThemeMode.value) {
          case 'dark':
            return 'dark'
          case 'auto':
            return browserPrefers.value === 'dark' ? 'dark' : 'light'
          case 'light':
          default:
            return 'light'
        }
      })

      const isDarkMode = computed(() => computedAppearance.value === 'dark')

      // Setter functions
      const setAppearance = (appearance: Appearance) => {
        internalAppearance.value = appearance
      }

      const setThemeMode = (themeMode: ThemeMode) => {
        internalThemeMode.value = themeMode
        // When themeMode changes, reset internal appearance to let themeMode drive it
        internalAppearance.value = undefined
      }

      watch(computedAppearance, (val) => emit('appearanceChange', val))
      watch(effectiveThemeMode, (val) => emit('themeModeChange', val))

      // antdToken: start with antdv-next's auto-detected token (from nearest ConfigProvider),
      // then merge user-provided theme token on top as overrides
      const antdToken = computed<AntdToken>(() => {
        // Start with antdv-next's auto-detected token if available
        const baseToken = antdTokenRef
          ? { ...antdTokenRef.value }
          : {} as AntdToken

        // If user provided a theme prop, merge its token on top
        if (props.theme) {
          const themeConfig = typeof props.theme === 'function'
            ? props.theme(computedAppearance.value)
            : props.theme
          Object.assign(baseToken, themeConfig.token ?? {})
        }
        return baseToken
      })

      // Inherit parent's custom token for nesting (upstream: defaultCustomToken from context)
      const parentCustomToken = computed<Record<string, unknown>>(() => {
        if (!parentThemeCtx) return {}
        // Extract custom fields: parent theme minus base antd token
        const parentTheme = parentThemeCtx.theme.value
        const parentBase = parentThemeCtx.antdToken.value
        const custom: Record<string, unknown> = {}
        for (const key of Object.keys(parentTheme)) {
          if (!(key in parentBase) && !['stylish', 'appearance', 'isDarkMode', 'themeMode', 'browserPrefers', 'prefixCls', 'iconPrefixCls'].includes(key)) {
            custom[key] = parentTheme[key as keyof Theme]
          }
        }
        return custom
      })

      // Resolve customToken (supports function form), merged with parent's custom token
      const resolvedCustomToken = computed<Record<string, unknown>>(() => {
        const inherited = parentCustomToken.value
        let current: Record<string, unknown> = {}
        if (typeof props.customToken === 'function') {
          current = props.customToken({
            token: antdToken.value,
            appearance: computedAppearance.value,
            isDarkMode: isDarkMode.value,
          })
        } else if (props.customToken) {
          current = props.customToken
        }
        return { ...inherited, ...current }
      })

      // Resolve stylish (supports function form)
      // Note: stylish param is {} because antdv-next has no built-in antd stylish (verified in source).
      // TODO: When nesting ThemeProviders, consider injecting parent's resolved stylish here.
      const resolvedStylish = computed<Record<string, string>>(() => {
        if (!props.stylish) return {}
        if (typeof props.stylish === 'function') {
          return props.stylish({
            token: { ...antdToken.value, ...resolvedCustomToken.value },
            stylish: {},
            appearance: computedAppearance.value,
            isDarkMode: isDarkMode.value,
            css: emotion.css,
          })
        }
        return props.stylish
      })

      // Build the complete Theme object
      const theme = computed<Theme>(() => {
        const mergedToken = {
          ...antdToken.value,
          ...resolvedCustomToken.value,
        }
        return {
          ...mergedToken,
          stylish: resolvedStylish.value,
          appearance: computedAppearance.value,
          isDarkMode: isDarkMode.value,
          themeMode: effectiveThemeMode.value,
          browserPrefers: browserPrefers.value,
          prefixCls: prefixCls.value,
          iconPrefixCls: iconPrefixCls.value,
        } as Theme
      })

      provide(styleEngineKey, emotion)
      provide(themeModeKey, {
        themeMode: effectiveThemeMode as Readonly<Ref<ThemeMode>>,
        appearance: computedAppearance,
        isDarkMode,
        browserPrefers,
        setAppearance,
        setThemeMode,
      })

      provide(themeContextKey, {
        theme,
        antdToken,
        prefixCls,
        iconPrefixCls,
        cssVar: cssVarComputed,
      })

      return () => slots.default?.()
    },
  })
}
