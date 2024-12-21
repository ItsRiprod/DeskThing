import { describe, expect, it } from 'vitest'
import { deepMerge } from '@server/utils/objectUtils'

describe('objectUtils', () => {
  describe('deepMerge', () => {
    it('should merge simple objects', () => {
      const target = { a: 1, b: 2 }
      const source = { b: 3, c: 4 }
      const result = deepMerge(target, source)
      expect(result).toEqual({ a: 1, b: 3, c: 4 })
      expect(result).toBe(target)
    })

    it('should handle nested objects', () => {
      const target = { a: { x: 1, y: 2 }, b: 3 }
      const source = { a: { y: 4, z: 5 } } as unknown as Partial<typeof target>
      const result = deepMerge(target, source)
      expect(result).toEqual({ a: { x: 1, y: 4, z: 5 }, b: 3 })
    })

    it('should handle null target', () => {
      const target = null as unknown
      const source = { a: 1 }
      const result = deepMerge(target, source)
      expect(result).toEqual(null)
    })

    it('should handle undefined properties', () => {
      const target = { a: 1, b: undefined }
      const source = { b: 2, c: undefined } as unknown as Partial<typeof target>
      const result = deepMerge(target, source)
      expect(result).toEqual({ a: 1, b: 2, c: undefined })
    })

    it('should handle empty objects', () => {
      const target = {}
      const source = {}
      const result = deepMerge(target, source)
      expect(result).toEqual({})
      expect(result).toBe(target)
    })

    it('should merge multiple levels of nested objects', () => {
      const target = { a: { b: { c: 1, d: 2 }, e: 3 } }
      const source = { a: { b: { d: 4, f: 5 } } } as unknown as Partial<typeof target>
      const result = deepMerge(target, source)
      expect(result).toEqual({ a: { b: { c: 1, d: 4, f: 5 }, e: 3 } })
    })
  })
})
