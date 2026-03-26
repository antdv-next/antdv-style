import { DEFAULT_CSS_VAR_PREFIX } from '../core/constants'

export interface CSSVarOptions {
  prefix?: string
}

/**
 * Convert camelCase token key to kebab-case CSS variable name.
 * Matches upstream antd-style's toKebabCase:
 * - colorPrimary → color-primary
 * - paddingLG → padding-lg
 * - screenXSMax → screen-xs-max
 * - yellow1 → yellow-1
 * - blue10 → blue-10
 */
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([a-z])(\d)/g, '$1-$2')
    .replace(/(\d)([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

function tokenKeyToCSSVarName(key: string, prefix: string): string {
  return `--${prefix}-${toKebabCase(key)}`
}

/**
 * Generate CSS variable declarations from a token object.
 * Default prefix is 'ant' to match antdv-next's CSS variable prefix.
 */
export function tokenToCSSVar(token: Record<string, unknown>, options?: CSSVarOptions): string {
  const prefix = options?.prefix ?? DEFAULT_CSS_VAR_PREFIX
  const declarations: string[] = []

  for (const [key, value] of Object.entries(token)) {
    if (key.startsWith('_') || key.includes('-') || typeof value === 'object' || typeof value === 'function') {
      continue
    }
    const varName = tokenKeyToCSSVarName(key, prefix)
    declarations.push(`${varName}: ${value as string | number | boolean};`)
  }

  return declarations.join('\n')
}

/**
 * Create a proxy object that maps token keys to CSS `var()` references.
 * Default prefix is 'ant' to match antdv-next's CSS variable prefix.
 *
 * Usage: `cssVar.colorPrimary` returns `var(--ant-color-primary)`
 *
 * When prefix is not 'ant', adds a fallback to the ant-prefixed variable:
 * `cssVar.colorPrimary` → `var(--my-prefix-color-primary, var(--ant-color-primary))`
 */
export function createCSSVarProxy(options?: CSSVarOptions): Record<string, string> {
  const prefix = options?.prefix ?? DEFAULT_CSS_VAR_PREFIX
  const needFallback = prefix !== DEFAULT_CSS_VAR_PREFIX

  return new Proxy({} as Record<string, string>, {
    get(_target, prop: string) {
      const kebab = toKebabCase(prop)
      if (needFallback) {
        return `var(--${prefix}-${kebab}, var(--${DEFAULT_CSS_VAR_PREFIX}-${kebab}))`
      }
      return `var(--${prefix}-${kebab})`
    },
  })
}
