import { inject, type ComputedRef } from 'vue'
import { ThemeContextKey } from '../context'
import type { ContextKeys } from '../context'
import type { Theme } from '../types'

export function makeUseTheme(keys?: ContextKeys) {
  const key = keys?.themeContextKey ?? ThemeContextKey
  return function useTheme(): ComputedRef<Theme> {
    const ctx = inject(key)
    if (!ctx) {
      throw new Error('useTheme() must be used within a <ThemeProvider>')
    }
    return ctx.theme
  }
}

export const useTheme = makeUseTheme()
