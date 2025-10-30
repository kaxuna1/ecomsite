// Settings Service Layer
// Business logic for managing site settings (logo, branding, etc.)

import { pool } from '../db/client';

export interface SiteSettings {
  logoType: 'text' | 'image';
  logoText: string | null;
  logoImageUrl: string | null;
  aiProvider: 'openai' | 'anthropic';
  openaiModel?: string | null; // Selected OpenAI model
  anthropicModel?: string | null; // Selected Anthropic model
}

/**
 * Get all settings as key-value object
 */
export async function getAllSettings(): Promise<Record<string, string | null>> {
  const result = await pool.query('SELECT setting_key, setting_value FROM site_settings');

  const settings: Record<string, string | null> = {};
  for (const row of result.rows) {
    settings[toCamelCase(row.setting_key)] = row.setting_value;
  }

  return settings;
}

/**
 * Get a single setting by key
 */
export async function getSetting(key: string): Promise<string | null> {
  const dbKey = toSnakeCase(key);
  const result = await pool.query(
    'SELECT setting_value FROM site_settings WHERE setting_key = $1',
    [dbKey]
  );

  return result.rows.length > 0 ? result.rows[0].setting_value : null;
}

/**
 * Update a single setting (upsert)
 */
export async function updateSetting(key: string, value: string | null): Promise<void> {
  const dbKey = toSnakeCase(key);

  await pool.query(
    `INSERT INTO site_settings (setting_key, setting_value)
     VALUES ($1, $2)
     ON CONFLICT (setting_key)
     DO UPDATE SET
       setting_value = EXCLUDED.setting_value,
       updated_at = CURRENT_TIMESTAMP`,
    [dbKey, value]
  );
}

/**
 * Update multiple settings at once
 */
export async function updateSettings(settings: Record<string, string | null>): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const [key, value] of Object.entries(settings)) {
      const dbKey = toSnakeCase(key);

      await client.query(
        `INSERT INTO site_settings (setting_key, setting_value)
         VALUES ($1, $2)
         ON CONFLICT (setting_key)
         DO UPDATE SET
           setting_value = EXCLUDED.setting_value,
           updated_at = CURRENT_TIMESTAMP`,
        [dbKey, value]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get public logo settings
 */
export async function getPublicLogoSettings(): Promise<SiteSettings> {
  const settings = await getAllSettings();

  return {
    logoType: (settings.logoType as 'text' | 'image') || 'text',
    logoText: settings.logoText || null,
    logoImageUrl: settings.logoImageUrl || null,
    aiProvider: (settings.aiProvider as 'openai' | 'anthropic') || 'openai',
    openaiModel: settings.openaiModel || null,
    anthropicModel: settings.anthropicModel || null
  };
}

/**
 * Validate logo type
 */
export function isValidLogoType(type: string): type is 'text' | 'image' {
  return type === 'text' || type === 'image';
}

/**
 * Validate AI provider
 */
export function isValidAiProvider(provider: string): provider is 'openai' | 'anthropic' {
  return provider === 'openai' || provider === 'anthropic';
}

/**
 * Validate AI model for a given provider
 */
export function isValidAiModel(provider: 'openai' | 'anthropic', model: string): boolean {
  const validModels = {
    openai: [
      'gpt-4o',
      'gpt-4o-2024-11-20',
      'gpt-4o-mini',
      'gpt-4o-mini-2024-07-18',
      'gpt-4-turbo',
      'gpt-4-turbo-2024-04-09',
      'gpt-4-turbo-preview',
      'gpt-4-0125-preview',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-0125'
    ],
    anthropic: [
      'claude-sonnet-4-5-20250929',
      'claude-haiku-4-5-20251015',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-sonnet-20240620',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ]
  };

  return validModels[provider]?.includes(model) || false;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert camelCase to snake_case
 */
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Convert snake_case to camelCase
 */
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
