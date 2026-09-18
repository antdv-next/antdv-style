import { createHash } from 'node:crypto'
import { compileStyleAsync, parse as parseSfc } from '@vue/compiler-sfc'
import postcss from 'postcss'
import postcssLess from 'postcss-less'
import selectorParser from 'postcss-selector-parser'
import valueParser from 'postcss-value-parser'
import { compileLessSource } from './compile'
import { commonMixins, upstreamMixin, upstreamToken } from './upstream'
import {
  hasUnresolvedAssetUrl,
  rewriteVueSfcLess,
  unsupportedAtRuleParameters,
  unsupportedValue,
  type LessTransformResult,
  type VueLessCodemodResult,
} from './transform'

export interface VueLessMigrationOptions {
  /** Explicitly evaluate local variables, arbitrary mixins, guards and loops. */
  compileLess?: boolean
  /** Explicit custom Less variable -> Vue theme token mapping (without "@"). */
  tokenMap?: Record<string, string>
}

const blockRules = new Set(['media', 'supports', 'container', 'layer'])
const scopedSyntax = /:(?:deep|slotted)\b|::v-deep\b|\/deep\/|>>>/

function cssExpression(css: string, substitutions: Map<string, string>): string {
  // Sentinels originate in this adapter; JSON encoding keeps CSS out of JS syntax.
  const parts: string[] = []
  let remaining = css
  while (remaining) {
    let next: [string, string] | undefined
    let offset = remaining.length
    for (const entry of substitutions) {
      const index = remaining.indexOf(entry[0])
      if (index >= 0 && index < offset) { next = entry; offset = index }
    }
    if (!next) { parts.push(JSON.stringify(remaining)); break }
    if (offset) parts.push(JSON.stringify(remaining.slice(0, offset)))
    parts.push(`(${next[1]})`)
    remaining = remaining.slice(offset + next[0].length)
  }
  return parts.join(' + ') || '""'
}

async function migrateBlock(
  source: string,
  filename: string,
  index: number,
  options: VueLessMigrationOptions,
): Promise<LessTransformResult> {
  const scope = createHash('sha256').update(`${filename.replace(/\\/g, '/')}\0${index}\0${source}`)
    .digest('hex').slice(0, 12)
  const root = postcssLess.parse(source)
  const definedMixins = new Set<string>()
  root.walkRules(rule => {
    const definition = /^[.#]([\w-]+)(?:\s*\(|\s+when\b)/.exec(rule.selector.trim())?.[1]
    if (definition) { definedMixins.add(definition); return }
    try {
      const selectors = selectorParser().astSync(rule.selector)
      for (const selector of selectors.nodes) {
        const nodes = selector.nodes.filter(node => node.type !== 'comment')
        if (nodes.length === 1 && (nodes[0].type === 'class' || nodes[0].type === 'id')) {
          definedMixins.add(nodes[0].value)
        }
      }
    } catch {
      // Less-specific definitions/interpolation are validated by the compiler.
    }
  })
  const substitutions = new Map<string, string>()
  const marker = (expression: string) => {
    const placeholder = `ANTDVMIGRATION${scope}VALUE${substitutions.size}END`
    substitutions.set(placeholder, expression)
    return placeholder
  }

  const pending: Array<() => Promise<void>> = []
  root.walk(node => {
    if (node.type === 'comment') { node.remove(); return }
    if (node.type === 'rule') {
      if (scopedSyntax.test(node.selector)) throw new Error('Vue scoped/global selectors require manual migration.')
      if (/:(?:export|import)\b/.test(node.selector)) {
        throw new Error('CSS Modules ICSS imports/exports require manual migration.')
      }
      if (!options.compileLess && /@\{|:extend\b|\bwhen\b|^[.#][\w-]+\s*\(|^[\w-]+:$/.test(node.selector.trim())) {
        throw new Error('Less selectors, property nesting or mixin definitions require --compile-less.')
      }
    }
    if (node.type === 'atrule') {
      if (commonMixins.has(node.name) && node.params.trim() === '()'
        && !node.nodes && node.raws.identifier === '.') {
        if (!options.compileLess && definedMixins.has(node.name)) {
          throw new Error('Locally defined mixins require --compile-less.')
        }
        // In compile mode, allow local definitions to determine their own meaning.
        if (!options.compileLess || !definedMixins.has(node.name)) {
          pending.push(() => upstreamMixin(node.name).then(css => {
            node.replaceWith(...postcssLess.parse(css).nodes)
          }))
        }
        return
      }
      if (!blockRules.has(node.name.toLowerCase())) {
        if (!options.compileLess) throw new Error(`@${node.name} requires --compile-less or manual migration.`)
        return
      }
      if (node.params.includes('@')) {
        if (options.compileLess) return
        const parsed = valueParser(node.params)
        parsed.walk(part => {
          if (part.type !== 'word' || !part.value.includes('@')) return
          const match = /^@([\w-]+)$/.exec(part.value)
          if (!match) throw new Error('At-rule Less expressions require manual migration.')
          pending.push(() => upstreamToken(match[1], options.tokenMap).then(expression => {
            part.value = marker(expression)
            node.params = valueParser.stringify(parsed.nodes)
          }))
        })
      } else if (!options.compileLess && unsupportedAtRuleParameters(node.params, node.name)) {
        throw new Error(`@${node.name} parameters require --compile-less or manual migration.`)
      }
    }
    if (node.type !== 'decl') return
    if (node.prop === 'composes') throw new Error('CSS Modules composes requires manual migration.')
    if (hasUnresolvedAssetUrl(node.value)) throw new Error('Relative or module asset URLs require manual imports before migration.')
    if (options.compileLess) return
    if (node.prop.startsWith('@') || /\+_?$/.test(node.prop) || node.value.trimStart().startsWith('~')) {
      throw new Error('Local variables, escaped values and property merging require --compile-less.')
    }
    if (node.value.includes('@')) {
      // Only standalone variables have an unambiguous CSS unit contract.
      const parsed = valueParser(node.value)
      const expressions: Array<() => Promise<string>> = parsed.nodes.map(part => {
        if (part.type !== 'word' || !part.value.includes('@')) {
          const text = valueParser.stringify(part)
          if (text.includes('@') || unsupportedValue(text)) {
            throw new Error('Less variable calculations require manual migration.')
          }
          return () => Promise.resolve(JSON.stringify(text))
        }
        const match = /^@([\w-]+)$/.exec(part.value)
        if (!match) throw new Error('Less variable expressions require manual migration.')
        return () => upstreamToken(match[1], options.tokenMap)
      })
      pending.push(() => Promise.all(expressions.map(expression => expression())).then(parts => {
        node.value = marker(parts.map(part => `(${part})`).join(' + '))
      }))
    } else if (unsupportedValue(node.value)) {
      throw new Error('Less functions, calculations or unsupported CSS functions require --compile-less.')
    }
  })
  for (const prepare of pending) await prepare()
  if (!options.compileLess) root.walkAtRules(rule => {
    if (!blockRules.has(rule.name)) return
    let params = rule.params
    for (const placeholder of substitutions.keys()) params = params.split(placeholder).join('1px')
    if (unsupportedAtRuleParameters(params, rule.name)) {
      throw new Error(`@${rule.name} parameters contain unsupported Less calculations or functions.`)
    }
  })
  const compiled = await compileLessSource(root.toString(postcssLess.stringify), filename)
  postcss.parse(compiled).walkRules(rule => {
    selectorParser().astSync(rule.selector).walkIds(() => {
      throw new Error('ID selectors require manual CSS Module migration.')
    })
  })
  const modules = await compileStyleAsync({
    source: compiled, filename, id: `migration-${scope}`, modules: true,
    modulesOptions: { generateScopedName: name => `m${scope}_${name}` },
  })
  if (modules.errors.length) throw new Error(String(modules.errors[0]))
  const names = modules.modules ?? {}
  if (!Object.keys(names).length) throw new Error('No local CSS Module classes were found.')
  if (Object.keys(names).some(name => ['__proto__', 'constructor', 'prototype'].includes(name))) {
    throw new Error('Reserved CSS Module class names require manual migration.')
  }
  const localClasses = new Set(Object.values(names))
  const css = postcss.parse(modules.code)
  css.walkAtRules(rule => {
    if (!blockRules.has(rule.name.toLowerCase()) || !rule.nodes) {
      throw new Error(`@${rule.name} requires manual migration.`)
    }
  })
  css.walkDecls(decl => {
    if (hasUnresolvedAssetUrl(decl.value) || unsupportedValue(decl.value)) {
      throw new Error('Compiled values contain unresolved assets or unsupported CSS functions.')
    }
  })
  css.walkRules(rule => {
    const selector = selectorParser().astSync(rule.selector)
    for (const item of selector.nodes) {
      const anchor = item.nodes.find(node => node.type === 'class' && localClasses.has(node.value))
      if (!anchor) throw new Error('Selectors without a direct local class require createGlobalStyle or manual migration.')
      // Anchor once: cx() may merge the ancestor's sheet class while descendants
      // retain their original sheet. Stable module identities preserve that relation.
      const qualifier = selectorParser.pseudo({
        value: ':where', nodes: [selectorParser.selector({
          value: '', nodes: [selectorParser.nesting({ value: '&' })],
        })],
      })
      qualifier.spaces.before = anchor.spaces.before
      anchor.spaces.before = ''
      item.insertBefore(anchor, qualifier)
    }
    rule.selector = selector.toString()
  })
  const classes = Object.entries(names).map(([name, value]) =>
    `    [${JSON.stringify(name)}]: ${JSON.stringify(`${value} `)} + sheet`)
  return {
    styles: `(() => {\n  const sheet = css(${cssExpression(css.toString(), substitutions)})\n  return {\n${classes.join(',\n')},\n  }\n})()`,
    classNames: Object.keys(names),
    diagnostics: [],
  }
}

/** Upstream conversion plus a Vue/CSS-Modules adapter; never rewrites on diagnostics. */
export async function migrateVueSfcLess(
  code: string,
  filename = 'Component.vue',
  options: VueLessMigrationOptions = {},
): Promise<VueLessCodemodResult> {
  const { descriptor, errors } = parseSfc(code, { filename })
  if (errors.length) return rewriteVueSfcLess(code, filename)
  const blocks = descriptor.styles.filter(block => block.lang === 'less' && block.module)
  try {
    const results: LessTransformResult[] = []
    for (const [index, block] of blocks.entries()) {
      results.push(await migrateBlock(block.content, filename, index, options))
    }
    return rewriteVueSfcLess(code, filename, results)
  } catch (error) {
    return { code, changed: false, diagnostics: [{ message: error instanceof Error ? error.message : String(error) }] }
  }
}

/** Backwards-compatible asynchronous shortcut for explicit local Less compilation. */
export function compileVueSfcLess(code: string, filename = 'Component.vue'): Promise<VueLessCodemodResult> {
  return migrateVueSfcLess(code, filename, { compileLess: true })
}
