/**
 * Mock for antdv-next used in test environment.
 * Matches the real theme.useToken() return: { theme, token, hashId }
 */
import { computed, inject, provide, ref, type Ref } from 'vue'

interface ConfigContext {
  getPrefixCls?: (suffixCls?: string, customizePrefixCls?: string) => string
  iconPrefixCls?: string
  theme?: { hashed?: boolean; cssVar?: { prefix?: string } }
}

const ConfigConsumerKey = Symbol('MockConfigConsumer')

export function useConfig(): Ref<ConfigContext> {
  return inject(ConfigConsumerKey, ref({
    getPrefixCls: (suffixCls = '', customizePrefixCls?: string) => {
      const base = customizePrefixCls ?? 'ant'
      return suffixCls ? `${base}-${suffixCls}` : base
    },
    iconPrefixCls: 'anticon',
  }))
}

export const theme = {
  useToken() {
    return {
      theme: ref({}),
      token: ref<Record<string, unknown>>({}),
      hashId: ref(''),
    }
  },
  darkAlgorithm: () => ({}),
  defaultAlgorithm: () => ({}),
}

export const ConfigProvider = {
  name: 'ConfigProvider',
  props: ['prefixCls', 'iconPrefixCls', 'theme'],
  setup(props: { prefixCls?: string; iconPrefixCls?: string; theme?: ConfigContext['theme'] }, { slots }: { slots: { default?: () => unknown } }) {
    const parent = useConfig()
    provide(ConfigConsumerKey, computed(() => {
      const prefix = props.prefixCls ?? parent.value.getPrefixCls?.() ?? 'ant'
      return {
        ...parent.value,
        getPrefixCls: (suffixCls = '', customizePrefixCls?: string) => {
          const base = customizePrefixCls ?? prefix
          return suffixCls ? `${base}-${suffixCls}` : base
        },
        iconPrefixCls: props.iconPrefixCls ?? parent.value.iconPrefixCls ?? 'anticon',
        theme: {
          ...parent.value.theme,
          ...props.theme,
          cssVar: {
            prefix,
            ...parent.value.theme?.cssVar,
            ...props.theme?.cssVar,
          },
        },
      }
    }))
    return () => slots.default?.()
  },
}

export const useMessage = () => [{}, () => null] as const
export const useNotification = () => [{}, () => null] as const
export const useModal = () => [{}, { name: 'ModalHolder', render: () => null }] as const
