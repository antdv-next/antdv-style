declare module 'postcss-less' {
  import type { Root, Stringifier } from 'postcss'

  interface PostcssLessSyntax {
    parse(source: string, options?: Record<string, unknown>): Root
    stringify: Stringifier
  }

  const syntax: PostcssLessSyntax
  export default syntax
}
