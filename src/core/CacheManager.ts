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

  const collectStyles = (html?: string): StyleData => {
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

      const ids: string[] = []
      let css = ''
      for (const id of insertedIds) {
        const value = cache.inserted[id]
        if (typeof value !== 'string') continue

        const isGlobalStyle = cache.registered[`${cache.key}-${id}`] === undefined
        if (html === undefined || usedIds.has(id) || isGlobalStyle) {
          ids.push(id)
          css += value
        }
      }
      return { css, ids }
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
    const css = tags.map(getTagStyles).join('')
    return { css, ids: css ? insertedIds : [] }
  }

  const manager: CacheManagerInstance = {
    getStyles(html?: string): string {
      return collectStyles(html).css
    },

    getStyleTags(html?: string): string {
      const { css, ids } = collectStyles(html)
      if (!css) return ''
      const dataEmotion = [cache.key, ...ids].join(' ')
      const nonce = cache.sheet.nonce
        ? ` nonce="${escapeAttribute(cache.sheet.nonce)}"`
        : ''
      // HTML raw-text parsing ignores CSS quotes/comments; CSS accepts an escaped slash.
      const styleText = css.replace(/<\/style/gi, match => `<\\/${match.slice(2)}`)
      return `<style data-emotion="${escapeAttribute(dataEmotion)}"${nonce}>${styleText}</style>`
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
