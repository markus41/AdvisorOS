import {
  cn,
  formatDate,
  formatCurrency,
  formatPercent,
  slugify,
  generateRandomString,
  getInitials,
  debounce,
  throttle,
} from '@/lib/utils'

describe('Utility Functions', () => {
  describe('cn (className merge)', () => {
    it('should merge class names correctly', () => {
      expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
    })

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'not-included')).toBe('base conditional')
    })

    it('should handle undefined and null values', () => {
      expect(cn('base', undefined, null, 'valid')).toBe('base valid')
    })

    it('should resolve conflicting Tailwind classes', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4')
    })

    it('should handle empty input', () => {
      expect(cn()).toBe('')
    })

    it('should handle arrays of classes', () => {
      expect(cn(['px-2', 'py-1'], 'bg-red-500')).toBe('px-2 py-1 bg-red-500')
    })

    it('should handle objects with boolean values', () => {
      expect(cn({
        'px-2': true,
        'py-1': false,
        'bg-blue-500': true,
      })).toBe('px-2 bg-blue-500')
    })
  })

  describe('formatDate', () => {
    it('should format Date object correctly', () => {
      const date = new Date('2024-03-15')
      const formatted = formatDate(date)
      expect(formatted).toBe('March 15, 2024')
    })

    it('should format date string correctly', () => {
      const formatted = formatDate('2024-12-25')
      expect(formatted).toBe('December 25, 2024')
    })

    it('should handle ISO date strings', () => {
      const formatted = formatDate('2024-06-01T10:30:00Z')
      expect(formatted).toBe('June 1, 2024')
    })

    it('should handle timestamp strings', () => {
      const timestamp = new Date('2024-01-01').getTime().toString()
      const formatted = formatDate(timestamp)
      expect(formatted).toBe('January 1, 2024')
    })
  })

  describe('formatCurrency', () => {
    it('should format USD currency by default', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
    })

    it('should format with zero decimal places for whole numbers', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00')
    })

    it('should handle negative amounts', () => {
      expect(formatCurrency(-500.25)).toBe('-$500.25')
    })

    it('should format different currencies', () => {
      expect(formatCurrency(1000, 'EUR')).toBe('€1,000.00')
    })

    it('should handle lowercase currency codes', () => {
      expect(formatCurrency(1000, 'gbp')).toBe('£1,000.00')
    })

    it('should handle zero amounts', () => {
      expect(formatCurrency(0)).toBe('$0.00')
    })

    it('should handle very large amounts', () => {
      expect(formatCurrency(1234567.89)).toBe('$1,234,567.89')
    })

    it('should handle very small amounts', () => {
      expect(formatCurrency(0.01)).toBe('$0.01')
    })
  })

  describe('formatPercent', () => {
    it('should format percentage correctly', () => {
      expect(formatPercent(25)).toBe('25.0%')
    })

    it('should handle decimal values', () => {
      expect(formatPercent(33.333)).toBe('33.3%')
    })

    it('should handle zero percent', () => {
      expect(formatPercent(0)).toBe('0.0%')
    })

    it('should handle negative percentages', () => {
      expect(formatPercent(-15)).toBe('-15.0%')
    })

    it('should handle large percentages', () => {
      expect(formatPercent(150)).toBe('150.0%')
    })

    it('should round to one decimal place', () => {
      expect(formatPercent(33.666)).toBe('33.7%')
    })
  })

  describe('slugify', () => {
    it('should convert text to lowercase slug', () => {
      expect(slugify('Hello World')).toBe('hello-world')
    })

    it('should handle special characters', () => {
      expect(slugify('Hello, World!')).toBe('hello-world')
    })

    it('should handle multiple spaces', () => {
      expect(slugify('Hello    World')).toBe('hello-world')
    })

    it('should remove leading and trailing dashes', () => {
      expect(slugify('  Hello World  ')).toBe('hello-world')
    })

    it('should handle numbers', () => {
      expect(slugify('Product 123')).toBe('product-123')
    })

    it('should handle unicode characters', () => {
      expect(slugify('Café & Restaurant')).toBe('caf-restaurant')
    })

    it('should handle empty string', () => {
      expect(slugify('')).toBe('')
    })

    it('should handle only special characters', () => {
      expect(slugify('!@#$%')).toBe('')
    })

    it('should handle mixed case with numbers', () => {
      expect(slugify('CamelCase123Test')).toBe('camelcase123test')
    })
  })

  describe('generateRandomString', () => {
    it('should generate string of correct length', () => {
      expect(generateRandomString(10)).toHaveLength(10)
      expect(generateRandomString(25)).toHaveLength(25)
    })

    it('should generate different strings each time', () => {
      const str1 = generateRandomString(10)
      const str2 = generateRandomString(10)
      expect(str1).not.toBe(str2)
    })

    it('should only contain alphanumeric characters', () => {
      const str = generateRandomString(100)
      expect(/^[A-Za-z0-9]+$/.test(str)).toBe(true)
    })

    it('should handle zero length', () => {
      expect(generateRandomString(0)).toBe('')
    })

    it('should handle length of 1', () => {
      const str = generateRandomString(1)
      expect(str).toHaveLength(1)
      expect(/^[A-Za-z0-9]$/.test(str)).toBe(true)
    })

    it('should generate strings with good randomness', () => {
      const strings = Array.from({ length: 50 }, () => generateRandomString(10))
      const uniqueStrings = new Set(strings)
      // Should have high uniqueness (allow for small chance of collision)
      expect(uniqueStrings.size).toBeGreaterThan(45)
    })
  })

  describe('getInitials', () => {
    it('should get initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD')
    })

    it('should handle single name', () => {
      expect(getInitials('Madonna')).toBe('M')
    })

    it('should handle three names', () => {
      expect(getInitials('John Michael Doe')).toBe('JM')
    })

    it('should handle lowercase names', () => {
      expect(getInitials('john doe')).toBe('JD')
    })

    it('should handle mixed case names', () => {
      expect(getInitials('jOhN dOe')).toBe('JD')
    })

    it('should handle names with extra spaces', () => {
      expect(getInitials('  John   Doe  ')).toBe('JD')
    })

    it('should handle empty string', () => {
      expect(getInitials('')).toBe('')
    })

    it('should handle names with special characters', () => {
      expect(getInitials("John O'Doe")).toBe('JO')
    })

    it('should handle hyphenated names', () => {
      expect(getInitials('Mary-Jane Watson')).toBe('MW')
    })

    it('should only return first two initials', () => {
      expect(getInitials('John Michael Robert Doe')).toBe('JM')
    })
  })

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should delay function execution', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('test')
      expect(mockFn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledWith('test')
    })

    it('should cancel previous calls', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('first')
      jest.advanceTimersByTime(50)
      debouncedFn('second')
      jest.advanceTimersByTime(100)

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('second')
    })

    it('should handle multiple arguments', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('arg1', 'arg2', 'arg3')
      jest.advanceTimersByTime(100)

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3')
    })

    it('should preserve function context', () => {
      const obj = {
        value: 'test',
        method: jest.fn(function(this: any) {
          return this.value
        })
      }
      const debouncedMethod = debounce(obj.method, 100)

      debouncedMethod.call(obj)
      jest.advanceTimersByTime(100)

      expect(obj.method).toHaveBeenCalled()
    })
  })

  describe('throttle', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should execute function immediately on first call', () => {
      const mockFn = jest.fn()
      const throttledFn = throttle(mockFn, 100)

      throttledFn('test')
      expect(mockFn).toHaveBeenCalledWith('test')
    })

    it('should prevent subsequent calls within time limit', () => {
      const mockFn = jest.fn()
      const throttledFn = throttle(mockFn, 100)

      throttledFn('first')
      throttledFn('second')
      throttledFn('third')

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('first')
    })

    it('should allow calls after time limit expires', () => {
      const mockFn = jest.fn()
      const throttledFn = throttle(mockFn, 100)

      throttledFn('first')
      jest.advanceTimersByTime(100)
      throttledFn('second')

      expect(mockFn).toHaveBeenCalledTimes(2)
      expect(mockFn).toHaveBeenNthCalledWith(1, 'first')
      expect(mockFn).toHaveBeenNthCalledWith(2, 'second')
    })

    it('should handle multiple arguments', () => {
      const mockFn = jest.fn()
      const throttledFn = throttle(mockFn, 100)

      throttledFn('arg1', 'arg2', 'arg3')
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3')
    })

    it('should preserve function context', () => {
      const obj = {
        value: 'test',
        method: jest.fn(function(this: any) {
          return this.value
        })
      }
      const throttledMethod = throttle(obj.method, 100)

      throttledMethod.call(obj)
      expect(obj.method).toHaveBeenCalled()
    })
  })

  describe('Edge cases and performance', () => {
    it('should handle extremely large numbers in formatCurrency', () => {
      expect(formatCurrency(Number.MAX_SAFE_INTEGER)).toContain('$')
    })

    it('should handle extremely small numbers in formatCurrency', () => {
      expect(formatCurrency(Number.MIN_VALUE)).toBe('$0.00')
    })

    it('should handle very long strings in slugify', () => {
      const longString = 'a'.repeat(1000)
      const result = slugify(longString)
      expect(result).toBe(longString)
    })

    it('should handle very long names in getInitials', () => {
      const longName = Array.from({ length: 100 }, (_, i) => `Name${i}`).join(' ')
      const result = getInitials(longName)
      expect(result).toHaveLength(2)
    })

    it('should handle rapid consecutive debounce calls', () => {
      jest.useFakeTimers()
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      for (let i = 0; i < 1000; i++) {
        debouncedFn(i)
      }
      jest.advanceTimersByTime(100)

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith(999)
    })

    it('should handle rapid consecutive throttle calls', () => {
      jest.useFakeTimers()
      const mockFn = jest.fn()
      const throttledFn = throttle(mockFn, 100)

      for (let i = 0; i < 1000; i++) {
        throttledFn(i)
      }

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith(0)
    })
  })
})