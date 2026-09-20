import {
  StyleProvider as AntdvStyleProvider,
  type Linter,
  type StyleProviderProps as AntdvStyleProviderProps,
  type Transformer,
} from '@antdv-next/cssinjs'
import { defineComponent, h, inject, onUnmounted, provide, watchEffect, type PropType } from 'vue'
import type { StylisPlugin } from '@emotion/cache'
import type { EmotionInstance } from '../core'
import { createEmotion, registerEmotionInstance, unregisterEmotionInstance } from '../core'
import { StyleEngineKey } from '../context'
import type { ContextKeys } from '../context'

type AntdvStyleCache = AntdvStyleProviderProps['cache']

export type { AntdvStyleCache }

export interface StyleProviderProps {
  cache?: EmotionInstance | AntdvStyleCache
  emotionCache?: EmotionInstance
  antdCache?: AntdvStyleCache
  cacheKey?: string
  container?: Node
  prefix?: string
  speedy?: boolean
  nonce?: string
  insertionPoint?: HTMLElement
  stylisPlugins?: StylisPlugin[]
  getStyleManager?: (styleManager: EmotionInstance) => void
  hashPriority?: 'high' | 'low'
  ssrInline?: boolean
  transformers?: Transformer[]
  linters?: Linter[]
  layer?: boolean
  autoPrefix?: boolean
}

function isEmotionInstance(value: unknown): value is EmotionInstance {
  return Boolean(value && typeof value === 'object' && 'css' in value && 'cache' in value)
}

export function makeStyleProvider(keys?: ContextKeys, defaultEmotion?: EmotionInstance) {
  const engineKey = keys?.styleEngineKey ?? StyleEngineKey

  return defineComponent({
    name: 'StyleProvider',
    props: {
      cache: {
        type: Object as PropType<EmotionInstance | AntdvStyleCache>,
        default: undefined,
      },
      emotionCache: Object as PropType<EmotionInstance>,
      antdCache: Object as PropType<AntdvStyleCache>,
      cacheKey: {
        type: String,
        default: undefined,
      },
      container: {
        type: Object as PropType<Node>,
        default: undefined,
      },
      prefix: String,
      speedy: {
        type: Boolean,
        default: undefined,
      },
      nonce: String,
      insertionPoint: Object as PropType<HTMLElement>,
      stylisPlugins: Array as PropType<StylisPlugin[]>,
      getStyleManager: Function as PropType<(styleManager: EmotionInstance) => void>,
      hashPriority: String as PropType<'high' | 'low'>,
      ssrInline: {
        type: Boolean,
        default: undefined,
      },
      transformers: Array as PropType<Transformer[]>,
      linters: Array as PropType<Linter[]>,
      layer: {
        type: Boolean,
        default: undefined,
      },
      autoPrefix: {
        type: Boolean,
        default: undefined,
      },
    },
    setup(props, { slots }) {
      const parentEngine = inject<EmotionInstance | undefined>(engineKey, defaultEmotion)
      const hasEmotionConfig = Boolean(
        isEmotionInstance(props.cache)
        || props.emotionCache
        || props.cacheKey !== undefined
        || props.prefix !== undefined
        || props.container
        || props.nonce
        || props.insertionPoint
        || props.stylisPlugins
        || props.speedy !== undefined,
      )
      const hasAntdvConfig = Boolean(
        props.antdCache
        || (props.cache && !isEmotionInstance(props.cache))
        || props.hashPriority
        || props.ssrInline !== undefined
        || props.transformers
        || props.linters
        || props.layer !== undefined
        || props.autoPrefix !== undefined,
      )

      if (!hasEmotionConfig && !hasAntdvConfig && !props.getStyleManager) {
        return () => slots.default?.()
      }

      let engine: EmotionInstance
      let ownsEngine = false

      if (props.emotionCache) {
        engine = props.emotionCache
      } else if (isEmotionInstance(props.cache)) {
        engine = props.cache
      } else if (hasEmotionConfig) {
        engine = registerEmotionInstance(createEmotion({
          key: props.prefix ?? props.cacheKey ?? parentEngine?.cache.key,
          container: props.container ?? parentEngine?.sheet.container,
          speedy: props.speedy ?? parentEngine?.sheet.isSpeedy,
          nonce: props.nonce,
          insertionPoint: props.insertionPoint,
          stylisPlugins: props.stylisPlugins,
        }))
        ownsEngine = true
      } else {
        if (parentEngine) {
          engine = parentEngine
        } else {
          engine = registerEmotionInstance(createEmotion())
          ownsEngine = true
        }
      }

      provide(engineKey, engine)
      watchEffect(() => props.getStyleManager?.(engine))
      onUnmounted(() => {
        if (ownsEngine) {
          unregisterEmotionInstance(engine)
          engine.flush()
        }
      })

      const antdCache = props.antdCache ?? (isEmotionInstance(props.cache) ? undefined : props.cache)
      const needsAntdvProvider = Boolean(
        antdCache
        || props.hashPriority
        || props.container
        || props.ssrInline !== undefined
        || props.transformers
        || props.linters
        || props.layer !== undefined
        || props.autoPrefix !== undefined,
      )

      return () => {
        const content = slots.default?.()
        if (!needsAntdvProvider) return content
        return h(AntdvStyleProvider, {
          cache: antdCache,
          hashPriority: props.hashPriority,
          container: (typeof Element !== 'undefined' && props.container instanceof Element)
            || (typeof ShadowRoot !== 'undefined' && props.container instanceof ShadowRoot)
            ? props.container
            : undefined,
          ssrInline: props.ssrInline,
          transformers: props.transformers as any,
          linters: props.linters,
          layer: props.layer,
          autoPrefix: props.autoPrefix,
        }, { default: () => content })
      }
    },
  })
}

// Default instance for direct import
export const StyleProvider = makeStyleProvider()
