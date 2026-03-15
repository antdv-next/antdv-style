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
    css: instance.css,
    cx: instance.cx,
    keyframes: instance.keyframes,
    cache: instance.cache,
    injectGlobal: instance.injectGlobal,
    flush: instance.flush,
  }
}

export type { EmotionCache, CSSInterpolation, ClassNamesArg }
