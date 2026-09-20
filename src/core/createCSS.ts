import { serializeStyles } from '@emotion/serialize'
import { getRegisteredStyles, registerStyles } from '@emotion/utils'
import type {
  ClassNamesArg,
  CSSInterpolation,
  EmotionCache,
} from '@emotion/css/create-instance'

export interface CreateCSSOptions {
  hashPriority?: 'high' | 'low'
  label?: string
}

type ClassNameGenerator = (...args: CSSInterpolation[]) => string

const isBrowser = typeof document !== 'undefined'

function classNames(args: ClassNamesArg[]): string {
  let result = ''

  for (const arg of args) {
    if (arg == null || typeof arg === 'boolean') continue

    let value = ''
    if (Array.isArray(arg)) {
      value = classNames(arg)
    } else if (typeof arg === 'object') {
      value = Object.keys(arg).filter((key) => arg[key]).join(' ')
    } else {
      value = String(arg)
    }

    if (value) result += result ? ` ${value}` : value
  }

  return result
}

function mergeRegisteredStyles(
  cache: EmotionCache,
  css: ClassNameGenerator,
  className: string,
): string {
  const registeredStyles: string[] = []
  const rawClassName = getRegisteredStyles(cache.registered, registeredStyles, className)

  if (registeredStyles.length < 2) return className
  return `${rawClassName}${css(registeredStyles)}`
}

export function createCSS(cache: EmotionCache, options: CreateCSSOptions = {}) {
  const css: ClassNameGenerator = (...args) => {
    const baseSerialized = serializeStyles(
      options.label ? [...args, `label:${options.label};`] : args,
      cache.registered,
      undefined,
    )
    const serialized = options.hashPriority === 'low'
      ? { ...baseSerialized, name: `low-${baseSerialized.name}` }
      : baseSerialized
    const className = `${cache.key}-${serialized.name}`
    const selector = options.hashPriority === 'low'
      ? `:where(.${className})`
      : `.${className}`

    registerStyles(cache, serialized, false)

    if (cache.inserted[serialized.name] === undefined) {
      let current = serialized
      let stylesForSsr = ''

      do {
        const inserted = cache.insert(
          current === serialized ? selector : '',
          current,
          cache.sheet,
          true,
        )
        if (!isBrowser && inserted !== undefined) stylesForSsr += inserted
        current = current.next!
      } while (current !== undefined)

      if (!isBrowser && stylesForSsr) cache.inserted[serialized.name] = stylesForSsr
    }

    return className
  }

  const cx = (...args: ClassNamesArg[]) => {
    const className = classNames(args)
    return mergeRegisteredStyles(cache, css, className)
  }

  return { css, cx }
}
