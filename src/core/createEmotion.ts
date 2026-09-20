import createEmotionInstance, {
  type Emotion,
  type EmotionCache,
  type CSSInterpolation,
  type ClassNamesArg,
  type Options as EmotionOptions,
} from '@emotion/css/create-instance'
import { DEFAULT_CSS_PREFIX_KEY } from './constants'
import { flushManagedSheets, prepareGlobalStyleOrder } from './CacheManager'

export interface CreateEmotionOptions extends Omit<EmotionOptions, 'key'> {
  key?: string
}

export type EmotionInstance = Emotion

export function createEmotion(options?: CreateEmotionOptions): EmotionInstance {
  const key = options?.key ?? DEFAULT_CSS_PREFIX_KEY
  const emotion = createEmotionInstance({ ...options, key })
  prepareGlobalStyleOrder(emotion.cache)
  const flush = emotion.flush.bind(emotion)
  emotion.flush = () => {
    flushManagedSheets(emotion.cache)
    flush()
  }
  return emotion
}

export type { EmotionCache, CSSInterpolation, ClassNamesArg }
