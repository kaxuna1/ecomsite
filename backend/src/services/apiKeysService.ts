/**
 * API Keys Service
 *
 * Handles storage and retrieval of encrypted API keys for third-party integrations
 */

import { pool } from '../db/client';
import { encrypt, decrypt, maskValue } from '../utils/encryption';

export interface APIKey {
  id: number;
  key_name: string;  // snake_case to match PostgreSQL
  key_value: string; // Encrypted in database
  category?: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  created_by?: number;
  updated_by?: number;
}

export interface APIKeyInput {
  keyName: string;
  keyValue: string; // Plain text (will be encrypted)
  category?: string;
  description?: string;
  isActive?: boolean;
}

export interface AuditLogEntry {
  keyName: string;
  action: 'created' | 'updated' | 'deleted' | 'deactivated' | 'accessed' | 'decrypted';
  adminUserId?: number;
  adminUserEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, any>;
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
          keys[row.key_name] = decrypt(row.key_value);
        } catch (error) {
          console.error(`Failed to decrypt key: ${row.key_name}`, error);
          keys[row.key_name] = '';
        }
      } else {
        // Return masked value for display
        try {
          const decrypted = decrypt(row.key_value);
          keys[row.key_name] = maskValue(decrypted);
        } catch (error) {
          console.error(`Failed to decrypt key: ${row.key_name}`, error);
          keys[row.key_name] = '••••••••';
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
 * @param decryptValue - If true, return decrypted value
 * @param auditContext - Optional context for audit logging when decrypting
 * @returns Decrypted key value or null if not found
 */
export async function getAPIKey(
  keyName: string,
  decryptValue: boolean = true,
  auditContext?: { adminUserId?: number; adminUserEmail?: string; ipAddress?: string; userAgent?: string }
): Promise<string | null> {
  const client = await pool.connect();

  try {
    const result = await client.query<APIKey>(
      'SELECT key_value FROM api_keys WHERE key_name = $1 AND is_active = true',
      [keyName]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const encryptedValue = result.rows[0].key_value;

    if (decryptValue) {
      try {
        const decryptedValue = decrypt(encryptedValue);

        // Log audit entry for decryption (only if audit context provided)
        if (auditContext && (auditContext.adminUserId || auditContext.adminUserEmail)) {
          await logAuditEntry({
            keyName,
            action: 'decrypted',
            adminUserId: auditContext.adminUserId,
            adminUserEmail: auditContext.adminUserEmail,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
            metadata: { masked_value: maskValue(decryptedValue) }
          });
        }

        return decryptedValue;
      } catch (error) {
        console.error(`Failed to decrypt key: ${keyName}`, error);
        return null;
      }
    }

    // Log access even without decryption
    if (auditContext && (auditContext.adminUserId || auditContext.adminUserEmail)) {
      await logAuditEntry({
        keyName,
        action: 'accessed',
        adminUserId: auditContext.adminUserId,
        adminUserEmail: auditContext.adminUserEmail,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent
      });
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
 * @param auditContext - Optional context for audit logging (IP, user agent, email)
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
  adminUserId?: number,
  auditContext?: { ipAddress?: string; userAgent?: string; adminUserEmail?: string }
): Promise<APIKey> {
  const client = await pool.connect();

  try {
    // Encrypt the value
    const encryptedValue = encrypt(keyValue);

    // Check if key exists
    const existing = await client.query(
      'SELECT id, key_value FROM api_keys WHERE key_name = $1',
      [keyName]
    );

    let result: any;
    let action: 'created' | 'updated';

    if (existing.rows.length > 0) {
      // Update existing key
      action = 'updated';
      result = await client.query<APIKey>(
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

      // Log audit entry for update
      await logAuditEntry({
        keyName,
        action: 'updated',
        adminUserId,
        adminUserEmail: auditContext?.adminUserEmail,
        ipAddress: auditContext?.ipAddress,
        userAgent: auditContext?.userAgent,
        oldValue: maskValue(decrypt(existing.rows[0].key_value)),
        newValue: maskValue(keyValue),
        metadata: { category: options.category, description: options.description }
      });
    } else {
      // Insert new key
      action = 'created';
      result = await client.query<APIKey>(
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

      // Log audit entry for creation
      await logAuditEntry({
        keyName,
        action: 'created',
        adminUserId,
        adminUserEmail: auditContext?.adminUserEmail,
        ipAddress: auditContext?.ipAddress,
        userAgent: auditContext?.userAgent,
        newValue: maskValue(keyValue),
        metadata: { category: options.category, description: options.description }
      });
    }

    return result.rows[0];
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
 * @param auditContext - Optional context for audit logging
 * @returns True if deleted, false if not found
 */
export async function deleteAPIKey(
  keyName: string,
  auditContext?: { adminUserId?: number; adminUserEmail?: string; ipAddress?: string; userAgent?: string }
): Promise<boolean> {
  const client = await pool.connect();

  try {
    // Get the key before deleting for audit log
    const existing = await client.query<APIKey>(
      'SELECT key_value FROM api_keys WHERE key_name = $1',
      [keyName]
    );

    const result = await client.query(
      'DELETE FROM api_keys WHERE key_name = $1',
      [keyName]
    );

    const deleted = result.rowCount ? result.rowCount > 0 : false;

    // Log audit entry for deletion
    if (deleted && auditContext) {
      const oldValue = existing.rows[0]?.key_value
        ? maskValue(decrypt(existing.rows[0].key_value))
        : undefined;

      await logAuditEntry({
        keyName,
        action: 'deleted',
        adminUserId: auditContext.adminUserId,
        adminUserEmail: auditContext.adminUserEmail,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
        oldValue
      });
    }

    return deleted;
  } finally {
    client.release();
  }
}

/**
 * Soft delete (deactivate) an API key
 *
 * @param keyName - Name of the key to deactivate
 * @param auditContext - Optional context for audit logging
 * @returns True if deactivated, false if not found
 */
export async function deactivateAPIKey(
  keyName: string,
  auditContext?: { adminUserId?: number; adminUserEmail?: string; ipAddress?: string; userAgent?: string }
): Promise<boolean> {
  const client = await pool.connect();

  try {
    const result = await client.query(
      'UPDATE api_keys SET is_active = false WHERE key_name = $1',
      [keyName]
    );

    const deactivated = result.rowCount ? result.rowCount > 0 : false;

    // Log audit entry for deactivation
    if (deactivated && auditContext) {
      await logAuditEntry({
        keyName,
        action: 'deactivated',
        adminUserId: auditContext.adminUserId,
        adminUserEmail: auditContext.adminUserEmail,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent
      });
    }

    return deactivated;
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
 * Log audit entry for API key actions
 * Tracks all access and modifications to API keys for security auditing
 *
 * @param entry - Audit log entry details
 */
export async function logAuditEntry(entry: AuditLogEntry): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query(
      `INSERT INTO api_keys_audit_log
       (key_name, action, admin_user_id, admin_user_email, ip_address, user_agent, old_value, new_value, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        entry.keyName,
        entry.action,
        entry.adminUserId || null,
        entry.adminUserEmail || null,
        entry.ipAddress || null,
        entry.userAgent || null,
        entry.oldValue || null,
        entry.newValue || null,
        entry.metadata ? JSON.stringify(entry.metadata) : null
      ]
    );
  } catch (error) {
    // Log error but don't throw - audit logging shouldn't break main functionality
    console.error('Failed to log audit entry:', error);
  } finally {
    client.release();
  }
}

/**
 * Get audit log entries for a specific key or all keys
 *
 * @param keyName - Optional key name to filter by
 * @param limit - Maximum number of entries to return (default: 100)
 * @returns Array of audit log entries
 */
export async function getAuditLog(
  keyName?: string,
  limit: number = 100
): Promise<any[]> {
  const client = await pool.connect();

  try {
    let query = `
      SELECT
        id,
        key_name,
        action,
        admin_user_id,
        admin_user_email,
        ip_address,
        user_agent,
        old_value,
        new_value,
        metadata,
        created_at
      FROM api_keys_audit_log
    `;

    const params: any[] = [];

    if (keyName) {
      query += ' WHERE key_name = $1';
      params.push(keyName);
      query += ` ORDER BY created_at DESC LIMIT $2`;
      params.push(limit);
    } else {
      query += ` ORDER BY created_at DESC LIMIT $1`;
      params.push(limit);
    }

    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Validate required API keys for specific features
 *
 * @param feature - Feature name (e.g., 'stripe', 'openai', 'payment', 'communication')
 * @returns Object with validation results and optional keys
 */
export async function validateAPIKeysForFeature(
  feature: string
): Promise<{ valid: boolean; missing: string[]; optional?: string[] }> {
  // Define required keys for each feature/service
  const requiredKeys: Record<string, string[]> = {
    // Payment Gateways
    stripe: ['stripe_secret_key'],
    stripe_full: ['stripe_public_key', 'stripe_secret_key', 'stripe_webhook_secret'],
    paypal: ['paypal_client_id', 'paypal_secret'],
    payment: ['stripe_secret_key'], // At least one payment method

    // Communication Services
    twilio: ['twilio_account_sid', 'twilio_auth_token', 'twilio_phone_number'],
    sendgrid: ['sendgrid_api_key'],
    mailgun: ['mailgun_api_key', 'mailgun_domain'],
    communication: ['sendgrid_api_key'], // At least one email service
    sms: ['twilio_account_sid', 'twilio_auth_token', 'twilio_phone_number'],

    // AI & Machine Learning
    openai: ['openai_api_key'],
    anthropic: ['anthropic_api_key'],
    ai: ['openai_api_key'], // At least one AI service

    // Analytics & Tracking
    google_analytics: ['google_analytics_id'],
    facebook_pixel: ['facebook_pixel_id'],
    tiktok_pixel: ['tiktok_pixel_id'],
    mixpanel: ['mixpanel_token'],
    analytics: [], // Optional: any analytics service

    // Shipping & Logistics
    shippo: ['shippo_api_key'],
    easypost: ['easypost_api_key'],
    shipstation: ['shipstation_api_key', 'shipstation_api_secret'],
    shipping: [], // Optional: shipping services

    // Storage & CDN
    aws_s3: ['aws_access_key_id', 'aws_secret_access_key', 'aws_s3_bucket', 'aws_region'],
    aws: ['aws_access_key_id', 'aws_secret_access_key'],
    cloudflare: ['cloudflare_api_token', 'cloudflare_zone_id'],
    storage: [], // Optional: cloud storage

    // Search & Discovery
    algolia: ['algolia_app_id', 'algolia_api_key', 'algolia_search_key'],
    search: [], // Optional: search service

    // Marketing Automation
    klaviyo: ['klaviyo_api_key'],
    mailchimp: ['mailchimp_api_key'],
    hubspot: ['hubspot_api_key'],
    marketing: [], // Optional: marketing automation

    // Other Services
    google_maps: ['google_maps_api_key'],
    recaptcha: ['recaptcha_site_key', 'recaptcha_secret_key'],
    exchangerate: ['exchangerate_api_key']
  };

  // Define optional keys that enhance functionality but aren't required
  const optionalKeys: Record<string, string[]> = {
    stripe: ['stripe_webhook_secret'],
    openai: ['openai_organization_id'],
    google_analytics: ['google_analytics_api_secret']
  };

  const required = requiredKeys[feature] || [];
  const optional = optionalKeys[feature] || [];
  const missing: string[] = [];
  const missingOptional: string[] = [];

  // Check required keys
  for (const keyName of required) {
    const value = await getAPIKey(keyName);
    if (!value) {
      missing.push(keyName);
    }
  }

  // Check optional keys
  for (const keyName of optional) {
    const value = await getAPIKey(keyName);
    if (!value) {
      missingOptional.push(keyName);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    optional: missingOptional.length > 0 ? missingOptional : undefined
  };
}

