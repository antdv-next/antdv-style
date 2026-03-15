import type { InjectionKey, ComputedRef, Ref } from 'vue'
import type { AntdToken, Theme } from '../types'

export interface ThemeContext {
  theme: ComputedRef<Theme>
  antdToken: ComputedRef<AntdToken>
  prefixCls: Readonly<Ref<string>>
  iconPrefixCls: Readonly<Ref<string>>
  cssVar: ComputedRef<Record<string, string>>
}

export const ThemeContextKey: InjectionKey<ThemeContext> = Symbol('ThemeContextKey')
