import {
  validatePassword,
  getPasswordStrengthLabel,
  hashPassword,
  verifyPassword,
  generateSecurePassword,
  generatePasswordSuggestions,
  estimateCrackTime,
  DEFAULT_PASSWORD_POLICY,
  PasswordPolicy,
} from '@/lib/auth/password-utils'

describe('Password Utils', () => {
  describe('validatePassword', () => {
    it('should validate strong passwords correctly', () => {
      const result = validatePassword('MyStr0ng!Pass123')

      expect(result.isValid).toBe(true)
      expect(result.score).toBeGreaterThan(70)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject passwords that are too short', () => {
      const result = validatePassword('Short1!')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must be at least 8 characters long')
    })

    it('should reject passwords without uppercase letters', () => {
      const policy: PasswordPolicy = { ...DEFAULT_PASSWORD_POLICY, requireUppercase: true };
      const result = validatePassword('lowercase123!', policy)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one uppercase letter (A-Z)')
    })

    it('should reject passwords without lowercase letters', () => {
      const policy: PasswordPolicy = { ...DEFAULT_PASSWORD_POLICY, requireLowercase: true };
      const result = validatePassword('UPPERCASE123!', policy)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one lowercase letter (a-z)')
    })

    it('should reject passwords without numbers', () => {
      const policy: PasswordPolicy = { ...DEFAULT_PASSWORD_POLICY, requireNumbers: true };
      const result = validatePassword('NoNumbers!Here', policy)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one number (0-9)')
    })

    it('should reject passwords without symbols', () => {
      const policy: PasswordPolicy = { ...DEFAULT_PASSWORD_POLICY, requireSymbols: true };
      const result = validatePassword('NoSymbolsHere123', policy)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one special character (!@#$%^&*)')
    })

    it('should reject common passwords', () => {
      const result = validatePassword('password123')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password is too common. Please choose a more unique password.')
    })

    it('should reject passwords with personal information', () => {
      const personalInfo = ['john', 'doe', 'johndoe@email.com']
      const result = validatePassword('JohnDoe123!', DEFAULT_PASSWORD_POLICY, personalInfo)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password cannot contain personal information')
    })

    it('should reject passwords that are all the same character', () => {
      const result = validatePassword('aaaaaaaa')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password cannot be all the same character')
    })

    it('should reject simple sequences', () => {
      const result = validatePassword('123456789')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password cannot be a simple sequence')
    })

    it('should reject keyboard patterns', () => {
      const result = validatePassword('qwerty123')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password cannot be a keyboard pattern')
    })

    it('should provide helpful suggestions', () => {
      const result = validatePassword('simple')

      expect(result.suggestions.length).toBeGreaterThan(0)
      expect(result.suggestions).toContain('Add uppercase letters for better security')
      expect(result.suggestions).toContain('Add numbers for better security')
      expect(result.suggestions).toContain('Add special characters for better security')
    })

    it('should handle custom password policies', () => {
      const customPolicy: PasswordPolicy = {
        minLength: 12,
        requireUppercase: false,
        requireLowercase: true,
        requireNumbers: true,
        requireSymbols: false,
        disallowCommonPasswords: false,
      }

      const result = validatePassword('lowercaseonly123', customPolicy)

      expect(result.isValid).toBe(true)
    })

    it('should enforce maximum length when specified', () => {
      const policy: PasswordPolicy = { ...DEFAULT_PASSWORD_POLICY, maxLength: 10 };
      const result = validatePassword('ThisPasswordIsTooLong123!', policy)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must be no more than 10 characters long')
    })

    it('should calculate score correctly for excellent passwords', () => {
      const result = validatePassword('Exc3ll3nt!P@ssw0rd#With$Variety')

      expect(result.score).toBeGreaterThanOrEqual(90)
    })

    it('should calculate score correctly for weak passwords', () => {
      const result = validatePassword('weak')

      expect(result.score).toBeLessThan(30)
    })
  })

  describe('getPasswordStrengthLabel', () => {
    it('should return correct labels for different score ranges', () => {
      expect(getPasswordStrengthLabel(95).label).toBe('Excellent')
      expect(getPasswordStrengthLabel(95).color).toBe('green')

      expect(getPasswordStrengthLabel(80).label).toBe('Strong')
      expect(getPasswordStrengthLabel(80).color).toBe('green')

      expect(getPasswordStrengthLabel(65).label).toBe('Good')
      expect(getPasswordStrengthLabel(65).color).toBe('blue')

      expect(getPasswordStrengthLabel(50).label).toBe('Fair')
      expect(getPasswordStrengthLabel(50).color).toBe('yellow')

      expect(getPasswordStrengthLabel(30).label).toBe('Weak')
      expect(getPasswordStrengthLabel(30).color).toBe('orange')

      expect(getPasswordStrengthLabel(10).label).toBe('Very Weak')
      expect(getPasswordStrengthLabel(10).color).toBe('red')
    })

    it('should provide appropriate descriptions', () => {
      expect(getPasswordStrengthLabel(95).description).toContain('excellent security')
      expect(getPasswordStrengthLabel(30).description).toContain('improve security')
      expect(getPasswordStrengthLabel(10).description).toContain('poor security')
    })
  })

  describe('hashPassword', () => {
    it('should hash passwords using bcrypt', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)

      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true)
    })

    it('should use custom salt rounds', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password, 10)

      expect(hash).toBeDefined()
      expect(hash.includes('$10$')).toBe(true)
    })

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123!'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('verifyPassword', () => {
    it('should verify correct passwords', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)

      const isValid = await verifyPassword(password, hash)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect passwords', async () => {
      const password = 'TestPassword123!'
      const wrongPassword = 'WrongPassword123!'
      const hash = await hashPassword(password)

      const isValid = await verifyPassword(wrongPassword, hash)
      expect(isValid).toBe(false)
    })

    it('should handle empty passwords', async () => {
      const hash = await hashPassword('ValidPassword123!')

      const isValid = await verifyPassword('', hash)
      expect(isValid).toBe(false)
    })
  })

  describe('generateSecurePassword', () => {
    it('should generate passwords of correct length', () => {
      const password = generateSecurePassword(16)
      expect(password).toHaveLength(16)
    })

    it('should generate passwords with uppercase letters', () => {
      const password = generateSecurePassword()
      expect(/[A-Z]/.test(password)).toBe(true)
    })

    it('should generate passwords with lowercase letters', () => {
      const password = generateSecurePassword()
      expect(/[a-z]/.test(password)).toBe(true)
    })

    it('should generate passwords with numbers', () => {
      const password = generateSecurePassword()
      expect(/\d/.test(password)).toBe(true)
    })

    it('should generate passwords with symbols when requested', () => {
      const password = generateSecurePassword(16, true)
      expect(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)).toBe(true)
    })

    it('should generate passwords without symbols when not requested', () => {
      const password = generateSecurePassword(16, false)
      expect(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)).toBe(false)
    })

    it('should generate different passwords each time', () => {
      const password1 = generateSecurePassword()
      const password2 = generateSecurePassword()
      expect(password1).not.toBe(password2)
    })

    it('should generate valid passwords according to default policy', () => {
      const password = generateSecurePassword()
      const validation = validatePassword(password)
      expect(validation.isValid).toBe(true)
    })
  })

  describe('generatePasswordSuggestions', () => {
    it('should generate the correct number of suggestions', () => {
      const suggestions = generatePasswordSuggestions(5)
      expect(suggestions).toHaveLength(5)
    })

    it('should generate unique suggestions', () => {
      const suggestions = generatePasswordSuggestions(3)
      const uniqueSuggestions = new Set(suggestions)
      expect(uniqueSuggestions.size).toBe(3)
    })

    it('should generate passwords of increasing length', () => {
      const suggestions = generatePasswordSuggestions(3)
      expect(suggestions[0].length).toBe(12)
      expect(suggestions[1].length).toBe(14)
      expect(suggestions[2].length).toBe(16)
    })

    it('should generate valid passwords', () => {
      const suggestions = generatePasswordSuggestions()
      suggestions.forEach(password => {
        const validation = validatePassword(password)
        expect(validation.isValid).toBe(true)
      })
    })
  })

  describe('estimateCrackTime', () => {
    it('should estimate crack time for weak passwords', () => {
      const result = estimateCrackTime('password')
      expect(result.seconds).toBeLessThan(86400) // Less than a day
      expect(result.display).toContain('seconds' || 'minutes' || 'hours')
      expect(result.description).toContain('Poor' || 'Very Poor')
    })

    it('should estimate crack time for strong passwords', () => {
      const result = estimateCrackTime('Str0ng!P@ssw0rd#With$Symbols&Numbers123')
      expect(result.seconds).toBeGreaterThan(31536000) // More than a year
      expect(result.description).toContain('Strong' || 'Excellent')
    })

    it('should handle very short passwords', () => {
      const result = estimateCrackTime('a')
      expect(result.display).toBe('Instantly')
      expect(result.description).toContain('Very Poor')
    })

    it('should provide meaningful time displays', () => {
      const shortResult = estimateCrackTime('short')
      const longResult = estimateCrackTime('VeryLongAndComplexPassword123!@#')

      expect(shortResult.display).toBeDefined()
      expect(longResult.display).toBeDefined()
      expect(shortResult.seconds).toBeLessThan(longResult.seconds)
    })

    it('should calculate different times for different character sets', () => {
      const numbersOnly = estimateCrackTime('123456789012')
      const mixedChars = estimateCrackTime('Abc123!@#$%^')

      expect(mixedChars.seconds).toBeGreaterThan(numbersOnly.seconds)
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle empty password validation', () => {
      const result = validatePassword('')
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should handle null/undefined personal info', () => {
      const result = validatePassword('TestPassword123!', DEFAULT_PASSWORD_POLICY, undefined)
      expect(result).toBeDefined()
    })

    it('should handle empty personal info array', () => {
      const result = validatePassword('TestPassword123!', DEFAULT_PASSWORD_POLICY, [])
      expect(result).toBeDefined()
    })

    it('should handle very long passwords', () => {
      const longPassword = 'A'.repeat(1000) + '1!'
      const result = validatePassword(longPassword)
      expect(result).toBeDefined()
    })

    it('should handle passwords with unicode characters', () => {
      const unicodePassword = 'Pássw0rd123!🔒'
      const result = validatePassword(unicodePassword)
      expect(result).toBeDefined()
    })

    it('should handle extreme crack time calculations', () => {
      const extremePassword = 'A'.repeat(50) + '1!@#$%'
      const result = estimateCrackTime(extremePassword)
      expect(result.display).toBe('Centuries')
    })
  })

  describe('Performance tests', () => {
    it('should validate passwords quickly', () => {
      const start = Date.now()
      for (let i = 0; i < 100; i++) {
        validatePassword(`TestPassword${i}!`)
      }
      const end = Date.now()
      expect(end - start).toBeLessThan(1000) // Should complete in under 1 second
    })

    it('should generate passwords quickly', () => {
      const start = Date.now()
      for (let i = 0; i < 100; i++) {
        generateSecurePassword()
      }
      const end = Date.now()
      expect(end - start).toBeLessThan(500) // Should complete in under 0.5 seconds
    })
  })
})