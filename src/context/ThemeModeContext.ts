import type { InjectionKey, Ref, ComputedRef } from 'vue'
import type { ThemeMode, Appearance, BrowserPrefers } from '../types'

export interface ThemeModeContext {
  themeMode: Readonly<Ref<ThemeMode>>
  appearance: ComputedRef<Appearance>
  isDarkMode: ComputedRef<boolean>
  browserPrefers: Ref<BrowserPrefers>
  setAppearance: (appearance: Appearance) => void
  setThemeMode: (themeMode: ThemeMode) => void
}

export const ThemeModeKey: InjectionKey<ThemeModeContext> = Symbol('ThemeModeKey')
