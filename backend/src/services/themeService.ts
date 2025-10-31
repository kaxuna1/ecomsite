// Theme Service Layer
// Business logic for managing themes, design tokens, and theme configuration

import { pool } from '../db/client';
import type {
  Theme,
  ThemePreset,
  ThemeHistory,
  FontLibraryItem,
  CreateThemeInput,
  UpdateThemeInput,
  DesignTokens
} from '../types/theme';

export class ThemeService {
  /**
   * Get all themes
   */
  async getAllThemes(includeInactive: boolean = false): Promise<Theme[]> {
    const query = `
      SELECT
        id, name, display_name as "displayName", description, tokens,
        is_active as "isActive", is_system_theme as "isSystemTheme",
        version, parent_theme_id as "parentThemeId",
        thumbnail_url as "thumbnailUrl",
        created_by as "createdBy", updated_by as "updatedBy",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM themes
      ${!includeInactive ? 'WHERE is_active = true' : ''}
      ORDER BY is_active DESC, created_at DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Get active theme
   */
  async getActiveTheme(): Promise<Theme | null> {
    const query = `
      SELECT
        id, name, display_name as "displayName", description, tokens,
        is_active as "isActive", is_system_theme as "isSystemTheme",
        version, parent_theme_id as "parentThemeId",
        thumbnail_url as "thumbnailUrl",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM themes
      WHERE is_active = true
      LIMIT 1
    `;

    const result = await pool.query(query);
    return result.rows[0] || null;
  }

  /**
   * Get theme by ID
   */
  async getThemeById(id: number): Promise<Theme | null> {
    const query = `
      SELECT
        id, name, display_name as "displayName", description, tokens,
        is_active as "isActive", is_system_theme as "isSystemTheme",
        version, parent_theme_id as "parentThemeId",
        thumbnail_url as "thumbnailUrl",
        created_by as "createdBy", updated_by as "updatedBy",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM themes
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get theme by name
   */
  async getThemeByName(name: string): Promise<Theme | null> {
    const query = `
      SELECT
        id, name, display_name as "displayName", description, tokens,
        is_active as "isActive", is_system_theme as "isSystemTheme",
        version, parent_theme_id as "parentThemeId",
        thumbnail_url as "thumbnailUrl",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM themes
      WHERE name = $1
    `;

    const result = await pool.query(query, [name]);
    return result.rows[0] || null;
  }

  /**
   * Create new theme
   */
  async createTheme(input: CreateThemeInput, adminUserId?: number): Promise<Theme> {
    // Validate tokens
    this.validateTokens(input.tokens);

    const query = `
      INSERT INTO themes (
        name, display_name, description, tokens,
        created_by, updated_by, version, parent_theme_id
      )
      VALUES ($1, $2, $3, $4, $5, $5, 1, $6)
      RETURNING
        id, name, display_name as "displayName", description, tokens,
        is_active as "isActive", is_system_theme as "isSystemTheme",
        version, parent_theme_id as "parentThemeId",
        thumbnail_url as "thumbnailUrl",
        created_by as "createdBy", updated_by as "updatedBy",
        created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result = await pool.query(query, [
      input.name,
      input.displayName,
      input.description || null,
      JSON.stringify(input.tokens),
      adminUserId || null,
      input.parentThemeId || null
    ]);

    const theme = result.rows[0];

    // Log history
    await this.logThemeHistory(
      theme.id,
      'created',
      null,
      input.tokens,
      adminUserId
    );

    return theme;
  }

  /**
   * Update theme
   */
  async updateTheme(
    id: number,
    updates: UpdateThemeInput,
    adminUserId?: number
  ): Promise<Theme> {
    const theme = await this.getThemeById(id);
    if (!theme) {
      throw new Error('Theme not found');
    }

    if (theme.isSystemTheme) {
      throw new Error('Cannot modify system themes');
    }

    // Validate tokens if provided
    if (updates.tokens) {
      this.validateTokens(updates.tokens);
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.displayName !== undefined) {
      fields.push(`display_name = $${paramIndex++}`);
      values.push(updates.displayName);
    }

    if (updates.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }

    if (updates.tokens) {
      fields.push(`tokens = $${paramIndex++}`);
      values.push(JSON.stringify(updates.tokens));
      fields.push(`version = version + 1`);
    }

    fields.push(`updated_by = $${paramIndex++}`);
    values.push(adminUserId || null);

    values.push(id);

    const query = `
      UPDATE themes
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING
        id, name, display_name as "displayName", description, tokens,
        is_active as "isActive", is_system_theme as "isSystemTheme",
        version, parent_theme_id as "parentThemeId",
        thumbnail_url as "thumbnailUrl",
        created_by as "createdBy", updated_by as "updatedBy",
        created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result = await pool.query(query, values);

    // Log history if tokens changed
    if (updates.tokens) {
      await this.logThemeHistory(
        id,
        'updated',
        theme.tokens,
        updates.tokens,
        adminUserId
      );
    }

    return result.rows[0];
  }

  /**
   * Activate theme
   */
  async activateTheme(id: number, adminUserId?: number): Promise<void> {
    const theme = await this.getThemeById(id);
    if (!theme) {
      throw new Error('Theme not found');
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Deactivate current theme
      await client.query('UPDATE themes SET is_active = false WHERE is_active = true');

      // Activate new theme
      await client.query('UPDATE themes SET is_active = true WHERE id = $1', [id]);

      // Log history
      await this.logThemeHistory(id, 'activated', null, null, adminUserId);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Deactivate theme
   */
  async deactivateTheme(id: number, adminUserId?: number): Promise<void> {
    const query = `
      UPDATE themes
      SET is_active = false
      WHERE id = $1
    `;

    await pool.query(query, [id]);

    // Log history
    await this.logThemeHistory(id, 'deactivated', null, null, adminUserId);
  }

  /**
   * Delete theme
   */
  async deleteTheme(id: number): Promise<void> {
    const theme = await this.getThemeById(id);

    if (!theme) {
      throw new Error('Theme not found');
    }

    if (theme.isSystemTheme) {
      throw new Error('Cannot delete system themes');
    }

    if (theme.isActive) {
      throw new Error('Cannot delete active theme. Please activate another theme first.');
    }

    await pool.query('DELETE FROM themes WHERE id = $1', [id]);
  }

  /**
   * Generate CSS from design tokens
   */
  generateCSS(tokens: DesignTokens): string {
    const cssVars: string[] = [':root {'];

    const flatten = (obj: Record<string, any>, prefix: string = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const cssKey = prefix ? `${prefix}-${key}` : key;

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          if ('value' in value) {
            // Design token format with 'value' property
            cssVars.push(`  --${cssKey}: ${value.value};`);
          } else {
            // Nested object
            flatten(value, cssKey);
          }
        } else if (typeof value === 'string') {
          // Direct string value
          cssVars.push(`  --${cssKey}: ${value};`);
        }
      }
    };

    flatten(tokens);
    cssVars.push('}');

    return cssVars.join('\n');
  }

  /**
   * Validate token structure
   */
  private validateTokens(tokens: DesignTokens): void {
    // Basic validation
    if (!tokens || typeof tokens !== 'object') {
      throw new Error('Invalid token structure: tokens must be an object');
    }

    // Check for required categories
    const requiredCategories = ['color', 'typography', 'spacing'];
    for (const category of requiredCategories) {
      if (!tokens[category as keyof DesignTokens]) {
        throw new Error(`Missing required token category: ${category}`);
      }
    }

    // Validate color tokens
    if (!tokens.color.brand || !tokens.color.semantic) {
      throw new Error('Invalid color tokens: must include brand and semantic colors');
    }

    // Validate typography tokens
    if (!tokens.typography.fontFamily || !tokens.typography.fontSize) {
      throw new Error('Invalid typography tokens: must include fontFamily and fontSize');
    }

    // Validate spacing tokens
    if (!tokens.spacing.preset) {
      throw new Error('Invalid spacing tokens: must include preset');
    }
  }

  /**
   * Log theme history
   */
  private async logThemeHistory(
    themeId: number,
    action: 'created' | 'updated' | 'activated' | 'deactivated' | 'deleted',
    previousTokens: DesignTokens | null,
    newTokens: DesignTokens | null,
    adminUserId?: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const query = `
      INSERT INTO theme_history (
        theme_id, action, previous_tokens, new_tokens,
        admin_user_id, ip_address, user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    await pool.query(query, [
      themeId,
      action,
      previousTokens ? JSON.stringify(previousTokens) : null,
      newTokens ? JSON.stringify(newTokens) : null,
      adminUserId || null,
      ipAddress || null,
      userAgent || null
    ]);
  }

  /**
   * Get theme history
   */
  async getThemeHistory(themeId: number, limit: number = 20, offset: number = 0): Promise<ThemeHistory[]> {
    const query = `
      SELECT
        id, theme_id as "themeId", action,
        previous_tokens as "previousTokens", new_tokens as "newTokens",
        admin_user_id as "adminUserId", admin_user_email as "adminUserEmail",
        ip_address as "ipAddress", user_agent as "userAgent",
        change_summary as "changeSummary", created_at as "createdAt"
      FROM theme_history
      WHERE theme_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [themeId, limit, offset]);
    return result.rows;
  }

  /**
   * Get all theme presets
   */
  async getThemePresets(category?: string): Promise<ThemePreset[]> {
    let query = `
      SELECT
        id, name, display_name as "displayName", description, category,
        tokens, thumbnail_url as "thumbnailUrl", preview_url as "previewUrl",
        is_featured as "isFeatured", display_order as "displayOrder", tags,
        created_at as "createdAt", updated_at as "updatedAt"
      FROM theme_presets
    `;

    const params: any[] = [];

    if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    }

    query += ' ORDER BY display_order ASC, created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get fonts from library
   */
  async getFonts(category?: string): Promise<FontLibraryItem[]> {
    let query = `
      SELECT
        id, name, display_name as "displayName", source, font_url as "fontUrl",
        category, weights, styles,
        is_system_font as "isSystemFont", is_premium as "isPremium",
        preview_text as "previewText", created_at as "createdAt"
      FROM font_library
    `;

    const params: any[] = [];

    if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    }

    query += ' ORDER BY is_system_font DESC, display_name ASC';

    const result = await pool.query(query, params);
    return result.rows;
  }
}

export const themeService = new ThemeService();
