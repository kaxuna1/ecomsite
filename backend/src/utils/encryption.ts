/**
 * Encryption Utility
 * 
 * Provides secure encryption/decryption for sensitive data like API keys
 * Uses AES-256-GCM encryption algorithm
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES, this is always 16
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000; // PBKDF2 iterations

/**
 * Get encryption key from environment or generate one
 */
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    console.warn(
      '⚠️  WARNING: ENCRYPTION_KEY not set in environment variables. ' +
      'Using a default key which is NOT SECURE for production!'
    );
    // Default key for development - NEVER use in production
    return 'dev-encryption-key-change-in-production-please-use-strong-key';
  }
  
  return key;
}

/**
 * Derive a key from the master key using PBKDF2
 */
function deriveKey(masterKey: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(
    masterKey,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    'sha512'
  );
}

/**
 * Encrypt a string value
 * 
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format: salt:iv:tag:encryptedData (all hex encoded)
 */
export function encrypt(text: string): string {
  if (!text) {
    return '';
  }

  try {
    const masterKey = getEncryptionKey();
    
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Derive key from master key
    const key = deriveKey(masterKey, salt);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag
    const tag = cipher.getAuthTag();
    
    // Return format: salt:iv:tag:encryptedData
    return [
      salt.toString('hex'),
      iv.toString('hex'),
      tag.toString('hex'),
      encrypted
    ].join(':');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt an encrypted string
 * 
 * @param encryptedText - Encrypted string in format: salt:iv:tag:encryptedData
 * @returns Decrypted plain text
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) {
    return '';
  }

  try {
    const masterKey = getEncryptionKey();
    
    // Split the encrypted text
    const parts = encryptedText.split(':');
    
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }
    
    const [saltHex, ivHex, tagHex, encrypted] = parts;
    
    // Convert from hex
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    
    // Derive key from master key
    const key = deriveKey(masterKey, salt);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    // Decrypt the text
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Mask a sensitive value for display
 * Shows first and last few characters, masks the middle
 * 
 * @param value - Value to mask
 * @param showChars - Number of characters to show at start/end (default: 4)
 * @returns Masked string
 */
export function maskValue(value: string, showChars: number = 4): string {
  if (!value) {
    return '';
  }
  
  if (value.length <= showChars * 2) {
    return '•'.repeat(8);
  }
  
  const start = value.substring(0, showChars);
  const end = value.substring(value.length - showChars);
  const maskLength = Math.min(value.length - (showChars * 2), 12);
  
  return `${start}${'•'.repeat(maskLength)}${end}`;
}

/**
 * Generate a secure random key
 * Useful for generating encryption keys
 * 
 * @param length - Length in bytes (default: 32 for 256-bit)
 * @returns Hex-encoded random key
 */
export function generateSecureKey(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a value using SHA-256
 * Useful for creating key identifiers
 * 
 * @param value - Value to hash
 * @returns Hex-encoded hash
 */
export function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

