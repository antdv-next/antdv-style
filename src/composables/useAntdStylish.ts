import { inject, computed, type ComputedRef } from 'vue'
import { ThemeContextKey } from '../context'
import type { ContextKeys } from '../context'
import type { FullStylish } from '../types'

export function makeUseAntdStylish(keys?: ContextKeys) {
  const key = keys?.themeContextKey ?? ThemeContextKey
  return function useAntdStylish(): ComputedRef<FullStylish> {
    const ctx = inject(key)
    if (!ctx) {
      throw new Error('useAntdStylish() must be used within a <ThemeProvider>')
    }
    return computed(() => ctx.theme.value.stylish)
  }
}

export const useAntdStylish = makeUseAntdStylish()
