import { toRef, type ComputedRef } from 'vue'
import type { EmotionInstance } from '../core'
import type { CreateStylesUtils, StyleFactoryInput, StyleInput, StyleResult } from '../types'
import { makeCreateStyles } from './createStyles'
import type { ContextKeys } from '../context'

type StylishFactory<P, T extends StyleFactoryInput> = (utils: CreateStylesUtils, props: P) => T
type StylishInput<P, T extends StyleFactoryInput> = T | StylishFactory<P, T>

export interface MakeCreateStylishOptions {
  cssVar?: Record<string, string>
  hashPriority?: 'high' | 'low'
}

export function makeCreateStylish(defaultEmotion: EmotionInstance, keys?: ContextKeys, options?: MakeCreateStylishOptions) {
  const createStyles = makeCreateStyles(defaultEmotion, {
    cssVar: options?.cssVar,
    hashPriority: options?.hashPriority,
  }, keys)

  return function createStylish<P = void, T extends StyleFactoryInput = StyleInput>(
    factory: StylishInput<P, T>,
  ) {
    const useStyles = createStyles<P, T>(factory)

    return function useStylish(propsOrGetter?: P | (() => P)): ComputedRef<StyleResult<T>> {
      const result = useStyles(propsOrGetter)
      return toRef(result, 'styles') as unknown as ComputedRef<StyleResult<T>>
    }
  }
}
