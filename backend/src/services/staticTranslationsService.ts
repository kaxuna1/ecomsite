import { pool } from '../db/client';

export interface StaticTranslation {
  id: number;
  translation_key: string;
  language_code: string;
  translation_value: string;
  namespace: string;
  created_at: Date;
  updated_at: Date;
}

export interface TranslationsByNamespace {
  [namespace: string]: {
    [key: string]: string;
  };
}

/**
 * Get all translations for a specific language, grouped by namespace
 */
export async function getTranslationsByLanguage(languageCode: string): Promise<TranslationsByNamespace> {
  const client = await pool.connect();

  try {
    const result = await client.query<StaticTranslation>(
      'SELECT * FROM static_translations WHERE language_code = $1 ORDER BY namespace, translation_key',
      [languageCode]
    );

    // Group by namespace
    const grouped: TranslationsByNamespace = {};

    for (const row of result.rows) {
      if (!grouped[row.namespace]) {
        grouped[row.namespace] = {};
      }
      grouped[row.namespace][row.translation_key] = row.translation_value;
    }

    return grouped;
  } finally {
    client.release();
  }
}

/**
 * Get translations for a specific namespace and language
 */
export async function getTranslationsByNamespaceAndLanguage(
  namespace: string,
  languageCode: string
): Promise<Record<string, string>> {
  const client = await pool.connect();

  try {
    const result = await client.query<StaticTranslation>(
      'SELECT translation_key, translation_value FROM static_translations WHERE namespace = $1 AND language_code = $2 ORDER BY translation_key',
      [namespace, languageCode]
    );

    const translations: Record<string, string> = {};
    for (const row of result.rows) {
      translations[row.translation_key] = row.translation_value;
    }

    return translations;
  } finally {
    client.release();
  }
}

/**
 * Get all translations for a specific key across all languages
 */
export async function getTranslationsForKey(
  translationKey: string,
  namespace: string = 'common'
): Promise<StaticTranslation[]> {
  const client = await pool.connect();

  try {
    const result = await client.query<StaticTranslation>(
      'SELECT * FROM static_translations WHERE translation_key = $1 AND namespace = $2 ORDER BY language_code',
      [translationKey, namespace]
    );

    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Update or create a single translation
 */
export async function upsertTranslation(
  translationKey: string,
  languageCode: string,
  translationValue: string,
  namespace: string = 'common'
): Promise<StaticTranslation> {
  const client = await pool.connect();

  try {
    const result = await client.query<StaticTranslation>(
      `INSERT INTO static_translations (translation_key, language_code, translation_value, namespace)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (translation_key, language_code, namespace)
       DO UPDATE SET
         translation_value = EXCLUDED.translation_value,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [translationKey, languageCode, translationValue, namespace]
    );

    return result.rows[0];
  } finally {
    client.release();
  }
}

/**
 * Bulk upsert translations
 */
export async function bulkUpsertTranslations(
  translations: Array<{
    translationKey: string;
    languageCode: string;
    translationValue: string;
    namespace: string;
  }>
): Promise<number> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let count = 0;
    for (const trans of translations) {
      await client.query(
        `INSERT INTO static_translations (translation_key, language_code, translation_value, namespace)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (translation_key, language_code, namespace)
         DO UPDATE SET
           translation_value = EXCLUDED.translation_value,
           updated_at = CURRENT_TIMESTAMP`,
        [trans.translationKey, trans.languageCode, trans.translationValue, trans.namespace]
      );
      count++;
    }

    await client.query('COMMIT');
    return count;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Delete a translation
 */
export async function deleteTranslation(
  translationKey: string,
  languageCode: string,
  namespace: string = 'common'
): Promise<boolean> {
  const client = await pool.connect();

  try {
    const result = await client.query(
      'DELETE FROM static_translations WHERE translation_key = $1 AND language_code = $2 AND namespace = $3',
      [translationKey, languageCode, namespace]
    );

    return result.rowCount !== null && result.rowCount > 0;
  } finally {
    client.release();
  }
}

/**
 * Get all unique translation keys for a namespace
 */
export async function getTranslationKeys(namespace?: string): Promise<string[]> {
  const client = await pool.connect();

  try {
    let query = 'SELECT DISTINCT translation_key FROM static_translations';
    const params: any[] = [];

    if (namespace) {
      query += ' WHERE namespace = $1';
      params.push(namespace);
    }

    query += ' ORDER BY translation_key';

    const result = await client.query<{ translation_key: string }>(query, params);

    return result.rows.map(row => row.translation_key);
  } finally {
    client.release();
  }
}

/**
 * Get all namespaces
 */
export async function getNamespaces(): Promise<string[]> {
  const client = await pool.connect();

  try {
    const result = await client.query<{ namespace: string }>(
      'SELECT DISTINCT namespace FROM static_translations ORDER BY namespace'
    );

    return result.rows.map(row => row.namespace);
  } finally {
    client.release();
  }
}

/**
 * Search translations by value (useful for finding missing translations)
 */
export async function searchTranslations(
  searchTerm: string,
  languageCode?: string,
  namespace?: string
): Promise<StaticTranslation[]> {
  const client = await pool.connect();

  try {
    let query = 'SELECT * FROM static_translations WHERE translation_value ILIKE $1';
    const params: any[] = [`%${searchTerm}%`];

    if (languageCode) {
      query += ' AND language_code = $2';
      params.push(languageCode);
    }

    if (namespace) {
      query += ` AND namespace = $${params.length + 1}`;
      params.push(namespace);
    }

    query += ' ORDER BY namespace, translation_key';

    const result = await client.query<StaticTranslation>(query, params);

    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Get translation coverage statistics (how many keys are translated in each language)
 */
export async function getTranslationStats(): Promise<any[]> {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT
        namespace,
        language_code,
        COUNT(*) as translation_count,
        COUNT(DISTINCT translation_key) as unique_keys
      FROM static_translations
      GROUP BY namespace, language_code
      ORDER BY namespace, language_code
    `);

    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Find missing translations (keys that exist in one language but not others)
 */
export async function findMissingTranslations(
  sourceLanguage: string = 'en',
  targetLanguage: string
): Promise<Array<{ namespace: string; translation_key: string }>> {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT DISTINCT namespace, translation_key
      FROM static_translations
      WHERE language_code = $1
        AND NOT EXISTS (
          SELECT 1 FROM static_translations st2
          WHERE st2.translation_key = static_translations.translation_key
            AND st2.namespace = static_translations.namespace
            AND st2.language_code = $2
        )
      ORDER BY namespace, translation_key
    `, [sourceLanguage, targetLanguage]);

    return result.rows;
  } finally {
    client.release();
  }
}
