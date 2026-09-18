import createEmotionInstance, {
  type Emotion,
  type EmotionCache,
  type CSSInterpolation,
  type ClassNamesArg,
  type Options as EmotionOptions,
} from '@emotion/css/create-instance'
import { DEFAULT_CSS_PREFIX_KEY } from './constants'
import { flushManagedSheets } from './CacheManager'

export interface CreateEmotionOptions extends Omit<EmotionOptions, 'key'> {
  key?: string
}

export type EmotionInstance = Emotion

export function createEmotion(options?: CreateEmotionOptions): EmotionInstance {
  const emotion = createEmotionInstance({ ...options, key: options?.key ?? DEFAULT_CSS_PREFIX_KEY })
  const flush = emotion.flush.bind(emotion)
  emotion.flush = () => {
    flushManagedSheets(emotion.cache)
    flush()
  }
  return emotion
}

export type { EmotionCache, CSSInterpolation, ClassNamesArg }
