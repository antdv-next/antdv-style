import { reactive, onMounted, onUnmounted } from 'vue'
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

// matchMedia queries matching antdv-next's getResponsiveMap():
// xs uses max-width, all others use min-width
// Device aliases share queries with their corresponding breakpoints
const mediaQueries: Record<keyof ResponsiveState, string> = {
  xs: `(max-width: ${bp.xsMax}px)`,
  sm: `(min-width: ${bp.sm}px)`,
  md: `(min-width: ${bp.md}px)`,
  lg: `(min-width: ${bp.lg}px)`,
  xl: `(min-width: ${bp.xl}px)`,
  xxl: `(min-width: ${bp.xxl}px)`,
  mobile: `(max-width: ${bp.xsMax}px)`,
  tablet: `(min-width: ${bp.md}px)`,
  laptop: `(min-width: ${bp.lg}px)`,
  desktop: `(min-width: ${bp.xxl}px)`,
}

// Shared singleton state
let sharedState: ResponsiveState | null = null
let subscriberCount = 0
let cleanupListeners: (() => void) | null = null

function getOrCreateSharedState(): ResponsiveState {
  if (sharedState) return sharedState

  sharedState = reactive<ResponsiveState>({
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
  })

  return sharedState
}

function setupListeners(state: ResponsiveState): void {
  if (!isBrowser || typeof window.matchMedia !== 'function') return
  if (cleanupListeners) return

  const removers: (() => void)[] = []

  for (const [key, query] of Object.entries(mediaQueries)) {
    const mql = window.matchMedia(query)
    state[key as keyof ResponsiveState] = mql.matches

    const handler = (e: MediaQueryListEvent) => {
      state[key as keyof ResponsiveState] = e.matches
    }

    mql.addEventListener('change', handler)
    removers.push(() => mql.removeEventListener('change', handler))
  }

  cleanupListeners = () => {
    removers.forEach((fn) => fn())
    cleanupListeners = null
  }
}

function teardownIfEmpty(): void {
  if (subscriberCount <= 0 && cleanupListeners) {
    cleanupListeners()
  }
}

/** @internal Reset singleton state — only for testing */
export function _resetResponsiveForTesting(): void {
  if (cleanupListeners) {
    cleanupListeners()
  }
  sharedState = null
  subscriberCount = 0
  cleanupListeners = null
}

export function useResponsive(): ResponsiveState {
  const state = getOrCreateSharedState()

  onMounted(() => {
    subscriberCount++
    setupListeners(state)
  })

  onUnmounted(() => {
    subscriberCount--
    teardownIfEmpty()
  })

  return state
}
