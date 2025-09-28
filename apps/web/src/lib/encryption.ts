import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const algorithm = 'aes-256-gcm';
const keyLength = 32;
const ivLength = 16;
const tagLength = 16;
const saltLength = 32;

// Convert scrypt to promise
const scryptAsync = promisify(scrypt);

/**
 * Derive encryption key from password and salt
 */
async function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return (await scryptAsync(password, salt, keyLength)) as Buffer;
}

/**
 * Get encryption password from environment
 */
function getEncryptionPassword(): string {
  const password = process.env.ENCRYPTION_KEY;
  if (!password) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  return password;
}

/**
 * Encrypt sensitive data
 */
export async function encrypt(text: string): Promise<string> {
  try {
    const password = getEncryptionPassword();
    const salt = randomBytes(saltLength);
    const iv = randomBytes(ivLength);

    const key = await deriveKey(password, salt);
    const cipher = createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    // Combine salt, iv, tag, and encrypted data
    const combined = Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(encrypted, 'hex')
    ]);

    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data
 */
export async function decrypt(encryptedData: string): Promise<string> {
  try {
    const password = getEncryptionPassword();
    const combined = Buffer.from(encryptedData, 'base64');

    // Extract components
    const salt = combined.subarray(0, saltLength);
    const iv = combined.subarray(saltLength, saltLength + ivLength);
    const tag = combined.subarray(saltLength + ivLength, saltLength + ivLength + tagLength);
    const encrypted = combined.subarray(saltLength + ivLength + tagLength);

    const key = await deriveKey(password, salt);
    const decipher = createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash sensitive data for comparison (one-way)
 */
export async function hashData(data: string): Promise<string> {
  const salt = randomBytes(saltLength);
  const key = await deriveKey(data, salt);

  // Combine salt and hash
  const combined = Buffer.concat([salt, key]);
  return combined.toString('base64');
}

/**
 * Verify hashed data
 */
export async function verifyHash(data: string, hash: string): Promise<boolean> {
  try {
    const combined = Buffer.from(hash, 'base64');
    const salt = combined.subarray(0, saltLength);
    const storedHash = combined.subarray(saltLength);

    const computedKey = await deriveKey(data, salt);

    return computedKey.equals(storedHash);
  } catch (error) {
    console.error('Hash verification error:', error);
    return false;
  }
}