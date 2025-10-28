import { pool } from '../db/client';

// Map product row to response format
const mapProduct = (row: any) => ({
  id: row.id,
  name: row.name,
  shortDescription: row.short_description,
  description: row.description,
  price: parseFloat(row.price),
  salePrice: row.sale_price ? parseFloat(row.sale_price) : null,
  imageUrl: row.image_url,
  inventory: row.inventory,
  categories: row.categories,
  highlights: row.highlights ?? undefined,
  usage: row.usage ?? undefined,
  isNew: row.is_new ?? false,
  isFeatured: row.is_featured ?? false,
  salesCount: row.sales_count ?? 0
});

export const favoritesService = {
  /**
   * Get user's favorite products with full product details
   */
  async getFavorites(userId: number) {
    const result = await pool.query(
      `SELECT f.id, f.user_id, f.product_id, f.created_at,
              p.id as p_id, p.name, p.short_description, p.description,
              p.price, p.sale_price, p.image_url, p.inventory,
              p.categories, p.highlights, p.usage, p.is_new,
              p.is_featured, p.sales_count
       FROM favorites f
       JOIN products p ON f.product_id = p.id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      productId: row.product_id,
      createdAt: row.created_at,
      product: {
        id: row.p_id,
        name: row.name,
        shortDescription: row.short_description,
        description: row.description,
        price: parseFloat(row.price),
        salePrice: row.sale_price ? parseFloat(row.sale_price) : null,
        imageUrl: row.image_url,
        inventory: row.inventory,
        categories: row.categories,
        highlights: row.highlights ?? undefined,
        usage: row.usage ?? undefined,
        isNew: row.is_new ?? false,
        isFeatured: row.is_featured ?? false,
        salesCount: row.sales_count ?? 0
      }
    }));
  },

  /**
   * Add product to user's favorites
   * Returns true if added, false if already exists
   */
  async addFavorite(userId: number, productId: number): Promise<boolean> {
    try {
      // Check if product exists
      const productCheck = await pool.query('SELECT id FROM products WHERE id = $1', [productId]);
      if (productCheck.rows.length === 0) {
        throw new Error('Product not found');
      }

      // Try to insert, will fail if already exists due to unique constraint
      await pool.query(
        'INSERT INTO favorites (user_id, product_id) VALUES ($1, $2)',
        [userId, productId]
      );
      return true;
    } catch (error: any) {
      // PostgreSQL unique constraint violation code
      if (error.code === '23505') {
        return false; // Already exists
      }
      throw error;
    }
  },

  /**
   * Remove product from user's favorites
   * Returns true if removed, false if wasn't favorited
   */
  async removeFavorite(userId: number, productId: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  },

  /**
   * Check if a product is in user's favorites
   */
  async isFavorite(userId: number, productId: number): Promise<boolean> {
    const result = await pool.query(
      'SELECT 1 FROM favorites WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );
    return result.rows.length > 0;
  }
};
