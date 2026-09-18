import {
  ConfigProvider,
  theme as antdTheme,
  useMessage,
  useModal,
  useNotification,
} from 'antdv-next'
import { useConfig as useAntdvConfig } from 'antdv-next/dist/config-provider/context'
import {
  computed,
  defineComponent,
  h,
  inject,
  onMounted,
  onUnmounted,
  provide,
  ref,
  watch,
  type PropType,
  type Ref,
  type VNodeChild,
} from 'vue'
import type { EmotionInstance } from '../core'
import {
  DEFAULT_CSS_VAR_PREFIX,
  DEFAULT_ICON_PREFIX_CLS,
  DEFAULT_PREFIX_CLS,
} from '../core/constants'
import { StyleEngineKey, ThemeContextKey, ThemeModeKey } from '../context'
import type { ContextKeys, ThemeModeContext } from '../context'
import type {
  AntdStylish,
  AntdToken,
  Appearance,
  BrowserPrefers,
  FullStylish,
  FullToken,
  Theme,
  ThemeConfig,
  ThemeFunction,
  ThemeMode,
} from '../types'
import { createCSSVarProxy } from '../utils/cssVar'

export interface StaticInstance {
  message: ReturnType<typeof useMessage>[0]
  notification: ReturnType<typeof useNotification>[0]
  modal: ReturnType<typeof useModal>[0]
}

export interface CreateThemeProviderDefaults {
  prefixCls?: string
  iconPrefixCls?: string
  cssVarPrefix?: string
  customToken?: Record<string, unknown>
}

export interface ThemeProviderProps<T = Record<string, unknown>, S = Record<string, string>> {
  themeMode?: ThemeMode
  defaultThemeMode?: ThemeMode
  appearance?: Appearance
  defaultAppearance?: Appearance
  customToken?: T | ((params: { token: AntdToken; appearance: Appearance; isDarkMode: boolean }) => T)
  theme?: ThemeConfig | ThemeFunction
  prefixCls?: string
  iconPrefixCls?: string
  stylish?: S | ((params: {
    token: FullToken & T
    stylish: AntdStylish
    appearance: Appearance
    isDarkMode: boolean
    css: EmotionInstance['css']
  }) => S)
  customStylish?: (params: {
    token: FullToken & T
    stylish: AntdStylish
    appearance: Appearance
    isDarkMode: boolean
    css: EmotionInstance['css']
  }) => S
  onAppearanceChange?: (appearance: Appearance) => void
  onThemeModeChange?: (themeMode: ThemeMode) => void
  getStaticInstance?: (instances: StaticInstance) => void
  staticInstanceConfig?: {
    message?: Parameters<typeof useMessage>[0]
    notification?: Parameters<typeof useNotification>[0]
  }
}

const themeStateKeys = new Set([
  'stylish',
  'appearance',
  'isDarkMode',
  'themeMode',
  'browserPrefers',
  'prefixCls',
  'iconPrefixCls',
])

export function createThemeProvider(
  defaultEmotion: EmotionInstance,
  keys?: ContextKeys,
  defaults?: CreateThemeProviderDefaults,
) {
  const styleEngineKey = keys?.styleEngineKey ?? StyleEngineKey
  const themeModeKey = keys?.themeModeKey ?? ThemeModeKey
  const themeContextKey = keys?.themeContextKey ?? ThemeContextKey

  return defineComponent({
    name: 'ThemeProvider',
    props: {
      themeMode: String as PropType<ThemeMode>,
      defaultThemeMode: String as PropType<ThemeMode>,
      appearance: String as PropType<Appearance>,
      defaultAppearance: String as PropType<Appearance>,
      customToken: {
        type: [Object, Function] as PropType<
          | Record<string, unknown>
          | ((params: { token: AntdToken; appearance: Appearance; isDarkMode: boolean }) => Record<string, unknown>)
        >,
      },
      theme: [Object, Function] as PropType<ThemeConfig | ThemeFunction>,
      prefixCls: {
        type: String,
        default: undefined,
      },
      iconPrefixCls: {
        type: String,
        default: undefined,
      },
      stylish: {
        type: [Object, Function] as PropType<
          | Record<string, string>
          | ((params: {
              token: FullToken
              stylish: AntdStylish
              appearance: Appearance
              isDarkMode: boolean
              css: EmotionInstance['css']
            }) => Record<string, string>)
        >,
      },
      customStylish: Function as PropType<(params: {
        token: FullToken
        stylish: AntdStylish
        appearance: Appearance
        isDarkMode: boolean
        css: EmotionInstance['css']
      }) => Record<string, string>>,
      onAppearanceChange: Function as PropType<(appearance: Appearance) => void>,
      onThemeModeChange: Function as PropType<(themeMode: ThemeMode) => void>,
      getStaticInstance: Function as PropType<(instances: StaticInstance) => void>,
      staticInstanceConfig: Object as PropType<{
        message?: Parameters<typeof useMessage>[0]
        notification?: Parameters<typeof useNotification>[0]
      }>,
    },
    emits: ['appearanceChange', 'themeModeChange'],
    setup(props, { slots, emit }) {
      const parentModeCtx = inject(themeModeKey, undefined) as ThemeModeContext | undefined
      const parentThemeCtx = inject(themeContextKey, undefined)
      const antdvConfig = useAntdvConfig()
      const emotion = inject(styleEngineKey, defaultEmotion)
      const prefixCls = computed(() => (
        props.prefixCls
        ?? parentThemeCtx?.prefixCls.value
        ?? defaults?.prefixCls
        ?? antdvConfig.value.getPrefixCls?.()
        ?? DEFAULT_PREFIX_CLS
      ))
      const iconPrefixCls = computed(() => (
        props.iconPrefixCls
        ?? parentThemeCtx?.iconPrefixCls.value
        ?? defaults?.iconPrefixCls
        ?? antdvConfig.value.iconPrefixCls
        ?? DEFAULT_ICON_PREFIX_CLS
      ))

      const internalThemeMode = ref<ThemeMode | undefined>(props.defaultThemeMode)
      const internalAppearance = ref<Appearance | undefined>(
        props.defaultAppearance,
      )
      const effectiveThemeMode = computed<ThemeMode>(() => (
        props.themeMode
        ?? internalThemeMode.value
        ?? parentModeCtx?.themeMode.value
        ?? 'light'
      ))
      const hasLocalThemeMode = computed(() => (
        props.themeMode !== undefined || internalThemeMode.value !== undefined
      ))

      const canMatchMedia = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      const browserPrefers = ref<BrowserPrefers>(
        canMatchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      )
      let mediaQuery: MediaQueryList | null = null
      let mediaHandler: ((event: MediaQueryListEvent) => void) | null = null

      onMounted(() => {
        if (!canMatchMedia) return
        mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        browserPrefers.value = mediaQuery.matches ? 'dark' : 'light'
        mediaHandler = (event) => {
          browserPrefers.value = event.matches ? 'dark' : 'light'
        }
        mediaQuery.addEventListener('change', mediaHandler)
      })

      onUnmounted(() => {
        if (mediaQuery && mediaHandler) mediaQuery.removeEventListener('change', mediaHandler)
      })

      const computedAppearance = computed<Appearance>(() => {
        if (props.appearance !== undefined) return props.appearance
        if (internalAppearance.value !== undefined) return internalAppearance.value
        if (!hasLocalThemeMode.value && parentModeCtx) return parentModeCtx.appearance.value
        return effectiveThemeMode.value === 'auto' ? browserPrefers.value : effectiveThemeMode.value
      })
      const isDarkMode = computed(() => computedAppearance.value === 'dark')

      let pendingAppearance: Appearance | undefined
      let pendingThemeMode: ThemeMode | undefined
      const setAppearance = (appearance: Appearance) => {
        if (props.appearance !== undefined) {
          pendingAppearance = appearance
          if (appearance !== computedAppearance.value) emit('appearanceChange', appearance)
        } else {
          internalAppearance.value = appearance
        }
      }
      const setThemeMode = (mode: ThemeMode) => {
        if (props.themeMode !== undefined) {
          if (mode === effectiveThemeMode.value) {
            internalAppearance.value = undefined
            pendingThemeMode = undefined
          } else {
            pendingThemeMode = mode
            emit('themeModeChange', mode)
          }
        } else {
          internalThemeMode.value = mode
          internalAppearance.value = undefined
        }
      }

      watch(computedAppearance, (value, previous) => {
        if (value !== previous && value !== pendingAppearance) {
          emit('appearanceChange', value)
        }
        pendingAppearance = undefined
      })
      watch(effectiveThemeMode, (value, previous) => {
        if (value === pendingThemeMode) {
          internalAppearance.value = undefined
        } else if (value !== previous) {
          emit('themeModeChange', value)
        }
        pendingThemeMode = undefined
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

      const resolvedAntdvTheme = computed<ThemeConfig>(() => {
        const configured = typeof props.theme === 'function'
          ? props.theme(computedAppearance.value)
          : props.theme
        const baseAlgorithm = isDarkMode.value ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm
        const configuredAlgorithms = configured?.algorithm
          ? Array.isArray(configured.algorithm) ? configured.algorithm : [configured.algorithm]
          : []

        return {
          ...configured,
          // Component CSS must be isolated when providers use different variable prefixes.
          hashed: configured?.hashed ?? antdvConfig.value.theme?.hashed ?? true,
          cssVar: defaults?.cssVarPrefix === undefined
            ? configured?.cssVar
            : { prefix: defaults.cssVarPrefix, ...configured?.cssVar },
          algorithm: configuredAlgorithms.length > 0
            ? [baseAlgorithm, ...configuredAlgorithms]
            : baseAlgorithm,
        }
      })

      const ThemeContent = defineComponent({
        name: 'AntdvStyleThemeContent',
        setup() {
          const effectiveConfig = useAntdvConfig()
          const tokenResult = antdTheme.useToken()
          const antdToken = computed<AntdToken>(() => ({
            ...tokenResult.token.value,
            ...resolvedAntdvTheme.value.token,
          }))
          const cssVar = computed(() => createCSSVarProxy({
            prefix: effectiveConfig.value.theme?.cssVar?.prefix
              ?? DEFAULT_CSS_VAR_PREFIX,
          }))

          const inheritedCustomToken = computed<Record<string, unknown>>(() => {
            const inherited: Record<string, unknown> = { ...defaults?.customToken }
            if (!parentThemeCtx) return inherited
            if (parentThemeCtx.customToken) {
              return { ...inherited, ...parentThemeCtx.customToken.value }
            }

            // Backward-compatible fallback for contexts created by an older package copy.
            const parentTheme = parentThemeCtx.theme.value
            const parentAntdToken = parentThemeCtx.antdToken.value
            for (const key of Object.keys(parentTheme)) {
              if (!(key in parentAntdToken) && !themeStateKeys.has(key)) {
                inherited[key] = parentTheme[key as keyof Theme]
              }
            }
            return inherited
          })

          const resolvedCustomToken = computed<Record<string, unknown>>(() => {
            const current = typeof props.customToken === 'function'
              ? props.customToken({
                  token: antdToken.value,
                  appearance: computedAppearance.value,
                  isDarkMode: isDarkMode.value,
                })
              : props.customToken ?? {}
            return { ...inheritedCustomToken.value, ...current }
          })

          const antdStylish = computed<AntdStylish>(() => ({
            buttonDefaultHover: emotion.css({
              backgroundColor: antdToken.value.colorBgContainer,
              border: `1px solid ${antdToken.value.colorBorder}`,
              cursor: 'pointer',
              ':hover': {
                color: antdToken.value.colorPrimaryHover,
                borderColor: antdToken.value.colorPrimaryHover,
              },
              ':active': {
                color: antdToken.value.colorPrimaryActive,
                borderColor: antdToken.value.colorPrimaryActive,
              },
            }),
          }))

          const resolvedStylish = computed<FullStylish>(() => {
            const stylishFactory = props.customStylish
              ?? (typeof props.stylish === 'function' ? props.stylish : undefined)
            const custom = stylishFactory
              ? stylishFactory({
                  token: { ...antdToken.value, ...resolvedCustomToken.value } as FullToken,
                  stylish: antdStylish.value,
                  appearance: computedAppearance.value,
                  isDarkMode: isDarkMode.value,
                  css: emotion.css,
                })
              : typeof props.stylish === 'object' ? props.stylish : {}
            return {
              ...(parentThemeCtx?.theme.value.stylish ?? {}),
              ...custom,
              ...antdStylish.value,
            } as FullStylish
          })

          const theme = computed<Theme>(() => ({
            ...antdToken.value,
            ...resolvedCustomToken.value,
            stylish: resolvedStylish.value,
            appearance: computedAppearance.value,
            isDarkMode: isDarkMode.value,
            themeMode: effectiveThemeMode.value,
            browserPrefers: browserPrefers.value,
            prefixCls: prefixCls.value,
            iconPrefixCls: iconPrefixCls.value,
          }) as Theme)

          provide(themeContextKey, {
            theme,
            antdToken,
            customToken: resolvedCustomToken,
            prefixCls,
            iconPrefixCls,
            cssVar,
          })

          const [messageApi, messageHolder] = useMessage(props.staticInstanceConfig?.message)
          const [notificationApi, notificationHolder] = useNotification(props.staticInstanceConfig?.notification)
          const [modalApi, ModalHolder] = useModal()

          onMounted(() => {
            props.getStaticInstance?.({
              message: messageApi,
              notification: notificationApi,
              modal: modalApi,
            })
          })

          return () => [
            messageHolder(),
            notificationHolder(),
            h(ModalHolder),
            ...(slots.default?.() ?? []),
          ] as VNodeChild
        },
      })

      return () => h(
        ConfigProvider,
        {
          prefixCls: prefixCls.value,
          iconPrefixCls: iconPrefixCls.value,
          theme: resolvedAntdvTheme.value,
        },
        { default: () => h(ThemeContent) },
      )
    },
  })
}
