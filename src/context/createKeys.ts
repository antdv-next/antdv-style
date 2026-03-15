import type { InjectionKey } from 'vue'
import type { EmotionInstance } from '../core'
import type { ThemeModeContext } from './ThemeModeContext'
import type { ThemeContext } from './ThemeContext'

export interface ContextKeys {
  styleEngineKey: InjectionKey<EmotionInstance>
  themeModeKey: InjectionKey<ThemeModeContext>
  themeContextKey: InjectionKey<ThemeContext>
}

export function createContextKeys(): ContextKeys {
  return {
    styleEngineKey: Symbol('StyleEngineKey') as InjectionKey<EmotionInstance>,
    themeModeKey: Symbol('ThemeModeKey') as InjectionKey<ThemeModeContext>,
    themeContextKey: Symbol('ThemeContextKey') as InjectionKey<ThemeContext>,
  }
}
