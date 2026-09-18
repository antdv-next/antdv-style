import { parse } from 'postcss'
import valueParser from 'postcss-value-parser'
import { px2remTransformer as componentPx2rem } from '@antdv-next/cssinjs'
import type { Transformer } from '@antdv-next/cssinjs'
import unitlessModule from '@emotion/unitless'

const unitless = (unitlessModule as unknown as { default?: typeof unitlessModule }).default ?? unitlessModule

export interface Px2RemOptions {
  /** Base font size in px, default 16 */
  rootValue?: number
  /** Decimal precision, default 5 */
  precision?: number
  /** Minimum px value to convert, default 0 */
  minPixelValue?: number
  /** Convert query parameters. Object visitor defaults to false; legacy string API defaults to true. */
  mediaQuery?: boolean
}

export function px2remTransformer(options?: Px2RemOptions) {
  const { rootValue = 16, precision = 5, minPixelValue = 0 } = options ?? {}

  const transformValue = (value: string) => {
    const parsed = valueParser(value)
    parsed.walk((node) => {
      if (node.type === 'function' && node.value.toLowerCase() === 'url') return false
      if (node.type !== 'word') return
      const dimension = valueParser.unit(node.value)
      if (!dimension || dimension.unit.toLowerCase() !== 'px') return
      const px = Number(dimension.number)
      if (!Number.isFinite(px) || Math.abs(px) < minPixelValue) return
      const rem = (px / rootValue).toFixed(precision)
      node.value = `${parseFloat(rem)}rem`
    })
    return valueParser.stringify(parsed.nodes)
  }

  const transform = (css: string): string => {
    let root
    try {
      root = parse(css, { from: undefined })
    } catch {
      return css
    }
    root.walkDecls((declaration) => {
      declaration.value = transformValue(declaration.value)
    })
    root.walkAtRules(/^(media|supports|container)$/i, (rule) => {
      if (options?.mediaQuery !== false) rule.params = transformValue(rule.params)
    })
    return root.toString()
  }
  // Reuse the component library visitor; cssinjs owns recursive traversal.
  const objectVisitor = componentPx2rem(options).visit!
  const visit: NonNullable<Transformer['visit']> = (styles) => {
    const converted = objectVisitor(styles)
    // Some native-ESM SSR loaders expose cssinjs's older unitless CJS dependency
    // as a namespace. Preserve the canonical unitless properties across loaders.
    for (const [property, value] of Object.entries(styles)) {
      if (unitless[property] && typeof value === 'number') converted[property] = value
    }
    return converted
  }
  return Object.assign(transform, { visit })
}
