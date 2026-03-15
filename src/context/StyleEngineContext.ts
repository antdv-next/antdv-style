import type { InjectionKey } from 'vue'
import type { EmotionInstance } from '../core'

export const StyleEngineKey: InjectionKey<EmotionInstance> = Symbol('StyleEngineKey')
