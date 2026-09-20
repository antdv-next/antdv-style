import { computed, reactive, onMounted, onUnmounted, watch } from 'vue'
import { theme } from 'antdv-next'
import { isBrowser } from '../utils/env'
import { breakpoints as bp } from '../utils/responsive'

/**
 * Reactive breakpoint state matching antdv-next's responsiveObserver semantics.
 *
 * - `xs`: true when viewport ≤ screenXSMax (max-width)
 * - `sm` ~ `xxl`: true when viewport ≥ that breakpoint's min value (min-width)
 *
 * On a 1024px screen: xs=false, sm=true, md=true, lg=true, xl=false, xxl=false
 */
export interface ResponsiveState {
  xs: boolean
  sm: boolean
  md: boolean
  lg: boolean
  xl: boolean
  xxl: boolean
  // Device aliases
  mobile: boolean
  tablet: boolean
  laptop: boolean
  desktop: boolean
}

function emptyState(): ResponsiveState {
  return {
    xs: false,
    sm: false,
    md: false,
    lg: false,
    xl: false,
    xxl: false,
    mobile: false,
    tablet: false,
    laptop: false,
    desktop: false,
  }
}

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
const aliases: Partial<Record<Breakpoint, keyof ResponsiveState>> = {
  xs: 'mobile', md: 'tablet', lg: 'laptop', xxl: 'desktop',
}
interface Subscription {
  state: ResponsiveState
  subscribers: Set<ResponsiveState>
  dispose: () => void
}
const subscriptions = new Map<string, Subscription>()

function createSubscription(queries: Record<Breakpoint, string>): Subscription {
  const state = emptyState()
  const subscribers = new Set<ResponsiveState>()
  const removers: (() => void)[] = []
  for (const key of Object.keys(queries) as Breakpoint[]) {
    const query = queries[key]
    const mql = window.matchMedia(query)
    const handler = (e: Pick<MediaQueryListEvent, 'matches'>) => {
      state[key] = e.matches
      const alias = aliases[key]
      if (alias) state[alias] = e.matches
      subscribers.forEach(subscriber => Object.assign(subscriber, state))
    }
    handler(mql)
    mql.addEventListener('change', handler)
    removers.push(() => mql.removeEventListener('change', handler))
  }
  return { state, subscribers, dispose: () => removers.forEach(remove => remove()) }
}

/** @internal Reset shared subscriptions only for testing. */
export function _resetResponsiveForTesting(): void {
  subscriptions.forEach(entry => entry.dispose())
  subscriptions.clear()
}

export function useResponsive(): ResponsiveState {
  const { token } = theme.useToken()
  const state = reactive(emptyState())
  const queries = computed<Record<Breakpoint, string>>(() => ({
    xs: `(max-width: ${token.value.screenXSMax ?? bp.xsMax}px)`,
    sm: `(min-width: ${token.value.screenSM ?? bp.sm}px)`,
    md: `(min-width: ${token.value.screenMD ?? bp.md}px)`,
    lg: `(min-width: ${token.value.screenLG ?? bp.lg}px)`,
    xl: `(min-width: ${token.value.screenXL ?? bp.xl}px)`,
    xxl: `(min-width: ${token.value.screenXXL ?? bp.xxl}px)`,
  }))
  let stop: (() => void) | undefined

  onMounted(() => {
    if (!isBrowser || typeof window.matchMedia !== 'function') return
    stop = watch(() => JSON.stringify(queries.value), (key, _previous, onCleanup) => {
      let entry = subscriptions.get(key)
      if (!entry) {
        entry = createSubscription(queries.value)
        subscriptions.set(key, entry)
      }
      const current = entry
      current.subscribers.add(state)
      Object.assign(state, current.state)
      onCleanup(() => {
        current.subscribers.delete(state)
        if (!current.subscribers.size && subscriptions.get(key) === current) {
          current.dispose()
          subscriptions.delete(key)
        }
      })
    }, { immediate: true })
  })
  onUnmounted(() => stop?.())
  return state
}
