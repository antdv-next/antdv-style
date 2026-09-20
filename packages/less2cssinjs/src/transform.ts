import { parse as parseJavaScript } from '@babel/parser'
import traverseModule, { type NodePath } from '@babel/traverse'
import { baseParse, NodeTypes } from '@vue/compiler-dom'
import { compileTemplate, parse as parseSfc } from '@vue/compiler-sfc'
import MagicString from 'magic-string'
import { type AtRule, type ChildNode, type Container, type Declaration, type Rule } from 'postcss'
import postcssLess from 'postcss-less'
import selectorParser from 'postcss-selector-parser'
import valueParser from 'postcss-value-parser'
import { tokenExpression } from './tokens'

const traverse =
  (traverseModule as unknown as { default?: typeof traverseModule }).default ?? traverseModule

export interface CodemodDiagnostic {
  message: string
  line?: number
  column?: number
}

export interface LessTransformResult {
  styles: string
  classNames: string[]
  diagnostics: CodemodDiagnostic[]
}

export interface VueLessCodemodResult {
  code: string
  changed: boolean
  diagnostics: CodemodDiagnostic[]
}

function diagnostic(node: ChildNode, message: string): CodemodDiagnostic {
  return {
    message,
    line: node.source?.start?.line,
    column: node.source?.start?.column,
  }
}

function camelCaseProperty(property: string) {
  if (property.startsWith('--')) return property
  return property.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())
}

const supportedBlockAtRules = new Set(['container', 'layer', 'media', 'supports'])

// Only migrate values the browser can evaluate without Less or Vue's style compiler.
const supportedCssFunctions = new Set([
  'var', 'env', 'calc', 'min', 'max', 'clamp',
  'rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch',
  'color', 'color-mix', 'light-dark',
  'url', 'image-set', 'cross-fade', 'linear-gradient', 'radial-gradient', 'conic-gradient',
  'repeating-linear-gradient', 'repeating-radial-gradient', 'repeating-conic-gradient',
  'translate', 'translatex', 'translatey', 'translatez', 'translate3d',
  'scale', 'scalex', 'scaley', 'scalez', 'scale3d',
  'rotate', 'rotatex', 'rotatey', 'rotatez', 'rotate3d', 'skew', 'skewx', 'skewy',
  'matrix', 'matrix3d', 'perspective',
  'blur', 'brightness', 'contrast', 'drop-shadow', 'grayscale', 'hue-rotate',
  'invert', 'opacity', 'saturate', 'sepia',
  'cubic-bezier', 'steps', 'linear', 'repeat', 'minmax', 'fit-content',
  'attr', 'counter', 'counters', 'rect', 'inset', 'circle', 'ellipse', 'polygon', 'path',
])

export function hasUnresolvedAssetUrl(value: string): boolean {
  const needsResolution = (url: string) => !/^(?:https?:|data:|blob:|\/\/|#)/i.test(url.trim())
  let unresolved = false
  valueParser(value).walk((node) => {
    if (node.type !== 'function') return
    const name = node.value.toLowerCase()
    if (name === 'url') {
      const parts = node.nodes.filter(child => child.type !== 'space' && child.type !== 'comment')
      if (parts.length !== 1 || !['word', 'string'].includes(parts[0].type)
        || needsResolution(parts[0].value)) {
        unresolved = true
      }
      return false
    }
    if (name === 'image-set' || name === '-webkit-image-set') {
      if (node.nodes.some(child => child.type === 'string' && needsResolution(child.value))) {
        unresolved = true
      }
    }
  })
  return unresolved
}

export function unsupportedValue(value: string): boolean {
  let unsupported = false
  const parsed = valueParser(value)
  if (parsed.nodes.some(node => node.type === 'word' && (
    node.value.includes('*') || node.value === '+' || node.value === '-'
  ))) return true
  parsed.walk((node) => {
    if (node.type === 'function' && !supportedCssFunctions.has(node.value.toLowerCase())) {
      unsupported = true
      return false
    }
    if (node.type !== 'function') return
    const name = node.value.toLowerCase()
    const first = node.nodes.find(child => child.type !== 'space' && child.type !== 'comment')
    if (['rgb', 'rgba', 'hsl', 'hsla'].includes(name)
      && first?.type === 'word'
      && /^(?:#|[a-z])/i.test(first.value)
      && first.value !== 'none' && first.value !== 'from') {
      unsupported = true
    }
    if (['saturate', 'contrast', 'grayscale', 'invert'].includes(name)
      && node.nodes.some(child => (child.type === 'div' && child.value === ',')
        || (child.type === 'word' && /^(?:#|[a-z])/i.test(child.value)))) {
      unsupported = true
    }
  })
  return unsupported
}

function unsupportedNestedSelector(selector: string): string | undefined {
  if (/^[\w-]+:$/.test(selector.trim())) {
    return 'Less property nesting requires manual migration.'
  }
  if (/:(?:global|deep|slotted)\b|::v-deep\b|\/deep\/|>>>/.test(selector)) {
    return 'Vue scoped/global selectors require manual migration.'
  }
  if (selector.includes(',') || /@\{|:extend\b|\bwhen\b/.test(selector)) {
    return 'Complex or Less-specific selectors require manual migration.'
  }
  if (/^[.#][\w-]+\s*\(/.test(selector.trim())) {
    return 'Less mixins require manual migration.'
  }
  try {
    let hasLocalClass = false
    selectorParser().astSync(selector).walkClasses(() => { hasLocalClass = true })
    if (hasLocalClass) return 'Nested CSS Module classes require manual selector mapping.'
  } catch {
    return 'The nested selector could not be parsed safely.'
  }
  return undefined
}

export function unsupportedAtRuleParameters(params: string, atRuleName: string): boolean {
  const mathFunctions = new Set(['calc', 'min', 'max', 'clamp'])
  const slashFunctions = new Set([
    'rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color', 'var', 'env',
  ])
  const slashProperties = new Set([
    'font', 'border-radius', 'background', 'mask', 'grid', 'grid-template',
    'grid-area', 'grid-row', 'grid-column', 'offset',
  ])
  const inspect = (nodes: valueParser.Node[], inMath = false, slashSyntax = false): boolean => {
    const tokens = nodes.filter(node => node.type !== 'space' && node.type !== 'comment')
    const ratio = tokens.some(node => node.type === 'word' && /^(?:(?:min|max)-)?aspect-ratio$/.test(node.value))
      && tokens.filter(node => node.type === 'div' && node.value === '/').length === 1
    const property = tokens[0]?.type === 'word' ? tokens[0].value.toLowerCase() : ''
    const declarationSlash = atRuleName.toLowerCase() === 'supports'
      && tokens[1]?.type === 'div' && tokens[1].value === ':'
      && (slashProperties.has(property) || property.startsWith('--'))
    return tokens.some((node, index) => {
      if ('unclosed' in node && node.unclosed) return true
      if (node.type === 'function') {
        const name = node.value.toLowerCase()
        const contents = node.nodes.filter(child => child.type !== 'space' && child.type !== 'comment')
        if (!name && !inMath && contents.length === 1
          && contents[0].type === 'word' && valueParser.unit(contents[0].value)) return true
        if (name === 'selector') {
          try {
            selectorParser().astSync(valueParser.stringify(node.nodes))
            return false
          } catch {
            return true
          }
        }
        if (name && !supportedCssFunctions.has(name) && !['style', 'scroll-state'].includes(name)) return true
        if (name && !mathFunctions.has(name) && supportedCssFunctions.has(name)
          && unsupportedValue(valueParser.stringify(node))) return true
        if (name === 'url') return false
        return inspect(node.nodes, inMath || mathFunctions.has(name), slashFunctions.has(name))
      }
      if (inMath) return false
      if (node.type === 'div' && node.value === '/') {
        if (slashSyntax || declarationSlash) return false
        const left = valueParser.unit(tokens[index - 1]?.value ?? '')
        const right = valueParser.unit(tokens[index + 1]?.value ?? '')
        return !(ratio && left && right && left.unit === '' && right.unit === '')
      }
      if (node.type !== 'word') return false
      if (/^[~`$]|[*]|^[+-]$/.test(node.value)) return true
      // A dimension cannot contain another arithmetic operand outside a CSS math function.
      return /^[+-]?(?:\d|\.\d)/.test(node.value)
        && !/^[+-]?(?:\d*\.?\d+)(?:e[+-]?\d+)?[a-z%]*$/i.test(node.value)
    })
  }
  return inspect(valueParser(params).nodes)
}

function serializeContainer(
  container: Container,
  diagnostics: CodemodDiagnostic[],
  indent = 6,
): string | null {
  const entries: string[] = []
  const entryKeys = new Set<string>()
  for (const node of container.nodes ?? []) {
    if (node.type === 'comment') continue
    if (node.type === 'decl') {
      const declaration = node as Declaration
      if (/\+_?$/.test(declaration.prop)) {
        diagnostics.push(diagnostic(node, 'Less property merging requires manual migration.'))
        return null
      }
      if (declaration.prop === 'composes') {
        diagnostics.push(diagnostic(node, 'CSS Modules composes requires manual migration.'))
        return null
      }
      if (declaration.value.trimStart().startsWith('~')) {
        diagnostics.push(diagnostic(node, 'Less escaped values require manual migration.'))
        return null
      }
      if (hasUnresolvedAssetUrl(declaration.value)) {
        diagnostics.push(diagnostic(node, 'Relative or module asset URLs require manual imports before migration.'))
        return null
      }
      if (declaration.prop.startsWith('@') || declaration.value.includes('@')) {
        const mapped = !declaration.prop.startsWith('@') && tokenExpression(
          declaration.value, declaration.important || declaration.prop.startsWith('--'),
        )
        if (!mapped || entryKeys.has(camelCaseProperty(declaration.prop))) {
          diagnostics.push(diagnostic(node, 'Less variables require manual token mapping.'))
          return null
        }
        const key = camelCaseProperty(declaration.prop)
        entryKeys.add(key)
        entries.push(`${JSON.stringify(key)}: ${mapped}${declaration.important ? ' + " !important"' : ''}`)
        continue
      }
      if (unsupportedValue(declaration.value)) {
        diagnostics.push(diagnostic(node, 'Less functions, calculations or unsupported CSS functions require manual migration.'))
        return null
      }
      const key = camelCaseProperty(declaration.prop)
      if (entryKeys.has(key)) {
        diagnostics.push(
          diagnostic(
            node,
            `Duplicate property ${JSON.stringify(declaration.prop)} requires manual migration.`,
          ),
        )
        return null
      }
      entryKeys.add(key)
      const value = declaration.important ? `${declaration.value} !important` : declaration.value
      entries.push(`${JSON.stringify(key)}: ${JSON.stringify(value)}`)
      continue
    }
    if (node.type === 'rule') {
      const rule = node as Rule
      const unsupportedReason = unsupportedNestedSelector(rule.selector)
      if (unsupportedReason) {
        diagnostics.push(diagnostic(node, unsupportedReason))
        return null
      }
      if (entryKeys.has(rule.selector)) {
        diagnostics.push(
          diagnostic(
            node,
            `Duplicate selector ${JSON.stringify(rule.selector)} requires manual migration.`,
          ),
        )
        return null
      }
      entryKeys.add(rule.selector)
      const nested = serializeContainer(rule, diagnostics, indent + 2)
      if (nested == null) return null
      entries.push(`${JSON.stringify(rule.selector)}: ${nested}`)
      continue
    }
    if (node.type === 'atrule') {
      const atRule = node as AtRule
      if (!supportedBlockAtRules.has(atRule.name.toLowerCase())) {
        diagnostics.push(diagnostic(node, `@${atRule.name} requires manual migration.`))
        return null
      }
      if (atRule.params.includes('@')) {
        diagnostics.push(diagnostic(node, `@${atRule.name} parameters contain a Less variable.`))
        return null
      }
      if (unsupportedAtRuleParameters(atRule.params, atRule.name)) {
        diagnostics.push(diagnostic(node, `@${atRule.name} parameters contain unsupported Less calculations or functions.`))
        return null
      }
      if (!atRule.nodes) {
        diagnostics.push(
          diagnostic(node, `@${atRule.name} without a block requires manual migration.`),
        )
        return null
      }
      const nested = serializeContainer(atRule, diagnostics, indent + 2)
      if (nested == null) return null
      const key = `@${atRule.name}${atRule.params ? ` ${atRule.params}` : ''}`
      if (entryKeys.has(key)) {
        diagnostics.push(
          diagnostic(node, `Duplicate at-rule ${JSON.stringify(key)} requires manual migration.`),
        )
        return null
      }
      entryKeys.add(key)
      entries.push(`${JSON.stringify(key)}: ${nested}`)
      continue
    }
  }

  if (entries.length === 0) return '{}'
  const spacing = ' '.repeat(indent)
  const closing = ' '.repeat(Math.max(0, indent - 2))
  return `{\n${spacing}${entries.join(`,\n${spacing}`)},\n${closing}}`
}

export function transformLessToCreateStyles(source: string): LessTransformResult {
  const diagnostics: CodemodDiagnostic[] = []
  let root
  try {
    root = postcssLess.parse(source)
  } catch (error) {
    return {
      styles: '',
      classNames: [],
      diagnostics: [{ message: error instanceof Error ? error.message : String(error) }],
    }
  }

  const entries: string[] = []
  const classNames: string[] = []
  const seenClassNames = new Set<string>()
  for (const node of root.nodes) {
    if (node.type === 'comment') continue
    if (node.type !== 'rule') {
      diagnostics.push(
        diagnostic(node, 'Only top-level class rules can be migrated automatically.'),
      )
      continue
    }

    const rule = node as Rule
    const match = /^\.([A-Za-z_][\w-]*)$/.exec(rule.selector.trim())
    if (!match) {
      diagnostics.push(
        diagnostic(node, `Selector ${JSON.stringify(rule.selector)} is not a single local class.`),
      )
      continue
    }
    if (seenClassNames.has(match[1])) {
      diagnostics.push(
        diagnostic(node, `Duplicate class ${JSON.stringify(match[1])} requires manual migration.`),
      )
      continue
    }
    seenClassNames.add(match[1])

    const body = serializeContainer(rule, diagnostics)
    if (body == null) continue
    classNames.push(match[1])
    entries.push(`  ${JSON.stringify(match[1])}: css(${body})`)
  }

  return {
    styles: entries.length > 0 ? `({\n${entries.join(',\n')},\n})` : '',
    classNames,
    diagnostics,
  }
}

function uniqueName(code: string, preferred: string) {
  let name = preferred
  let index = 2
  while (new RegExp(`\\b${name}\\b`).test(code)) name = `${preferred}${index++}`
  return name
}

function styleBlockRange(code: string, start: number, end: number): [number, number] {
  const open = code.lastIndexOf('<style', start)
  const closeStart = code.indexOf('</style>', end)
  return [open, closeStart < 0 ? end : closeStart + '</style>'.length]
}

function styleReference(binding: string, className: string, quote?: string) {
  return /^[A-Za-z_$][\w$]*$/.test(className)
    ? `${binding}.${className}`
    : quote === "'"
      ? `${binding}[${JSON.stringify(className)}]`
      : `${binding}['${className}']`
}

interface VueExpressionRange {
  source: string
  start: number
  quote?: string
}

interface VueTemplateNode {
  type: number
  content?: VueExpressionNode | string
  props?: VueDirectiveNode[]
  children?: VueTemplateNode[]
}

interface VueExpressionNode {
  loc: {
    source: string
    start: { offset: number }
  }
}

interface VueDirectiveNode {
  type: number
  exp?: VueExpressionNode
  arg?: VueExpressionNode & { isStatic?: boolean }
}

function collectTemplateExpressions(
  source: string,
  diagnostics: CodemodDiagnostic[],
): VueExpressionRange[] {
  const root = baseParse(source) as unknown as VueTemplateNode
  const expressions: VueExpressionRange[] = []

  const addExpression = (expression?: VueExpressionNode) => {
    if (!expression) return
    expressions.push({
      source: expression.loc.source,
      start: expression.loc.start.offset,
      quote: source[expression.loc.start.offset - 1],
    })
  }

  const visit = (node: VueTemplateNode) => {
    if (node.type === NodeTypes.INTERPOLATION && typeof node.content === 'object') {
      addExpression(node.content)
    }
    if (node.type === NodeTypes.ELEMENT) {
      for (const prop of node.props ?? []) {
        if (prop.type !== NodeTypes.DIRECTIVE) continue
        addExpression(prop.exp)
        if (prop.arg && !prop.arg.isStatic && prop.arg.loc.source.includes('$style')) {
          diagnostics.push({
            message: 'Dynamic directive arguments using $style require manual migration.',
          })
        }
      }
    }
    for (const child of node.children ?? []) visit(child)
  }

  visit(root)
  return expressions
}

function scriptUsesCssModules(source: string) {
  let ast
  try {
    ast = parseJavaScript(source, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx', 'decorators-legacy'],
    })
  } catch {
    return /\buseCssModule\b|\$style\b/.test(source)
  }

  let found = false
  const isImportedUseCssModule = (path: NodePath, name: string) => {
    const binding = path.scope.getBinding(name)
    if (!binding?.path.isImportSpecifier()) return false
    const declaration = binding.path.parentPath
    if (!declaration?.isImportDeclaration() || declaration.node.source.value !== 'vue') return false
    const imported = binding.path.node.imported
    return (
      imported &&
      (imported.type === 'Identifier' ? imported.name : imported.value) === 'useCssModule'
    )
  }

  const handleNamespaceMember = (path: NodePath) => {
    const node = path.node as unknown as { object: unknown; property: unknown; computed: boolean }
    const object = node.object as { type?: string; name?: string }
    const property = node.property as { type?: string; name?: string; value?: unknown }
    if (object.type !== 'Identifier' || !object.name) return
    const propertyName =
      !node.computed && property.type === 'Identifier'
        ? property.name
        : node.computed && property.type === 'StringLiteral'
          ? property.value
          : undefined
    if (propertyName !== 'useCssModule') return
    const binding = path.scope.getBinding(object.name)
    if (!binding?.path.isImportNamespaceSpecifier()) return
    const declaration = binding.path.parentPath
    if (declaration?.isImportDeclaration() && declaration.node.source.value === 'vue') found = true
  }

  traverse(ast, {
    MemberExpression(path) {
      handleNamespaceMember(path)
    },
    OptionalMemberExpression(path) {
      handleNamespaceMember(path)
    },
    Identifier(path) {
      if (path.node.name === '$style' || isImportedUseCssModule(path, path.node.name)) found = true
    },
  })
  return found
}

function classicScriptAllowsSetup(source: string): boolean {
  let ast
  try {
    ast = parseJavaScript(source, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx', 'decorators-legacy'],
    })
  } catch {
    return false
  }
  let safe = true
  traverse(ast, {
    ExportNamedDeclaration(path) {
      if (path.node.specifiers.some(specifier => {
        const name = specifier.exported
        return (name.type === 'Identifier' ? name.name : name.value) === 'default'
      })) safe = false
    },
    ExportDefaultDeclaration(path) {
      let value: NodePath = path.get('declaration')
      while (value.isTSAsExpression() || value.isTSSatisfiesExpression()
        || value.isTSNonNullExpression() || value.isParenthesizedExpression()) {
        value = value.get('expression') as NodePath
      }
      if (value.isCallExpression()) {
        const callee = value.get('callee')
        const binding = callee.isIdentifier() ? callee.scope.getBinding(callee.node.name) : undefined
        const declaration = binding?.path.parentPath
        const imported = binding?.path.isImportSpecifier() ? binding.path.node.imported : undefined
        const args = value.get('arguments')
        if (!declaration?.isImportDeclaration() || declaration.node.source.value !== 'vue'
          || !imported || (imported.type === 'Identifier' ? imported.name : imported.value) !== 'defineComponent'
          || args.length !== 1) {
          safe = false
          return
        }
        value = args[0]
      }
      if (!value.isObjectExpression()) {
        safe = false
        return
      }
      safe = safe && value.node.properties.every(property => {
        if (property.type === 'SpreadElement' || property.computed) return false
        const key = property.key
        const name = key.type === 'Identifier' ? key.name : key.type === 'StringLiteral' ? key.value : ''
        return !['setup', 'mixins', 'extends', '__proto__'].includes(name)
      })
    },
  })
  return safe
}

function collectStyleReferences(
  expression: VueExpressionRange,
  templateOffset: number,
  stylesName: string,
  classNames: Set<string>,
  replacements: Array<[number, number, string]>,
  diagnostics: CodemodDiagnostic[],
) {
  if (!expression.source.includes('$style')) return

  let ast
  try {
    ast = parseJavaScript(expression.source, {
      sourceType: 'module',
      plugins: ['typescript'],
    })
  } catch {
    diagnostics.push({
      message: 'Unsupported template expression containing $style requires manual migration.',
    })
    return
  }

  const handleMember = (node: {
    object: unknown
    property: unknown
    computed: boolean
    optional?: boolean | null
    start?: number | null
    end?: number | null
  }) => {
    const object = node.object as { type?: string; name?: string }
    if (object.type !== 'Identifier' || object.name !== '$style') return
    if (node.optional) {
      diagnostics.push({ message: 'Optional $style access requires manual migration.' })
      return
    }

    const property = node.property as { type?: string; name?: string; value?: unknown }
    const className =
      !node.computed && property.type === 'Identifier'
        ? property.name
        : node.computed && property.type === 'StringLiteral' && typeof property.value === 'string'
          ? property.value
          : undefined
    if (!className) {
      diagnostics.push({
        message: 'Dynamic or unsupported $style access requires manual migration.',
      })
      return
    }
    if (!classNames.has(className)) {
      diagnostics.push({
        message: `Template references unmigrated class ${JSON.stringify(className)}.`,
      })
      return
    }
    if (node.start == null || node.end == null) {
      diagnostics.push({
        message: 'Template expression location is unavailable; manual migration is required.',
      })
      return
    }

    replacements.push([
      templateOffset + expression.start + node.start,
      templateOffset + expression.start + node.end,
      styleReference(stylesName, className, expression.quote),
    ])
  }

  traverse(ast, {
    MemberExpression(path) {
      handleMember(path.node)
    },
    OptionalMemberExpression(path) {
      handleMember(path.node)
    },
    Identifier(path) {
      if (path.node.name !== '$style') return
      const parent = path.parentPath.node as { type?: string; object?: unknown }
      if (
        (parent.type === 'MemberExpression' || parent.type === 'OptionalMemberExpression') &&
        parent.object === path.node
      )
        return
      diagnostics.push({
        message: 'Dynamic or unsupported $style access requires manual migration.',
      })
    },
  })
}

export function transformVueSfcLess(
  code: string,
  filename = 'Component.vue',
): VueLessCodemodResult {
  return rewriteVueSfcLess(code, filename)
}

export function rewriteVueSfcLess(
  code: string,
  filename: string,
  prepared?: LessTransformResult[],
): VueLessCodemodResult {
  const { descriptor, errors } = parseSfc(code, { filename })
  const diagnostics: CodemodDiagnostic[] = errors.map(error => ({
    message: typeof error === 'string' ? error : error.message,
  }))
  if (errors.length > 0) return { code, changed: false, diagnostics }

  const blocks = descriptor.styles.filter(block => block.lang === 'less' && block.module)
  if (blocks.length === 0) {
    return {
      code,
      changed: false,
      diagnostics: [{ message: 'No <style module lang="less"> block was found.' }],
    }
  }

  if (descriptor.styles.some(block => block.lang !== 'less'
    && (block.module === true || block.module === '$style'))) {
    return {
      code,
      changed: false,
      diagnostics: [{ message: 'Mixed Less and non-Less default CSS Modules require manual migration to preserve $style ownership.' }],
    }
  }

  const template = descriptor.template
  if (template?.src !== undefined || (template?.lang !== undefined && template.lang !== 'html')) {
    return {
      code,
      changed: false,
      diagnostics: [{ message: 'External or preprocessed templates require manual CSS Module migration; only inline HTML templates are supported.' }],
    }
  }

  if (blocks.some(block => block.scoped)) {
    return {
      code,
      changed: false,
      diagnostics: [{ message: 'Vue scoped CSS Modules require manual migration to preserve selector isolation.' }],
    }
  }

  if (blocks.some(block => block.module !== true)) {
    return {
      code,
      changed: false,
      diagnostics: [{ message: 'Named CSS Modules require manual migration.' }],
    }
  }

  if (descriptor.script?.src || descriptor.scriptSetup?.src) {
    return {
      code,
      changed: false,
      diagnostics: [{ message: 'External script sources require manual CSS Module migration.' }],
    }
  }

  if (!descriptor.scriptSetup && descriptor.script && !classicScriptAllowsSetup(descriptor.script.content)) {
    return {
      code,
      changed: false,
      diagnostics: [{ message: 'The classic script may provide setup behavior; manual migration is required to preserve it.' }],
    }
  }

  const scriptSources = [descriptor.script?.content, descriptor.scriptSetup?.content].filter(
    (source): source is string => Boolean(source),
  )
  if (scriptSources.some(scriptUsesCssModules)) {
    return {
      code,
      changed: false,
      diagnostics: [{ message: 'Script-side CSS Module access requires manual migration.' }],
    }
  }

  const transformed = blocks.map((block, index) => ({
    block,
    result: prepared?.[index] ?? transformLessToCreateStyles(block.content),
  }))
  diagnostics.push(...transformed.flatMap(item => item.result.diagnostics))
  const allClassNames = transformed.flatMap(item => item.result.classNames)
  if (new Set(allClassNames).size !== allClassNames.length) {
    diagnostics.push({ message: 'Duplicate classes across style blocks require manual migration.' })
  }
  if (diagnostics.length > 0 || transformed.some(item => !item.result.styles)) {
    return { code, changed: false, diagnostics }
  }

  const classNames = new Set(transformed.flatMap(item => item.result.classNames))
  const createStylesName = uniqueName(code, 'createAntdvStyles')
  const useStylesName = uniqueName(code, 'useAntdvStyles')
  const stylesName = uniqueName(code, 'styles')
  const toRefsName = uniqueName(code, 'toAntdvRefs')
  const mergedEntries = transformed
    .map(item => `  ...${item.result.styles}`)
    .join(',\n')
  let usesToken = false
  for (const { result } of transformed) {
    traverse(parseJavaScript(result.styles), {
      ReferencedIdentifier(path) {
        if (path.node.name === 'token' && !path.scope.hasBinding('token')) usesToken = true
      },
    })
  }
  const factoryParams = usesToken ? '{ css, token }' : '{ css }'
  const stylesBinding = stylesName === 'styles' ? 'styles' : `styles: ${stylesName}`
  const setupCode = `import { createStyles as ${createStylesName} } from 'antdv-style'\nimport { toRefs as ${toRefsName} } from 'vue'\n\nconst ${useStylesName} = ${createStylesName}((${factoryParams}) => ({\n${mergedEntries},\n}))\nconst { ${stylesBinding} } = ${toRefsName}(${useStylesName}())\n`

  const magicString = new MagicString(code)
  if (descriptor.scriptSetup) {
    magicString.appendLeft(descriptor.scriptSetup.loc.start.offset, `${setupCode}\n`)
  } else {
    const setupLang = descriptor.script
      ? descriptor.script.lang
        ? ` lang="${descriptor.script.lang}"`
        : ''
      : ' lang="ts"'
    magicString.appendLeft(0, `<script setup${setupLang}>\n${setupCode}</script>\n`)
  }

  const replacements: Array<[number, number, string]> = []
  if (template) {
    const templateOffset = template.loc.start.offset
    let expressions: VueExpressionRange[] = []
    try {
      expressions = collectTemplateExpressions(template.content, diagnostics)
    } catch {
      diagnostics.push({ message: 'The Vue template could not be parsed safely.' })
    }
    for (const expression of expressions) {
      collectStyleReferences(
        expression,
        templateOffset,
        stylesName,
        classNames,
        replacements,
        diagnostics,
      )
    }
  }

  if (diagnostics.length > 0) return { code, changed: false, diagnostics }
  replacements.forEach(([start, end, value]) => magicString.overwrite(start, end, value))
  transformed
    .map(item => styleBlockRange(code, item.block.loc.start.offset, item.block.loc.end.offset))
    .sort((a, b) => b[0] - a[0])
    .forEach(([start, end]) => magicString.remove(start, end))

  const output = magicString.toString()
  const validated = parseSfc(output, { filename })
  const validationErrors: Array<string | Error> = [...validated.errors]
  if (validated.descriptor.template) {
    validationErrors.push(...compileTemplate({
      source: validated.descriptor.template.content,
      filename,
      id: 'codemod-validation',
      compilerOptions: { expressionPlugins: ['typescript'] },
    }).errors)
  }
  if (validationErrors.length > 0) {
    return {
      code,
      changed: false,
      diagnostics: [{ message: 'The transformed Vue template could not be validated safely.' }],
    }
  }
  return { code: output, changed: true, diagnostics }
}
