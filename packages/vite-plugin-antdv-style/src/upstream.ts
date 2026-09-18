import { createRequire } from 'node:module'
import { resolve, sep } from 'node:path'
import { parse } from '@babel/parser'
import traverseModule, { type NodePath } from '@babel/traverse'

const require = createRequire(import.meta.url)
const { default: createPlugin } = require('babel-plugin-antd-style') as {
  default: () => {
    visitor?: { CallExpression: (path: NodePath, state: unknown) => void }
  }
}
const traverse =
  (traverseModule as unknown as { default?: typeof traverseModule }).default ?? traverseModule

/** Run the pinned upstream visitor on an isolated call, not arbitrary user bindings. */
export function upstreamPathLabel(relativeFilename: string): string {
  const visitor = createPlugin().visitor
  if (!visitor) {
    // Explicit devOnly:false works without changing the process-wide environment.
    return relativeFilename.split('/').map(part => part.split('.')[0])
      .filter(part => part && !['src', 'index', '.', '..'].includes(part)).join('-')
  }
  const ast = parse('createStyles(() => ({}))')
  const virtualRoot = resolve(sep)
  let label = ''
  traverse(ast, {
    CallExpression(path) {
      visitor.CallExpression(path, {
        file: { opts: { root: virtualRoot, filename: resolve(virtualRoot, relativeFilename.split('/').join(sep)) } },
      })
      const options = path.node.arguments[1]
      if (options?.type !== 'ObjectExpression') return
      const property = options.properties.find(item => item.type === 'ObjectProperty'
        && item.key.type === 'Identifier' && item.key.name === '__BABEL_FILE_NAME__')
      if (property?.type === 'ObjectProperty' && property.value.type === 'StringLiteral') {
        label = property.value.value
      }
      path.skip()
    },
  })
  return label
}
