import crypto from 'crypto'
import { z } from 'zod'

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm'
const KEY_DERIVATION_ALGORITHM = 'pbkdf2'
const KEY_DERIVATION_ITERATIONS = 100000
const IV_LENGTH = 16 // 128-bit IV
const SALT_LENGTH = 32 // 256-bit salt
const TAG_LENGTH = 16 // 128-bit authentication tag

// Environment variables for encryption keys
const MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY
const KEY_ROTATION_SCHEDULE = process.env.KEY_ROTATION_DAYS ? parseInt(process.env.KEY_ROTATION_DAYS) : 90

if (!MASTER_KEY) {
  throw new Error('ENCRYPTION_MASTER_KEY environment variable is required')
}

// Define which fields need encryption
export const ENCRYPTED_FIELDS = {
  user: ['hashedPassword', 'twoFactorSecret', 'socialSecurityNumber'],
  client: ['taxId', 'socialSecurityNumber', 'bankAccountNumber', 'routingNumber'],
  document: ['content', 'metadata.sensitive'],
  organization: ['stripeCustomerId', 'apiKeys', 'webhookSecrets'],
  payment: ['creditCardNumber', 'bankAccountNumber', 'routingNumber'],
  financial: ['accountNumber', 'routingNumber', 'aba', 'swift']
} as const

// Encryption metadata schema
const EncryptionMetadataSchema = z.object({
  algorithm: z.string(),
  keyVersion: z.number(),
  encryptedAt: z.string().datetime(),
  rotationSchedule: z.number().optional()
})

interface EncryptionResult {
  encrypted: string
  metadata: {
    algorithm: string
    keyVersion: number
    encryptedAt: string
    iv: string
    tag: string
    salt: string
  }
}

interface DecryptionResult {
  decrypted: string
  metadata: {
    algorithm: string
    keyVersion: number
    encryptedAt: string
  }
}

export class EncryptionService {
  private keyCache = new Map<number, Buffer>()
  private currentKeyVersion: number

  constructor() {
    this.currentKeyVersion = this.getCurrentKeyVersion()
    this.initializeKeys()
  }

  /**
   * Encrypt sensitive data
   */
  async encrypt(
    plaintext: string,
    context?: { fieldName?: string; entityType?: string }
  ): Promise<EncryptionResult> {
    if (!plaintext || typeof plaintext !== 'string') {
      throw new Error('Invalid plaintext for encryption')
    }

    try {
      // Generate unique salt and IV for each encryption
      const salt = crypto.randomBytes(SALT_LENGTH)
      const iv = crypto.randomBytes(IV_LENGTH)

      // Derive encryption key
      const encryptionKey = await this.deriveKey(this.currentKeyVersion, salt)

      // Create cipher
      const cipher = crypto.createCipher(ENCRYPTION_ALGORITHM, encryptionKey)
      cipher.setAAD(Buffer.from(JSON.stringify(context || {}))) // Additional authenticated data

      // Encrypt data
      let encrypted = cipher.update(plaintext, 'utf8', 'base64')
      encrypted += cipher.final('base64')

      // Get authentication tag
      const tag = cipher.getAuthTag()

      // Combine encrypted data with metadata
      const result: EncryptionResult = {
        encrypted,
        metadata: {
          algorithm: ENCRYPTION_ALGORITHM,
          keyVersion: this.currentKeyVersion,
          encryptedAt: new Date().toISOString(),
          iv: iv.toString('base64'),
          tag: tag.toString('base64'),
          salt: salt.toString('base64')
        }
      }

      return result
    } catch (error) {
      console.error('Encryption error:', error)
      throw new Error('Failed to encrypt data')
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decrypt(
    encryptedData: string,
    metadata: any,
    context?: { fieldName?: string; entityType?: string }
  ): Promise<DecryptionResult> {
    if (!encryptedData || !metadata) {
      throw new Error('Invalid encrypted data or metadata')
    }

    try {
      // Validate metadata
      const validatedMetadata = EncryptionMetadataSchema.parse(metadata)

      // Check if key rotation is needed
      if (this.shouldRotateKey(validatedMetadata)) {
        console.warn(`Key rotation needed for data encrypted at ${validatedMetadata.encryptedAt}`)
      }

      // Get encryption key for the specific version
      const salt = Buffer.from(metadata.salt, 'base64')
      const encryptionKey = await this.deriveKey(metadata.keyVersion, salt)

      // Extract IV and tag
      const iv = Buffer.from(metadata.iv, 'base64')
      const tag = Buffer.from(metadata.tag, 'base64')

      // Create decipher
      const decipher = crypto.createDecipher(metadata.algorithm, encryptionKey)
      decipher.setAuthTag(tag)
      decipher.setAAD(Buffer.from(JSON.stringify(context || {}))) // Additional authenticated data

      // Decrypt data
      let decrypted = decipher.update(encryptedData, 'base64', 'utf8')
      decrypted += decipher.final('utf8')

      return {
        decrypted,
        metadata: {
          algorithm: metadata.algorithm,
          keyVersion: metadata.keyVersion,
          encryptedAt: metadata.encryptedAt
        }
      }
    } catch (error) {
      console.error('Decryption error:', error)
      throw new Error('Failed to decrypt data')
    }
  }

  /**
   * Encrypt an object with specific field encryption
   */
  async encryptObject(
    obj: Record<string, any>,
    entityType: keyof typeof ENCRYPTED_FIELDS
  ): Promise<Record<string, any>> {
    const fieldsToEncrypt = ENCRYPTED_FIELDS[entityType] || []
    const result = { ...obj }

    for (const fieldPath of fieldsToEncrypt) {
      const value = this.getNestedValue(obj, fieldPath)

      if (value && typeof value === 'string') {
        const encrypted = await this.encrypt(value, {
          fieldName: fieldPath,
          entityType
        })

        // Store encrypted data and metadata
        this.setNestedValue(result, fieldPath, encrypted.encrypted)
        this.setNestedValue(result, `${fieldPath}_encryption`, encrypted.metadata)
      }
    }

    return result
  }

  /**
   * Decrypt an object with specific field decryption
   */
  async decryptObject(
    obj: Record<string, any>,
    entityType: keyof typeof ENCRYPTED_FIELDS
  ): Promise<Record<string, any>> {
    const fieldsToDecrypt = ENCRYPTED_FIELDS[entityType] || []
    const result = { ...obj }

    for (const fieldPath of fieldsToDecrypt) {
      const encryptedValue = this.getNestedValue(obj, fieldPath)
      const metadata = this.getNestedValue(obj, `${fieldPath}_encryption`)

      if (encryptedValue && metadata) {
        try {
          const decrypted = await this.decrypt(encryptedValue, metadata, {
            fieldName: fieldPath,
            entityType
          })

          this.setNestedValue(result, fieldPath, decrypted.decrypted)
          // Remove encryption metadata from result
          delete result[`${fieldPath}_encryption`]
        } catch (error) {
          console.error(`Failed to decrypt field ${fieldPath}:`, error)
          // Keep encrypted value if decryption fails
        }
      }
    }

    return result
  }

  /**
   * Hash sensitive data (one-way encryption)
   */
  async hashSensitiveData(
    data: string,
    purpose: 'password' | 'token' | 'identifier'
  ): Promise<{ hash: string; salt: string; algorithm: string }> {
    const salt = crypto.randomBytes(SALT_LENGTH)

    let algorithm: string
    let iterations: number

    switch (purpose) {
      case 'password':
        algorithm = 'sha512'
        iterations = KEY_DERIVATION_ITERATIONS
        break
      case 'token':
        algorithm = 'sha256'
        iterations = 10000
        break
      case 'identifier':
        algorithm = 'sha256'
        iterations = 1000
        break
    }

    const hash = crypto.pbkdf2Sync(data, salt, iterations, 64, algorithm)

    return {
      hash: hash.toString('base64'),
      salt: salt.toString('base64'),
      algorithm: `pbkdf2:${algorithm}:${iterations}`
    }
  }

  /**
   * Verify hashed data
   */
  async verifyHashedData(
    data: string,
    storedHash: string,
    salt: string,
    algorithm: string
  ): Promise<boolean> {
    try {
      const [method, hashAlg, iterationsStr] = algorithm.split(':')
      const iterations = parseInt(iterationsStr)

      if (method !== 'pbkdf2') {
        throw new Error('Unsupported hash algorithm')
      }

      const saltBuffer = Buffer.from(salt, 'base64')
      const computedHash = crypto.pbkdf2Sync(data, saltBuffer, iterations, 64, hashAlg)
      const computedHashBase64 = computedHash.toString('base64')

      // Use timingSafeEqual to prevent timing attacks
      return crypto.timingSafeEqual(
        Buffer.from(storedHash, 'base64'),
        Buffer.from(computedHashBase64, 'base64')
      )
    } catch (error) {
      console.error('Hash verification error:', error)
      return false
    }
  }

  /**
   * Generate secure random tokens
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64url')
  }

  /**
   * Generate cryptographic keys
   */
  generateCryptographicKey(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }

  /**
   * Encrypt data for database storage
   */
  async encryptForStorage(
    data: any,
    tableName: string,
    fieldName: string
  ): Promise<{ data: string; metadata: string }> {
    const serializedData = JSON.stringify(data)
    const encrypted = await this.encrypt(serializedData, {
      fieldName,
      entityType: tableName as keyof typeof ENCRYPTED_FIELDS
    })

    return {
      data: encrypted.encrypted,
      metadata: JSON.stringify(encrypted.metadata)
    }
  }

  /**
   * Decrypt data from database storage
   */
  async decryptFromStorage(
    encryptedData: string,
    metadata: string,
    tableName: string,
    fieldName: string
  ): Promise<any> {
    const metadataObj = JSON.parse(metadata)
    const decrypted = await this.decrypt(encryptedData, metadataObj, {
      fieldName,
      entityType: tableName as keyof typeof ENCRYPTED_FIELDS
    })

    return JSON.parse(decrypted.decrypted)
  }

  /**
   * Rotate encryption keys
   */
  async rotateKeys(): Promise<{ oldVersion: number; newVersion: number }> {
    const oldVersion = this.currentKeyVersion
    this.currentKeyVersion = this.generateNewKeyVersion()

    // Initialize new key
    await this.deriveKey(this.currentKeyVersion, crypto.randomBytes(SALT_LENGTH))

    console.log(`Encryption keys rotated from version ${oldVersion} to ${this.currentKeyVersion}`)

    return {
      oldVersion,
      newVersion: this.currentKeyVersion
    }
  }

  /**
   * Re-encrypt data with new key version
   */
  async reencryptData(
    encryptedData: string,
    metadata: any,
    context?: { fieldName?: string; entityType?: string }
  ): Promise<EncryptionResult> {
    // Decrypt with old key
    const decrypted = await this.decrypt(encryptedData, metadata, context)

    // Encrypt with current key
    return await this.encrypt(decrypted.decrypted, context)
  }

  // Private methods

  private async deriveKey(keyVersion: number, salt: Buffer): Promise<Buffer> {
    const cacheKey = `${keyVersion}:${salt.toString('base64')}`

    if (this.keyCache.has(keyVersion)) {
      return this.keyCache.get(keyVersion)!
    }

    const baseKey = Buffer.from(MASTER_KEY!, 'base64')
    const versionedKey = Buffer.concat([baseKey, Buffer.from(keyVersion.toString())])

    const derivedKey = crypto.pbkdf2Sync(
      versionedKey,
      salt,
      KEY_DERIVATION_ITERATIONS,
      32, // 256-bit key
      'sha512'
    )

    this.keyCache.set(keyVersion, derivedKey)
    return derivedKey
  }

  private initializeKeys(): void {
    // Initialize current key version
    const salt = crypto.randomBytes(SALT_LENGTH)
    this.deriveKey(this.currentKeyVersion, salt)
  }

  private getCurrentKeyVersion(): number {
    // In production, this would be stored in a secure key management system
    // For now, use a simple version based on date
    const epochDays = Math.floor(Date.now() / (1000 * 60 * 60 * 24))
    return Math.floor(epochDays / KEY_ROTATION_SCHEDULE)
  }

  private generateNewKeyVersion(): number {
    return this.currentKeyVersion + 1
  }

  private shouldRotateKey(metadata: any): boolean {
    const encryptedDate = new Date(metadata.encryptedAt)
    const daysSinceEncryption = Math.floor((Date.now() - encryptedDate.getTime()) / (1000 * 60 * 60 * 24))

    return daysSinceEncryption > KEY_ROTATION_SCHEDULE
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    const lastKey = keys.pop()!
    const target = keys.reduce((current, key) => {
      if (!(key in current)) {
        current[key] = {}
      }
      return current[key]
    }, obj)
    target[lastKey] = value
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService()

// Export types
export type { EncryptionResult, DecryptionResult }