import { sanitizeInput, isValidGameInput, formatInputForDisplay, debounce } from '../input-utils'

describe('Input Utilities', () => {
  describe('sanitizeInput', () => {
    test('removes non-digit characters', () => {
      expect(sanitizeInput('5abc')).toBe('5')
      expect(sanitizeInput('a5b')).toBe('5')
      expect(sanitizeInput('!@#5$%^')).toBe('5')
    })

    test('limits to single digit', () => {
      expect(sanitizeInput('123')).toBe('1')
      expect(sanitizeInput('567')).toBe('5')
    })

    test('handles empty input', () => {
      expect(sanitizeInput('')).toBe('')
      expect(sanitizeInput('abc')).toBe('')
    })
  })

  describe('isValidGameInput', () => {
    test('accepts digits 1-9', () => {
      for (let i = 1; i <= 9; i++) {
        expect(isValidGameInput(i.toString())).toBe(true)
      }
    })
    
    test('rejects invalid inputs', () => {
      expect(isValidGameInput('0')).toBe(false)
      expect(isValidGameInput('10')).toBe(false)
      expect(isValidGameInput('a')).toBe(false)
      expect(isValidGameInput('')).toBe(false)
      expect(isValidGameInput('!')).toBe(false)
    })
  })

  describe('formatInputForDisplay', () => {
    test('trims and uppercases input', () => {
      expect(formatInputForDisplay('  hello  ')).toBe('HELLO')
      expect(formatInputForDisplay('test')).toBe('TEST')
      expect(formatInputForDisplay('5')).toBe('5')
    })
  })

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    test('delays function execution', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn()
      expect(mockFn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    test('cancels previous calls', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn()
      debouncedFn()
      debouncedFn()

      jest.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })
})