import type { EmotionInstance } from './createEmotion'
import type { StyleSheet } from '@emotion/sheet'

export interface CacheManagerInstance {
  /** Get all collected CSS as a single string */
  getStyles(html?: string): string
  /** Get all collected CSS as individual style tag strings */
  getStyleTags(html?: string): string
  /** Reset the collected styles */
  reset(): void
  /** Get the emotion instance this manager wraps */
  emotion: EmotionInstance
}

interface WeakRefLike<T extends object> {
  deref(): T | undefined
}

interface FinalizationRegistryLike<T> {
  register(target: object, heldValue: T, unregisterToken?: object): void
  unregister(unregisterToken: object): boolean
}

interface RegistryEntry {
  ref: WeakRefLike<EmotionInstance>
}

interface SharedCacheRegistry {
  version: 1
  registeredEmotionInstances: Set<RegistryEntry>
  registeredCaches: WeakMap<EmotionInstance['cache'], RegistryEntry>
  cacheManagers: WeakMap<EmotionInstance['cache'], CacheManagerInstance>
  managedSheets?: WeakMap<EmotionInstance['cache'], Set<StyleSheet>>
  orderedSheets?: WeakSet<StyleSheet>
  serverGlobalOwners?: WeakMap<EmotionInstance['cache']['inserted'], Map<string, string>>
  registryFinalizer?: FinalizationRegistryLike<RegistryEntry>
}

type WeakRefConstructor = new <T extends object>(target: T) => WeakRefLike<T>
type FinalizationRegistryConstructor = new <T>(
  cleanup: (heldValue: T) => void,
) => FinalizationRegistryLike<T>

const weakRefConstructor = (globalThis as typeof globalThis & {
  WeakRef?: WeakRefConstructor
}).WeakRef
const finalizationRegistryConstructor = (globalThis as typeof globalThis & {
  FinalizationRegistry?: FinalizationRegistryConstructor
}).FinalizationRegistry

const registryHost = globalThis as typeof globalThis & {
  __ANTDV_STYLE_CACHE_REGISTRY__?: SharedCacheRegistry
}
const sharedRegistry = registryHost.__ANTDV_STYLE_CACHE_REGISTRY__ ?? {
  version: 1,
  registeredEmotionInstances: new Set<RegistryEntry>(),
  registeredCaches: new WeakMap<EmotionInstance['cache'], RegistryEntry>(),
  cacheManagers: new WeakMap<EmotionInstance['cache'], CacheManagerInstance>(),
}

if (!registryHost.__ANTDV_STYLE_CACHE_REGISTRY__) {
  Object.defineProperty(registryHost, '__ANTDV_STYLE_CACHE_REGISTRY__', {
    value: sharedRegistry,
    configurable: false,
    enumerable: false,
    writable: false,
  })
}

if (!sharedRegistry.registryFinalizer && weakRefConstructor && finalizationRegistryConstructor) {
  sharedRegistry.registryFinalizer = new finalizationRegistryConstructor<RegistryEntry>((entry) => {
    sharedRegistry.registeredEmotionInstances.delete(entry)
  })
}

const {
  registeredEmotionInstances,
  registeredCaches,
  cacheManagers,
  registryFinalizer,
} = sharedRegistry
const managedSheets = sharedRegistry.managedSheets ??= new WeakMap()
const orderedSheets = sharedRegistry.orderedSheets ??= new WeakSet()
const serverGlobalOwners = sharedRegistry.serverGlobalOwners ??= new WeakMap()

export function setServerGlobalStyle(cache: EmotionInstance['cache'], owner: string, css: string) {
  let owners = serverGlobalOwners.get(cache.inserted)
  if (!owners) serverGlobalOwners.set(cache.inserted, owners = new Map())
  // Store an ordered entry per hook, not per CSS hash; flush starts a new generation.
  const id = `__antdv-global-${owner}`
  owners.set(id, owner)
  cache.inserted[id] = css
}

// Browser global hooks use separate sheets but still belong to their engine.
export function registerManagedSheet(cache: EmotionInstance['cache'], sheet: StyleSheet) {
  let sheets = managedSheets.get(cache)
  if (!sheets) managedSheets.set(cache, sheets = new Set())
  sheets.add(sheet)
  return () => {
    sheets.delete(sheet)
    if (sheets.size === 0) managedSheets.delete(cache)
  }
}

export function flushManagedSheets(cache: EmotionInstance['cache']) {
  managedSheets.get(cache)?.forEach(sheet => sheet.flush())
}

export function getGlobalStyleElements(cache: EmotionInstance['cache']): Element[] {
  return Array.from(cache.sheet.container?.childNodes ?? [])
    .filter((node): node is Element => node.nodeType === 1)
    .filter(element => element.getAttribute('data-antdv-global-anchor') === cache.key
      || (element.getAttribute('data-emotion') === `${cache.key}-global`
        && element.hasAttribute('data-antdv-global')))
}

export function prepareGlobalStyleOrder(cache: EmotionInstance['cache']) {
  const { sheet } = cache
  if (orderedSheets.has(sheet)) return
  orderedSheets.add(sheet)
  const firstGlobal = getGlobalStyleElements(cache)[0]
  if (firstGlobal) {
    for (const tag of sheet.tags) {
      if (tag.compareDocumentPosition(firstGlobal) & 4) continue
      // Supplied engines may already contain CSSOM rules when their globals hydrate.
      const rules = tag.textContent
        ? []
        : Array.from(tag.sheet?.cssRules ?? [], rule => rule.cssText)
      sheet.container.insertBefore(tag, firstGlobal)
      for (const rule of rules) tag.sheet?.insertRule(rule, tag.sheet.cssRules.length)
    }
  }
  const insert = sheet.insert.bind(sheet)
  sheet.insert = (rule) => {
    const firstGlobal = sheet.tags.length === 0 && getGlobalStyleElements(cache)[0]
    if (!firstGlobal) {
      insert(rule)
      return
    }
    // Choose the slot before insertion: moving a speedy tag would discard its CSSOM rules.
    const { before, insertionPoint, prepend } = sheet
    sheet.before = firstGlobal
    sheet.insertionPoint = undefined
    sheet.prepend = false
    try {
      insert(rule)
    } finally {
      sheet.before = before
      sheet.insertionPoint = insertionPoint
      sheet.prepend = prepend
    }
  }
}

function createEmotionReference(emotion: EmotionInstance): WeakRefLike<EmotionInstance> {
  if (weakRefConstructor) return new weakRefConstructor(emotion)
  return { deref: () => emotion }
}

export function registerEmotionInstance(emotion: EmotionInstance): EmotionInstance {
  const existing = registeredCaches.get(emotion.cache)?.ref.deref()
  if (existing) return existing

  const entry: RegistryEntry = { ref: createEmotionReference(emotion) }
  registeredCaches.set(emotion.cache, entry)
  registeredEmotionInstances.add(entry)
  registryFinalizer?.register(emotion, entry, entry)
  return emotion
}

export function unregisterEmotionInstance(emotion: EmotionInstance): boolean {
  const entry = registeredCaches.get(emotion.cache)
  if (!entry) return false

  registeredCaches.delete(emotion.cache)
  registeredEmotionInstances.delete(entry)
  registryFinalizer?.unregister(entry)
  return true
}

export function getRegisteredEmotionInstances(): EmotionInstance[] {
  const instances: EmotionInstance[] = []

  for (const entry of registeredEmotionInstances) {
    const emotion = entry.ref.deref()
    if (emotion) {
      instances.push(emotion)
    } else {
      registeredEmotionInstances.delete(entry)
    }
  }

  return instances
}

interface StyleData {
  css: string
  ids: string[]
  owner?: string
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function getTagStyles(tag: HTMLStyleElement): string {
  if (tag.textContent) return tag.textContent

  try {
    return Array.from(tag.sheet?.cssRules ?? [])
      .map(rule => rule.cssText)
      .join('')
  } catch {
    return ''
  }
}

export function createCacheManager(emotion: EmotionInstance): CacheManagerInstance {
  const existingManager = cacheManagers.get(emotion.cache)
  if (existingManager) return existingManager

  const cache = emotion.cache

  const collectStyles = (html?: string): StyleData[] => {
    const insertedIds = Object.keys(cache.inserted)
    const hasServerStyles = insertedIds.some(id => typeof cache.inserted[id] === 'string')

    if (hasServerStyles) {
      const usedIds = new Set<string>()
      if (html !== undefined) {
        const prefix = `${cache.key}-`
        // Whole identifiers preserve Unicode labels and exclude other cache prefixes.
        for (const [identifier] of html.matchAll(/[-_a-zA-Z0-9\u0080-\u{10FFFF}]+/gu)) {
          if (identifier.startsWith(prefix)) usedIds.add(identifier.slice(prefix.length))
        }
      }

      const globals: StyleData[] = []
      const owners = serverGlobalOwners.get(cache.inserted)
      // The main Emotion sheet is contiguous in the browser, before owned globals.
      const main: StyleData = { css: '', ids: [] }
      for (const id of insertedIds) {
        const value = cache.inserted[id]
        if (typeof value !== 'string') continue

        const owner = owners?.get(id)
        if (owner !== undefined) {
          globals.push({ css: value, ids: [], owner })
          continue
        }
        const isGlobalStyle = cache.registered[`${cache.key}-${id}`] === undefined
        if (html === undefined || usedIds.has(id) || isGlobalStyle) {
          main.ids.push(id)
          main.css += value
        }
      }
      return [main, ...globals]
    }

    const tags = [
      ...cache.sheet.tags,
      ...[...(managedSheets.get(cache) ?? [])].flatMap(sheet => sheet.tags),
    ]
    tags.sort((left, right) => {
      const position = left.compareDocumentPosition(right)
      if (position & 1) return 0
      return position & 4 ? -1 : position & 2 ? 1 : 0
    })
    const styles: StyleData[] = []
    for (const tag of tags) {
      const css = getTagStyles(tag)
      if (!css) continue
      const owner = tag.getAttribute('data-antdv-global') ?? undefined
      const previous = styles[styles.length - 1]
      if (previous && previous.owner === owner) previous.css += css
      else styles.push({ css, ids: owner === undefined ? insertedIds : [], owner })
    }
    return styles
  }

  const manager: CacheManagerInstance = {
    getStyles(html?: string): string {
      return collectStyles(html).map(style => style.css).join('')
    },

    getStyleTags(html?: string): string {
      const nonce = cache.sheet.nonce
        ? ` nonce="${escapeAttribute(cache.sheet.nonce)}"`
        : ''
      return collectStyles(html).map(({ css, ids, owner }) => {
        // Empty owned globals still need a marker so hydration can recover order.
        if (!css && owner === undefined) return ''
        const dataEmotion = owner === undefined ? [cache.key, ...ids].join(' ') : `${cache.key}-global`
        const ownership = owner === undefined
          ? ''
          : ` data-antdv-global="${escapeAttribute(owner)}" data-antdv-global-ssr=""`
        // HTML raw-text parsing ignores CSS quotes/comments; CSS accepts an escaped slash.
        const styleText = css.replace(/<\/style/gi, match => `<\\/${match.slice(2)}`)
        return `<style data-emotion="${escapeAttribute(dataEmotion)}"${ownership}${nonce}>${styleText}</style>`
      }).join('')
    },

    reset(): void {
      emotion.flush()
      flushManagedSheets(cache)
    },

    emotion,
  }

  cacheManagers.set(cache, manager)
  return manager
}
