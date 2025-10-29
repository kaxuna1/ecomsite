// Navigation Service Layer
// Business logic for managing navigation menus and menu items

import { pool } from '../db/client';
import {
  MenuItem,
  MenuItemTranslation,
  MenuItemHierarchical,
  PublicMenuResponse,
  MenuItemDetail,
  CreateMenuItemPayload,
  UpdateMenuItemPayload,
  CreateMenuItemTranslationPayload,
  ReorderMenuItemsPayload,
  PageSuggestion
} from '../types/navigation';

// Static route suggestions for menu builder
const STATIC_ROUTES = [
  { type: 'static' as const, label: 'Products', url: '/products' },
  { type: 'static' as const, label: 'New Arrivals', url: '/new-arrivals' },
  { type: 'static' as const, label: 'Best Sellers', url: '/best-sellers' },
  { type: 'static' as const, label: 'Sale', url: '/sale' },
  { type: 'static' as const, label: 'Cart', url: '/cart' },
  { type: 'static' as const, label: 'Checkout', url: '/checkout' },
];

// ============================================================================
// PUBLIC MENU ACCESS
// ============================================================================

/**
 * Get menu by location code with translations and hierarchical structure
 * @param locationCode - Menu location code (header, footer, mobile)
 * @param language - Language code for translations (default: 'en')
 * @returns Hierarchical menu structure with translated labels
 */
export async function getMenuByLocation(
  locationCode: string,
  language: string = 'en'
): Promise<PublicMenuResponse | null> {
  try {
    // Use recursive CTE to build hierarchical menu structure
    const result = await pool.query(
      `WITH RECURSIVE menu_tree AS (
        -- Base case: root items (parent_id IS NULL)
        SELECT
          mi.id,
          mi.location_id as "locationId",
          mi.parent_id as "parentId",
          COALESCE(mit.label, mi.label) as label,
          mi.link_type as "linkType",
          mi.link_url as "linkUrl",
          mi.cms_page_id as "cmsPageId",
          cp.slug as "cmsPageSlug",
          mi.display_order as "displayOrder",
          mi.is_enabled as "isEnabled",
          mi.open_in_new_tab as "openInNewTab",
          mi.css_class as "cssClass"
        FROM menu_items mi
        LEFT JOIN menu_item_translations mit ON mi.id = mit.menu_item_id AND mit.language_code = $2
        LEFT JOIN cms_pages cp ON mi.cms_page_id = cp.id
        WHERE mi.location_id = (SELECT id FROM menu_locations WHERE code = $1)
          AND mi.parent_id IS NULL
          AND mi.is_enabled = TRUE

        UNION ALL

        -- Recursive case: children
        SELECT
          mi.id,
          mi.location_id,
          mi.parent_id,
          COALESCE(mit.label, mi.label) as label,
          mi.link_type,
          mi.link_url,
          mi.cms_page_id,
          cp.slug as "cmsPageSlug",
          mi.display_order,
          mi.is_enabled,
          mi.open_in_new_tab,
          mi.css_class
        FROM menu_items mi
        JOIN menu_tree mt ON mi.parent_id = mt.id
        LEFT JOIN menu_item_translations mit ON mi.id = mit.menu_item_id AND mit.language_code = $2
        LEFT JOIN cms_pages cp ON mi.cms_page_id = cp.id
        WHERE mi.is_enabled = TRUE
      )
      SELECT * FROM menu_tree ORDER BY "displayOrder" ASC`,
      [locationCode, language]
    );

    if (result.rows.length === 0) {
      return null;
    }

    // Build hierarchical structure
    const items = buildHierarchy(result.rows);

    return {
      location: locationCode,
      items
    };
  } catch (error) {
    console.error('Error fetching menu by location:', error);
    throw error;
  }
}

/**
 * Build hierarchical menu structure from flat array
 */
function buildHierarchy(rows: any[]): MenuItemHierarchical[] {
  const itemMap = new Map<number, MenuItemHierarchical>();
  const rootItems: MenuItemHierarchical[] = [];

  // First pass: create all items with children array
  rows.forEach((row) => {
    const item: MenuItemHierarchical = {
      id: row.id,
      locationId: row.locationId,
      parentId: row.parentId,
      label: row.label,
      linkType: row.linkType,
      linkUrl: row.linkUrl,
      cmsPageId: row.cmsPageId,
      cmsPageSlug: row.cmsPageSlug,
      displayOrder: row.displayOrder,
      isEnabled: row.isEnabled,
      openInNewTab: row.openInNewTab,
      cssClass: row.cssClass,
      children: []
    };
    itemMap.set(item.id, item);
  });

  // Second pass: organize into hierarchy
  itemMap.forEach((item) => {
    if (item.parentId === null) {
      rootItems.push(item);
    } else {
      const parent = itemMap.get(item.parentId);
      if (parent) {
        parent.children.push(item);
      }
    }
  });

  return rootItems;
}

// ============================================================================
// ADMIN MENU ITEM MANAGEMENT
// ============================================================================
/**
 * Get all menu locations
 * @returns Array of menu locations (header, footer, mobile)
 */
export async function getAllMenuLocations() {
  try {
    const result = await pool.query(
      `SELECT id, code, name, description, created_at as "createdAt", updated_at as "updatedAt"
       FROM menu_locations
       ORDER BY id ASC`
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching menu locations:', error);
    throw error;
  }
}

/**
 * Get all menu items with optional location filter
 * @param locationId - Optional location ID to filter by
 * @returns Array of menu items
 */
export async function getAllMenuItems(locationId?: number, language: string = 'en'): Promise<MenuItem[]> {
  try {
    let query = `
      SELECT
        mi.*,
        COALESCE(mit.label, mi.label) as label
      FROM menu_items mi
      LEFT JOIN menu_item_translations mit ON mi.id = mit.menu_item_id AND mit.language_code = $1
      WHERE 1=1
    `;
    const params: any[] = [language];

    if (locationId !== undefined) {
      query += ` AND mi.location_id = $${params.length + 1}`;
      params.push(locationId);
    }

    query += ` ORDER BY mi.location_id, mi.display_order ASC`;

    const result = await pool.query(query, params);
    return result.rows.map(mapMenuItemFromDb);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    throw error;
  }
}

/**
 * Get single menu item by ID with all translations
 * @param id - Menu item ID
 * @returns Menu item detail with translations or null
 */
export async function getMenuItemById(id: number): Promise<MenuItemDetail | null> {
  try {
    const itemResult = await pool.query(
      'SELECT * FROM menu_items WHERE id = $1',
      [id]
    );

    if (itemResult.rows.length === 0) {
      return null;
    }

    const item = mapMenuItemFromDb(itemResult.rows[0]);

    // Get all translations
    const translationsResult = await pool.query(
      'SELECT * FROM menu_item_translations WHERE menu_item_id = $1 ORDER BY language_code',
      [id]
    );

    const translations = translationsResult.rows.map(mapMenuItemTranslationFromDb);

    return {
      ...item,
      translations
    };
  } catch (error) {
    console.error('Error fetching menu item by ID:', error);
    throw error;
  }
}

/**
 * Create a new menu item
 * @param payload - Menu item creation data
 * @returns Created menu item
 */
export async function createMenuItem(payload: CreateMenuItemPayload): Promise<MenuItem> {
  try {
    const {
      locationId,
      parentId = null,
      label,
      linkType,
      linkUrl = null,
      cmsPageId = null,
      displayOrder = 0,
      isEnabled = true,
      openInNewTab = false,
      cssClass = null
    } = payload;

    const result = await pool.query(
      `INSERT INTO menu_items (
        location_id, parent_id, label, link_type, link_url, cms_page_id,
        display_order, is_enabled, open_in_new_tab, css_class
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        locationId,
        parentId,
        label,
        linkType,
        linkUrl,
        cmsPageId,
        displayOrder,
        isEnabled,
        openInNewTab,
        cssClass
      ]
    );

    return mapMenuItemFromDb(result.rows[0]);
  } catch (error) {
    console.error('Error creating menu item:', error);
    throw error;
  }
}

/**
 * Update an existing menu item
 * @param id - Menu item ID
 * @param payload - Update data
 * @returns Updated menu item or null if not found
 */
export async function updateMenuItem(
  id: number,
  payload: UpdateMenuItemPayload
): Promise<MenuItem | null> {
  try {
    const item = await pool.query('SELECT id FROM menu_items WHERE id = $1', [id]);
    if (item.rows.length === 0) {
      return null;
    }

    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (payload.parentId !== undefined) {
      updates.push(`parent_id = $${paramCount++}`);
      params.push(payload.parentId);
    }

    if (payload.label !== undefined) {
      updates.push(`label = $${paramCount++}`);
      params.push(payload.label);
    }

    if (payload.linkType !== undefined) {
      updates.push(`link_type = $${paramCount++}`);
      params.push(payload.linkType);
    }

    if (payload.linkUrl !== undefined) {
      updates.push(`link_url = $${paramCount++}`);
      params.push(payload.linkUrl);
    }

    if (payload.cmsPageId !== undefined) {
      updates.push(`cms_page_id = $${paramCount++}`);
      params.push(payload.cmsPageId);
    }

    if (payload.displayOrder !== undefined) {
      updates.push(`display_order = $${paramCount++}`);
      params.push(payload.displayOrder);
    }

    if (payload.isEnabled !== undefined) {
      updates.push(`is_enabled = $${paramCount++}`);
      params.push(payload.isEnabled);
    }

    if (payload.openInNewTab !== undefined) {
      updates.push(`open_in_new_tab = $${paramCount++}`);
      params.push(payload.openInNewTab);
    }

    if (payload.cssClass !== undefined) {
      updates.push(`css_class = $${paramCount++}`);
      params.push(payload.cssClass);
    }

    if (updates.length === 0) {
      return mapMenuItemFromDb(item.rows[0]);
    }

    params.push(id);
    const query = `UPDATE menu_items SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, params);
    return mapMenuItemFromDb(result.rows[0]);
  } catch (error) {
    console.error('Error updating menu item:', error);
    throw error;
  }
}

/**
 * Delete a menu item (CASCADE will delete children)
 * @param id - Menu item ID
 * @returns True if deleted, false if not found
 */
export async function deleteMenuItem(id: number): Promise<boolean> {
  try {
    const result = await pool.query('DELETE FROM menu_items WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('Error deleting menu item:', error);
    throw error;
  }
}

/**
 * Reorder menu items by updating display_order
 * @param payload - Array of items with new display orders
 */
export async function reorderMenuItems(payload: ReorderMenuItemsPayload): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const item of payload.items) {
      await client.query(
        'UPDATE menu_items SET display_order = $1 WHERE id = $2',
        [item.displayOrder, item.id]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error reordering menu items:', error);
    throw error;
  } finally {
    client.release();
  }
}

// ============================================================================
// MENU ITEM TRANSLATION MANAGEMENT
// ============================================================================

/**
 * Create or update a menu item translation (upsert)
 * @param menuItemId - Menu item ID
 * @param languageCode - Language code
 * @param payload - Translation data
 * @returns Created or updated translation
 */
export async function createMenuItemTranslation(
  menuItemId: number,
  languageCode: string,
  payload: CreateMenuItemTranslationPayload
): Promise<MenuItemTranslation> {
  try {
    const result = await pool.query(
      `INSERT INTO menu_item_translations (menu_item_id, language_code, label)
       VALUES ($1, $2, $3)
       ON CONFLICT (menu_item_id, language_code)
       DO UPDATE SET
         label = EXCLUDED.label,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [menuItemId, languageCode, payload.label]
    );

    return mapMenuItemTranslationFromDb(result.rows[0]);
  } catch (error) {
    console.error('Error creating menu item translation:', error);
    throw error;
  }
}

// ============================================================================
// PAGE SUGGESTIONS
// ============================================================================

/**
 * Get page suggestions for menu builder (static + CMS pages)
 * @param language - Language code for CMS page translations
 * @returns Array of page suggestions
 */
export async function getPageSuggestions(language: string = 'en'): Promise<PageSuggestion[]> {
  try {
    // Get CMS pages with translations
    const result = await pool.query(
      `SELECT
        p.id,
        COALESCE(pt.slug, p.slug) as slug,
        COALESCE(pt.title, p.title) as title
       FROM cms_pages p
       LEFT JOIN cms_page_translations pt ON p.id = pt.page_id AND pt.language_code = $1
       WHERE p.is_published = true
       ORDER BY p.title ASC`,
      [language]
    );

    const cmsPages: PageSuggestion[] = result.rows.map((row) => ({
      type: 'cms',
      label: row.title,
      url: `/${row.slug}`,
      cmsPageId: row.id
    }));

    // Combine static routes with CMS pages
    return [...STATIC_ROUTES, ...cmsPages];
  } catch (error) {
    console.error('Error fetching page suggestions:', error);
    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map database row to MenuItem object
 */
function mapMenuItemFromDb(row: any): MenuItem {
  return {
    id: row.id,
    locationId: row.location_id,
    parentId: row.parent_id,
    label: row.label,
    linkType: row.link_type,
    linkUrl: row.link_url,
    cmsPageId: row.cms_page_id,
    displayOrder: row.display_order,
    isEnabled: row.is_enabled,
    openInNewTab: row.open_in_new_tab,
    cssClass: row.css_class,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Map database row to MenuItemTranslation object
 */
function mapMenuItemTranslationFromDb(row: any): MenuItemTranslation {
  return {
    id: row.id,
    menuItemId: row.menu_item_id,
    languageCode: row.language_code,
    label: row.label,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
