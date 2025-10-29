/**
 * API Keys Service
 * 
 * Handles storage and retrieval of encrypted API keys for third-party integrations
 */

import pool from '../db/client';
import { encrypt, decrypt, maskValue } from '../utils/encryption';

export interface APIKey {
  id: number;
  keyName: string;
  keyValue: string; // Encrypted in database
  category?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: number;
  updatedBy?: number;
}

export interface APIKeyInput {
  keyName: string;
  keyValue: string; // Plain text (will be encrypted)
  category?: string;
  description?: string;
  isActive?: boolean;
}

/**
 * Get all API keys (returns masked values for security)
 * 
 * @param includeValues - If true, return decrypted values (use carefully!)
 * @returns Object with key-value pairs
 */
export async function getAllAPIKeys(includeValues: boolean = false): Promise<Record<string, string>> {
  const client = await pool.connect();
  
  try {
    const result = await client.query<APIKey>(
      'SELECT * FROM api_keys WHERE is_active = true ORDER BY category, key_name'
    );
    
    const keys: Record<string, string> = {};
    
    for (const row of result.rows) {
      if (includeValues) {
        // Decrypt the value
        try {
          keys[row.keyName] = decrypt(row.keyValue);
        } catch (error) {
          console.error(`Failed to decrypt key: ${row.keyName}`, error);
          keys[row.keyName] = '';
        }
      } else {
        // Return masked value for display
        try {
          const decrypted = decrypt(row.keyValue);
          keys[row.keyName] = maskValue(decrypted);
        } catch (error) {
          console.error(`Failed to decrypt key: ${row.keyName}`, error);
          keys[row.keyName] = '••••••••';
        }
      }
    }
    
    return keys;
  } finally {
    client.release();
  }
}

/**
 * Get a single API key by name
 * 
 * @param keyName - Name of the key to retrieve
 * @param decrypt - If true, return decrypted value
 * @returns Decrypted key value or null if not found
 */
export async function getAPIKey(keyName: string, decryptValue: boolean = true): Promise<string | null> {
  const client = await pool.connect();
  
  try {
    const result = await client.query<APIKey>(
      'SELECT key_value FROM api_keys WHERE key_name = $1 AND is_active = true',
      [keyName]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const encryptedValue = result.rows[0].keyValue;
    
    if (decryptValue) {
      try {
        return decrypt(encryptedValue);
      } catch (error) {
        console.error(`Failed to decrypt key: ${keyName}`, error);
        return null;
      }
    }
    
    return encryptedValue;
  } finally {
    client.release();
  }
}

/**
 * Set or update an API key
 * 
 * @param keyName - Name of the key
 * @param keyValue - Plain text value (will be encrypted)
 * @param options - Additional options
 * @param adminUserId - ID of admin user making the change
 * @returns Created or updated key
 */
export async function setAPIKey(
  keyName: string,
  keyValue: string,
  options: {
    category?: string;
    description?: string;
    isActive?: boolean;
  } = {},
  adminUserId?: number
): Promise<APIKey> {
  const client = await pool.connect();
  
  try {
    // Encrypt the value
    const encryptedValue = encrypt(keyValue);
    
    // Check if key exists
    const existing = await client.query(
      'SELECT id FROM api_keys WHERE key_name = $1',
      [keyName]
    );
    
    if (existing.rows.length > 0) {
      // Update existing key
      const result = await client.query<APIKey>(
        `UPDATE api_keys 
         SET key_value = $1, 
             category = COALESCE($2, category),
             description = COALESCE($3, description),
             is_active = COALESCE($4, is_active),
             updated_by = $5,
             updated_at = CURRENT_TIMESTAMP
         WHERE key_name = $6
         RETURNING *`,
        [
          encryptedValue,
          options.category,
          options.description,
          options.isActive,
          adminUserId,
          keyName
        ]
      );
      
      return result.rows[0];
    } else {
      // Insert new key
      const result = await client.query<APIKey>(
        `INSERT INTO api_keys (key_name, key_value, category, description, is_active, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $6)
         RETURNING *`,
        [
          keyName,
          encryptedValue,
          options.category,
          options.description,
          options.isActive !== undefined ? options.isActive : true,
          adminUserId
        ]
      );
      
      return result.rows[0];
    }
  } finally {
    client.release();
  }
}

/**
 * Set multiple API keys at once
 * 
 * @param keys - Object with key-value pairs
 * @param adminUserId - ID of admin user making the changes
 * @returns Number of keys updated
 */
export async function setMultipleAPIKeys(
  keys: Record<string, string>,
  adminUserId?: number
): Promise<number> {
  let count = 0;
  
  for (const [keyName, keyValue] of Object.entries(keys)) {
    if (keyValue && keyValue.trim()) {
      // Determine category based on key name prefix
      const category = getCategoryFromKeyName(keyName);
      
      await setAPIKey(
        keyName,
        keyValue,
        { category, isActive: true },
        adminUserId
      );
      
      count++;
    }
  }
  
  return count;
}

/**
 * Delete an API key
 * 
 * @param keyName - Name of the key to delete
 * @returns True if deleted, false if not found
 */
export async function deleteAPIKey(keyName: string): Promise<boolean> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'DELETE FROM api_keys WHERE key_name = $1',
      [keyName]
    );
    
    return result.rowCount ? result.rowCount > 0 : false;
  } finally {
    client.release();
  }
}

/**
 * Soft delete (deactivate) an API key
 * 
 * @param keyName - Name of the key to deactivate
 * @returns True if deactivated, false if not found
 */
export async function deactivateAPIKey(keyName: string): Promise<boolean> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'UPDATE api_keys SET is_active = false WHERE key_name = $1',
      [keyName]
    );
    
    return result.rowCount ? result.rowCount > 0 : false;
  } finally {
    client.release();
  }
}

/**
 * Get category from key name
 * Helper function to automatically categorize keys
 */
function getCategoryFromKeyName(keyName: string): string {
  const lower = keyName.toLowerCase();
  
  if (lower.includes('stripe') || lower.includes('paypal')) return 'payment';
  if (lower.includes('twilio') || lower.includes('sendgrid') || lower.includes('mailgun')) return 'communication';
  if (lower.includes('openai') || lower.includes('anthropic')) return 'ai';
  if (lower.includes('analytics') || lower.includes('pixel') || lower.includes('mixpanel')) return 'analytics';
  if (lower.includes('shippo') || lower.includes('easypost') || lower.includes('shipstation')) return 'shipping';
  if (lower.includes('aws') || lower.includes('s3') || lower.includes('cloudflare')) return 'storage';
  if (lower.includes('algolia')) return 'search';
  if (lower.includes('klaviyo') || lower.includes('mailchimp') || lower.includes('hubspot')) return 'marketing';
  
  return 'other';
}

/**
 * Validate required API keys for specific features
 * 
 * @param feature - Feature name (e.g., 'stripe', 'openai')
 * @returns Object with validation results
 */
export async function validateAPIKeysForFeature(
  feature: string
): Promise<{ valid: boolean; missing: string[] }> {
  const requiredKeys: Record<string, string[]> = {
    stripe: ['stripe_secret_key'],
    paypal: ['paypal_client_id', 'paypal_secret'],
    openai: ['openai_api_key'],
    twilio: ['twilio_account_sid', 'twilio_auth_token'],
    sendgrid: ['sendgrid_api_key'],
    aws_s3: ['aws_access_key_id', 'aws_secret_access_key', 'aws_s3_bucket']
  };
  
  const required = requiredKeys[feature] || [];
  const missing: string[] = [];
  
  for (const keyName of required) {
    const value = await getAPIKey(keyName);
    if (!value) {
      missing.push(keyName);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing
  };
}

