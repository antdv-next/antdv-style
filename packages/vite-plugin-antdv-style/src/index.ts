import { parse as parseJavaScript, type ParserPlugin } from '@babel/parser'
import traverseModule from '@babel/traverse'
import { parse as parseSfc } from '@vue/compiler-sfc'
import MagicString from 'magic-string'
import { posix } from 'node:path'
import { upstreamPathLabel } from './upstream'

const traverse =
  (traverseModule as unknown as { default?: typeof traverseModule }).default ?? traverseModule

interface AstNode {
  type: string
  start?: number | null
  end?: number | null
  [key: string]: unknown
}

export interface StyleLabelPluginOptions {
  include?: RegExp
  exclude?: RegExp
  importSources?: string[]
  /** The Vite plugin defaults to path labels; standalone transforms retain variable labels. */
  labelFormat?: 'variable' | 'path'
  root?: string
  /** Skip production/build transformations by default. */
  devOnly?: boolean
}

export interface StyleLabelTransformResult {
  code: string
  map: ReturnType<MagicString['generateMap']>
}

function matches(pattern: RegExp, value: string) {
  pattern.lastIndex = 0
  const result = pattern.test(value)
  pattern.lastIndex = 0
  return result
}

function propertyName(node: AstNode | undefined): string | undefined {
  if (!node) return undefined
  if (node.type === 'Identifier') return node.name as string
  if (node.type === 'StringLiteral') return node.value as string
  return undefined
}

function transformScript(
  source: string,
  magicString: MagicString,
  offset: number,
  importSources: Set<string>,
  lang: string,
  labelPrefix: string,
  pathLabels: boolean,
): number {
  const plugins: ParserPlugin[] = ['decorators-legacy', 'importAttributes']
  if (/^(?:[cm]?ts|tsx)$/.test(lang)) plugins.push('typescript')
  if (/^[jt]sx$/.test(lang)) plugins.push('jsx')
  const ast = parseJavaScript(source, {
    sourceType: 'module',
    createParenthesizedExpressions: true,
    plugins,
  })
  let changes = 0

  traverse(ast, {
    CallExpression(path) {
      const callee = path.get('callee')
      const declarationId = path.parentPath.isVariableDeclarator() ? path.parentPath.node.id : undefined
      if (!callee.isIdentifier()) return
      if (!pathLabels && declarationId?.type !== 'Identifier') return

      const binding = path.scope.getBinding(callee.node.name)
      if (!binding?.path.isImportSpecifier()) return
      const importDeclaration = binding.path.parentPath
      if (!importDeclaration?.isImportDeclaration()) return
      if (binding.path.node.importKind === 'type' || importDeclaration.node.importKind === 'type')
        return
      if (propertyName(binding.path.node.imported as unknown as AstNode) !== 'createStyles') return
      if (!importSources.has(importDeclaration.node.source.value)) return

      const args = path.node.arguments
      const variable = declarationId?.type === 'Identifier' ? declarationId.name : ''
      const label = [labelPrefix, variable].filter(Boolean).join('-') || 'styles'
      if (args.length === 1 && args[0].end != null) {
        magicString.appendLeft(offset + args[0].end, `, { label: ${JSON.stringify(label)} }`)
        changes++
        return
      }

      const options = args[1]
      if (args.length !== 2 || options?.type !== 'ObjectExpression' || options.end == null) return
      const properties = options.properties
      if (properties.some(property => property.type === 'SpreadElement' || property.computed)) return
      const hasLabel = properties.some(
        property =>
          (property.type === 'ObjectProperty' || property.type === 'ObjectMethod') &&
          propertyName(property.key as unknown as AstNode) === 'label',
      )
      if (hasLabel) return

      const insertionPoint =
        properties.length > 0
          ? properties[properties.length - 1].end
          : options.start != null
            ? options.start + 1
            : options.end - 1
      if (insertionPoint == null) return
      const separator = properties.length > 0 ? ', ' : ''
      magicString.appendLeft(offset + insertionPoint, `${separator}label: ${JSON.stringify(label)}`)
      changes++
    },
  })

  return changes
}

export function transformStyleLabels(
  code: string,
  id: string,
  options: StyleLabelPluginOptions = {},
): StyleLabelTransformResult | null {
  const cleanId = id.split('?', 1)[0].replace(/\\/g, '/')
  if (cleanId.includes('/node_modules/') || cleanId.includes('\0')) return null
  if (options.exclude && matches(options.exclude, cleanId)) return null
  if (options.include && !matches(options.include, cleanId)) return null
  if (!/\.(?:[cm]?[jt]sx?|vue)$/.test(cleanId)) return null
  let labelPrefix = ''
  if (options.labelFormat === 'path') {
    const relative = posix.relative((options.root ?? process.cwd()).replace(/\\/g, '/'), cleanId)
    if (relative.startsWith('../') || posix.isAbsolute(relative)) return null
    labelPrefix = upstreamPathLabel(relative).replace(/[^a-zA-Z0-9_-]/g, '-')
  }

  const magicString = new MagicString(code)
  const importSources = new Set(options.importSources ?? ['antdv-style'])
  let changes = 0

  if (cleanId.endsWith('.vue')) {
    const { descriptor, errors } = parseSfc(code, { filename: cleanId })
    if (errors.length > 0) return null
    for (const block of [descriptor.script, descriptor.scriptSetup]) {
      if (!block) continue
      changes += transformScript(block.content, magicString, block.loc.start.offset, importSources, block.lang ?? 'js', labelPrefix, options.labelFormat === 'path')
    }
  } else {
    changes += transformScript(code, magicString, 0, importSources, cleanId.slice(cleanId.lastIndexOf('.') + 1), labelPrefix, options.labelFormat === 'path')
  }

  if (changes === 0) return null
  return {
    code: magicString.toString(),
    map: magicString.generateMap({ source: cleanId, includeContent: true, hires: true }),
  }
}

export function antdvStyleLabel(options: StyleLabelPluginOptions = {}) {
  let enabled = true
  let root = options.root ?? process.cwd()
  return {
    name: 'vite-plugin-antdv-style',
    enforce: 'pre' as const,
    configResolved(config: { command: string; root: string; isProduction: boolean }) {
      root = options.root ?? config.root
      enabled = options.devOnly === false || (config.command === 'serve' && !config.isProduction)
    },
    transform(code: string, id: string) {
      if (!enabled) return null
      return transformStyleLabels(code, id, { labelFormat: 'path', ...options, root })
    },
  }
}

export default antdvStyleLabel
