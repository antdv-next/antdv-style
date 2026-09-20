import { describe, expect, it, vi } from 'vitest'
import { createCSS } from '../createCSS'
import { createEmotion } from '../createEmotion'

describe('createCSS', () => {
  it('should keep high and low priority styles independent in one cache', () => {
    const emotion = createEmotion({ key: 'mixed-priority', speedy: false })
    const insert = vi.spyOn(emotion.cache, 'insert')
    const high = createCSS(emotion.cache, { hashPriority: 'high' })
    const low = createCSS(emotion.cache, { hashPriority: 'low' })

    const highClass = high.css({ color: 'red' })
    const lowClass = low.css({ color: 'red' })

    expect(lowClass).not.toBe(highClass)
    expect(insert).toHaveBeenCalledTimes(2)
    expect(insert.mock.calls[0][0]).toBe(`.${highClass}`)
    expect(insert.mock.calls[1][0]).toBe(`:where(.${lowClass})`)
  })
})
