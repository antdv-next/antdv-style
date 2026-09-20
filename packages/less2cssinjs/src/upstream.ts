import { createRequire } from 'node:module'
import { parse } from '@babel/parser'
import traverseModule from '@babel/traverse'
import postcss, { type Container } from 'postcss'
import { lengths, tokenNames } from './tokens'

const require = createRequire(import.meta.url)
// Use the published CJS entry: upstream's legacy ESM entry has extensionless imports.
const upstream = require('@chenshuai2144/less2cssinjs') as {
  less2CssObjectMap: (source: string) => Promise<Map<string, Map<string, string>>>
  lessToCssInJs: (source: string) => Promise<string>
}
const traverse =
  (traverseModule as unknown as { default?: typeof traverseModule }).default ?? traverseModule
const tokenCache = new Map<string, Promise<string>>()
const mixinCache = new Map<string, Promise<string>>()
export const commonMixins = new Set(['textOverflow', 'textOverflowMulti', 'clearfix'])

export async function upstreamToken(
  name: string,
  custom: Record<string, string> = {},
): Promise<string> {
  if (Object.prototype.hasOwnProperty.call(custom, name)) {
    if (!custom[name] || ['__proto__', 'constructor', 'prototype'].includes(custom[name])) {
      throw new Error(`Invalid token mapping for @${name}.`)
    }
    return `token[${JSON.stringify(custom[name])}]`
  }
  if (!Object.prototype.hasOwnProperty.call(tokenNames, name)
    && !['tag-default-bg', 'border-style-base'].includes(name)) {
    throw new Error(`Unknown Less variable @${name}; provide tokenMap or migrate it manually.`)
  }
  let pending = tokenCache.get(name)
  if (!pending) {
    pending = upstream.less2CssObjectMap(`.probe { value: @${name}; }`).then(map => {
      const value = map.get('.probe')?.get('value')
      if (!value) throw new Error(`Upstream did not map @${name}.`)
      if (!/^token\.[A-Za-z_$][\w$]*$/.test(value)) return JSON.stringify(value)
      const property = value.slice('token.'.length)
      return value + (lengths.has(property) ? ' + "px"' : '')
    })
    tokenCache.set(name, pending)
  }
  return pending
}

interface StaticNode {
  type: string
  name?: string
  value?: unknown
  properties?: Array<{ type: string; computed?: boolean; key: StaticNode; value: StaticNode }>
}

function appendStaticStyles(container: Container, object: StaticNode) {
  if (object.type !== 'ObjectExpression') throw new Error('Unexpected upstream helper output.')
  for (const property of object.properties ?? []) {
    if (property.type !== 'ObjectProperty' || property.computed) {
      throw new Error('Unexpected upstream helper property.')
    }
    const key = property.key.type === 'Identifier' ? property.key.name : property.key.value
    if (typeof key !== 'string') throw new Error('Unexpected upstream helper key.')
    if (property.value.type === 'ObjectExpression') {
      const rule = postcss.rule({ selector: key })
      appendStaticStyles(rule, property.value)
      container.append(rule)
    } else {
      if (!['StringLiteral', 'NumericLiteral'].includes(property.value.type)) {
        throw new Error('Upstream helper contains a non-static value.')
      }
      container.append(postcss.decl({
        prop: key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`),
        value: String(property.value.value),
      }))
    }
  }
}

export function upstreamMixin(name: string): Promise<string> {
  if (!commonMixins.has(name)) throw new Error(`Unsupported upstream mixin ${name}.`)
  let pending = mixinCache.get(name)
  if (!pending) {
    pending = upstream.lessToCssInJs(`.probe { .${name}(); }`).then(source => {
      const ast = parse(source, { sourceType: 'module' })
      let css: string | undefined
      traverse(ast, {
        ReturnStatement(path) {
          const object = path.node.argument
          if (object?.type !== 'ObjectExpression') return
          const probe = object.properties.find(property => property.type === 'ObjectProperty'
            && ((property.key.type === 'Identifier' && property.key.name === 'probe')
              || (property.key.type === 'StringLiteral' && property.key.value === 'probe')))
          if (probe?.type !== 'ObjectProperty') return
          const root = postcss.root()
          appendStaticStyles(root, probe.value as StaticNode)
          css = root.toString()
        },
      })
      if (!css) throw new Error(`Upstream did not expand .${name}().`)
      return css
    })
    mixinCache.set(name, pending)
  }
  return pending
}
