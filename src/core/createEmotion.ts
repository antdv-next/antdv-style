import createEmotionInstance, {
  type Emotion,
  type EmotionCache,
  type CSSInterpolation,
  type ClassNamesArg,
} from '@emotion/css/create-instance'
import { DEFAULT_CSS_PREFIX_KEY } from './constants'

export interface CreateEmotionOptions {
  key?: string
  container?: HTMLElement
}

export interface EmotionInstance {
  css: Emotion['css']
  cx: Emotion['cx']
  keyframes: Emotion['keyframes']
  cache: EmotionCache
  injectGlobal: Emotion['injectGlobal']
  flush: Emotion['flush']
}

export function createEmotion(options?: CreateEmotionOptions): EmotionInstance {
  const { key = DEFAULT_CSS_PREFIX_KEY, container } = options ?? {}
  const instance = createEmotionInstance({ key, container })

  return {
    css: (...args) => instance.css(...args),
    cx: (...args) => instance.cx(...args),
    keyframes: (...args) => instance.keyframes(...args),
    cache: instance.cache,
    injectGlobal: (...args) => instance.injectGlobal(...args),
    flush: () => instance.flush(),
  }
}

export type { EmotionCache, CSSInterpolation, ClassNamesArg }
