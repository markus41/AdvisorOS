import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export interface PasswordValidationResult {
  isValid: boolean
  score: number // 0-100 strength score
  errors: string[]
  suggestions: string[]
}

export interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSymbols: boolean
  maxLength?: number
  disallowCommonPasswords?: boolean
  disallowPersonalInfo?: boolean
}

// Default password policy
export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: true,
  maxLength: 128,
  disallowCommonPasswords: true,
  disallowPersonalInfo: true,
}

// Common passwords list (top 100 most common passwords)
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
  'qwerty123', '1234567', 'superman', 'iloveyou', 'football', 'baseball',
  'welcome123', 'abc123456', 'princess', 'dragon', 'sunshine', 'master',
  'shadow', 'michael', 'computer', 'jessica', 'charlie', 'jennifer',
  'jordan', 'michelle', 'loveme', 'flower', 'secret', 'andrew',
  'andrea', 'joshua', 'orange', 'hunter', 'banana', 'chelsea',
  'matthew', 'amanda', 'daniel', 'summer', 'anthony', 'pepper',
  'freedom', 'ginger', 'nicole', 'hello', 'yellow', 'amanda',
  'chicken', 'purple', 'peter', 'secret', 'andrea', 'dallas',
  'thunder', 'taylor', 'pepper', 'access', 'lovely', 'gabriel',
  'alexander', 'andrew', 'ashley', 'boomer', 'hello123', 'welcome1',
  'qwertyuiop', 'asdfghjkl', 'zxcvbnm', '987654321', '1q2w3e4r',
  '1qaz2wsx', 'zaq12wsx', 'xsw23edc', 'qazwsx', 'wsxedc',
  'edcrfv', 'rfvtgb', 'tgbyhn', 'yhnujm', 'ujmik', 'zaq1xsw2',
  'xsw2cde3', 'cde3vfr4', 'vfr4bgt5', 'bgt5nhy6', 'nhy6mju7',
  'mju7ik', 'password12', 'password123', 'admin123', 'root',
  'user', 'guest', 'test', 'demo', 'sample', 'example'
]

/**
 * Validates password strength against a policy
 */
export function validatePassword(
  password: string,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY,
  personalInfo?: string[]
): PasswordValidationResult {
  const errors: string[] = []
  const suggestions: string[] = []
  let score = 0

  // Length checks
  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`)
  } else {
    score += Math.min(25, (password.length - policy.minLength) * 2)
  }

  if (policy.maxLength && password.length > policy.maxLength) {
    errors.push(`Password must be no more than ${policy.maxLength} characters long`)
  }

  // Character type checks
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)

  if (policy.requireUppercase && !hasUppercase) {
    errors.push('Password must contain at least one uppercase letter (A-Z)')
  } else if (hasUppercase) {
    score += 15
  }

  if (policy.requireLowercase && !hasLowercase) {
    errors.push('Password must contain at least one lowercase letter (a-z)')
  } else if (hasLowercase) {
    score += 15
  }

  if (policy.requireNumbers && !hasNumbers) {
    errors.push('Password must contain at least one number (0-9)')
  } else if (hasNumbers) {
    score += 15
  }

  if (policy.requireSymbols && !hasSymbols) {
    errors.push('Password must contain at least one special character (!@#$%^&*)')
  } else if (hasSymbols) {
    score += 15
  }

  // Check for variety in characters
  const uniqueChars = new Set(password.toLowerCase()).size
  const varietyScore = Math.min(15, (uniqueChars / password.length) * 30)
  score += varietyScore

  // Common password check
  if (policy.disallowCommonPasswords) {
    const lowerPassword = password.toLowerCase()
    if (COMMON_PASSWORDS.includes(lowerPassword)) {
      errors.push('Password is too common. Please choose a more unique password.')
      score = Math.max(0, score - 30)
    }

    // Check for common patterns
    if (/^(.)\1+$/.test(password)) {
      errors.push('Password cannot be all the same character')
      score = Math.max(0, score - 25)
    }

    if (/^(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)+$/i.test(password)) {
      errors.push('Password cannot be a simple sequence')
      score = Math.max(0, score - 25)
    }

    if (/^(qwerty|asdf|zxcv|poiu|lkjh|mnbv)/i.test(password)) {
      errors.push('Password cannot be a keyboard pattern')
      score = Math.max(0, score - 25)
    }
  }

  // Personal information check
  if (policy.disallowPersonalInfo && personalInfo && personalInfo.length > 0) {
    const lowerPassword = password.toLowerCase()
    for (const info of personalInfo) {
      if (info && info.length >= 3 && lowerPassword.includes(info.toLowerCase())) {
        errors.push('Password cannot contain personal information')
        score = Math.max(0, score - 20)
        break
      }
    }
  }

  // Add suggestions based on what's missing
  if (!hasUppercase && !policy.requireUppercase) {
    suggestions.push('Add uppercase letters for better security')
  }
  if (!hasLowercase && !policy.requireLowercase) {
    suggestions.push('Add lowercase letters for better security')
  }
  if (!hasNumbers && !policy.requireNumbers) {
    suggestions.push('Add numbers for better security')
  }
  if (!hasSymbols && !policy.requireSymbols) {
    suggestions.push('Add special characters for better security')
  }
  if (password.length < 12) {
    suggestions.push('Use 12+ characters for optimal security')
  }
  if (uniqueChars < password.length * 0.6) {
    suggestions.push('Use more varied characters')
  }

  return {
    isValid: errors.length === 0,
    score: Math.min(100, Math.max(0, score)),
    errors,
    suggestions,
  }
}

/**
 * Gets password strength label based on score
 */
export function getPasswordStrengthLabel(score: number): {
  label: string
  color: string
  description: string
} {
  if (score >= 90) {
    return {
      label: 'Excellent',
      color: 'green',
      description: 'Very strong password - excellent security'
    }
  } else if (score >= 75) {
    return {
      label: 'Strong',
      color: 'green',
      description: 'Strong password - good security'
    }
  } else if (score >= 60) {
    return {
      label: 'Good',
      color: 'blue',
      description: 'Good password - adequate security'
    }
  } else if (score >= 40) {
    return {
      label: 'Fair',
      color: 'yellow',
      description: 'Fair password - could be stronger'
    }
  } else if (score >= 20) {
    return {
      label: 'Weak',
      color: 'orange',
      description: 'Weak password - improve security'
    }
  } else {
    return {
      label: 'Very Weak',
      color: 'red',
      description: 'Very weak password - poor security'
    }
  }
}

/**
 * Hashes a password using bcrypt
 */
export async function hashPassword(password: string, saltRounds: number = 12): Promise<string> {
  return bcrypt.hash(password, saltRounds)
}

/**
 * Verifies a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Generates a secure random password
 */
export function generateSecurePassword(
  length: number = 16,
  includeSymbols: boolean = true
): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'

  let chars = uppercase + lowercase + numbers
  if (includeSymbols) {
    chars += symbols
  }

  let password = ''

  // Ensure at least one character from each required set
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]

  if (includeSymbols) {
    password += symbols[Math.floor(Math.random() * symbols.length)]
  }

  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)]
  }

  // Shuffle the password to avoid predictable patterns
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

/**
 * Generates multiple password suggestions
 */
export function generatePasswordSuggestions(count: number = 3): string[] {
  const suggestions: string[] = []

  for (let i = 0; i < count; i++) {
    suggestions.push(generateSecurePassword(12 + i * 2, true))
  }

  return suggestions
}

/**
 * Estimates time to crack a password
 */
export function estimateCrackTime(password: string): {
  seconds: number
  display: string
  description: string
} {
  const charset = getCharsetSize(password)
  const combinations = Math.pow(charset, password.length)

  // Assume modern hardware can try 1 billion passwords per second
  const attemptsPerSecond = 1_000_000_000
  const secondsToCrack = combinations / (2 * attemptsPerSecond) // Average case

  return {
    seconds: secondsToCrack,
    display: formatTimeToString(secondsToCrack),
    description: getSecurityDescription(secondsToCrack)
  }
}

function getCharsetSize(password: string): number {
  let size = 0

  if (/[a-z]/.test(password)) size += 26 // lowercase
  if (/[A-Z]/.test(password)) size += 26 // uppercase
  if (/\d/.test(password)) size += 10 // numbers
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) size += 32 // symbols

  return size
}

function formatTimeToString(seconds: number): string {
  if (seconds < 1) return 'Instantly'
  if (seconds < 60) return `${Math.round(seconds)} seconds`
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`
  if (seconds < 2592000) return `${Math.round(seconds / 86400)} days`
  if (seconds < 31536000) return `${Math.round(seconds / 2592000)} months`
  if (seconds < 31536000000) return `${Math.round(seconds / 31536000)} years`

  return 'Centuries'
}

function getSecurityDescription(seconds: number): string {
  if (seconds < 3600) return 'Very Poor - Could be cracked in hours'
  if (seconds < 86400) return 'Poor - Could be cracked in a day'
  if (seconds < 2592000) return 'Fair - Could be cracked in weeks'
  if (seconds < 31536000) return 'Good - Could take months to crack'
  if (seconds < 31536000000) return 'Strong - Could take years to crack'

  return 'Excellent - Would take centuries to crack'
}