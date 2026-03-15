import { inject, computed, type ComputedRef } from 'vue'
import { ThemeContextKey } from '../context'
import type { ContextKeys } from '../context'
import type { AntdToken } from '../types'

/**
 * AntdTheme matches upstream: token fields are spread at top level + stylish.
 * Upstream: `interface AntdTheme extends AntdToken { stylish: AntdStylish }`
 */
export type AntdTheme = AntdToken & {
  stylish: Record<string, string>
}

export function makeUseAntdTheme(keys?: ContextKeys) {
  const themeKey = keys?.themeContextKey ?? ThemeContextKey

  return function useAntdTheme(): ComputedRef<AntdTheme> {
    const themeCtx = inject(themeKey)
    if (!themeCtx) {
      throw new Error('useAntdTheme() must be used within a <ThemeProvider>')
    }

    return computed(() => ({
      ...themeCtx.antdToken.value,
      stylish: themeCtx.theme.value.stylish,
    }))
  }
}

export const useAntdTheme = makeUseAntdTheme()
