/**
 * Mock for antdv-next used in test environment.
 * Matches the real theme.useToken() return: { theme, token, hashId }
 */
import { ref } from 'vue'

export const theme = {
  useToken() {
    return {
      theme: ref({}),
      token: ref<Record<string, unknown>>({}),
      hashId: ref(''),
    }
  },
  darkAlgorithm: () => ({}),
}
