import { inject } from 'vue'
import { ThemeModeKey } from '../context'
import type { ContextKeys, ThemeModeContext } from '../context'

export function makeUseThemeMode(keys?: ContextKeys) {
  const key = keys?.themeModeKey ?? ThemeModeKey
  return function useThemeMode(): ThemeModeContext {
    const ctx = inject(key)
    if (!ctx) {
      throw new Error('useThemeMode() must be used within a <ThemeProvider>')
    }
    return ctx
  }
}

export const useThemeMode = makeUseThemeMode()
