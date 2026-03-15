import { describe, it, expect } from 'vitest'

describe('env', () => {
  it('should detect browser environment in happy-dom', async () => {
    const { isBrowser } = await import('../env')
    expect(isBrowser).toBe(true)
  })
})
