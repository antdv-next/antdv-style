import { defineComponent, provide, type PropType } from 'vue'
import type { EmotionInstance } from '../core'
import { createEmotion } from '../core'
import { StyleEngineKey } from '../context'
import type { ContextKeys } from '../context'

export function makeStyleProvider(keys?: ContextKeys) {
  const engineKey = keys?.styleEngineKey ?? StyleEngineKey

  return defineComponent({
    name: 'StyleProvider',
    props: {
      cache: {
        type: Object as PropType<EmotionInstance>,
        default: undefined,
      },
      cacheKey: {
        type: String,
        default: undefined,
      },
      container: {
        type: Object as PropType<HTMLElement>,
        default: undefined,
      },
    },
    setup(props, { slots }) {
      let engine: EmotionInstance

      if (props.cache) {
        engine = props.cache
      } else if (props.cacheKey) {
        engine = createEmotion({ key: props.cacheKey, container: props.container })
      } else {
        return () => slots.default?.()
      }

      provide(engineKey, engine)

      return () => slots.default?.()
    },
  })
}

// Default instance for direct import
export const StyleProvider = makeStyleProvider()
