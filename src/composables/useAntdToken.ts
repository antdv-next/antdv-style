import { inject, type ComputedRef } from 'vue'
import { ThemeContextKey } from '../context'
import type { ContextKeys } from '../context'
import type { AntdToken } from '../types'

export function makeUseAntdToken(keys?: ContextKeys) {
  const key = keys?.themeContextKey ?? ThemeContextKey
  return function useAntdToken(): ComputedRef<AntdToken> {
    const ctx = inject(key)
    if (!ctx) {
      throw new Error('useAntdToken() must be used within a <ThemeProvider>')
    }
    return ctx.antdToken
  }
}

export const useAntdToken = makeUseAntdToken()
