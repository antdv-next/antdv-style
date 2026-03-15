export interface Px2RemOptions {
  /** Base font size in px, default 16 */
  rootValue?: number
  /** Decimal precision, default 5 */
  precision?: number
  /** Minimum px value to convert, default 0 */
  minPixelValue?: number
}

export function px2remTransformer(options?: Px2RemOptions) {
  const { rootValue = 16, precision = 5, minPixelValue = 0 } = options ?? {}

  const pxRegex = /(\d*\.?\d+)px/g

  return function transform(css: string): string {
    return css.replace(pxRegex, (match, pxValue) => {
      const px = parseFloat(pxValue)
      if (px < minPixelValue) return match
      const rem = (px / rootValue).toFixed(precision)
      // Remove trailing zeros
      return `${parseFloat(rem)}rem`
    })
  }
}
