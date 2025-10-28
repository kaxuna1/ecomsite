import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db/client';
import type { ProductPayload, ProductTranslationPayload } from '../types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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
  salesCount: row.sales_count ?? 0,
  slug: row.slug ?? undefined,
  metaTitle: row.meta_title ?? undefined,
  metaDescription: row.meta_description ?? undefined
});

export const productService = {
  async list(filters?: { isNew?: boolean; isFeatured?: boolean; onSale?: boolean; language?: string }) {
    const language = filters?.language || 'en';

    let query = `
      SELECT
        p.id,
        p.price,
        p.sale_price,
        p.image_url,
        p.inventory,
        p.categories,
        p.is_new,
        p.is_featured,
        p.sales_count,
        p.created_at,
        p.updated_at,
        COALESCE(pt.name, p.name) as name,
        COALESCE(pt.short_description, p.short_description) as short_description,
        COALESCE(pt.description, p.description) as description,
        COALESCE(pt.highlights, p.highlights) as highlights,
        COALESCE(pt.usage, p.usage) as usage,
        pt.slug as slug,
        pt.meta_title as meta_title,
        pt.meta_description as meta_description
      FROM products p
      LEFT JOIN product_translations pt ON p.id = pt.product_id AND pt.language_code = $1
      WHERE 1=1
    `;
    const params: any[] = [language];
    let paramIndex = 2;

    if (filters?.isNew) {
      query += ` AND p.is_new = $${paramIndex}`;
      params.push(true);
      paramIndex++;
    }

    if (filters?.isFeatured) {
      query += ` AND p.is_featured = $${paramIndex}`;
      params.push(true);
      paramIndex++;
    }

    if (filters?.onSale) {
      query += ` AND p.sale_price IS NOT NULL`;
    }

    // Order by: featured items use sales_count, new items use created_at, sale items use discount %
    if (filters?.isFeatured) {
      query += ' ORDER BY p.sales_count DESC, p.created_at DESC';
    } else if (filters?.isNew) {
      query += ' ORDER BY p.created_at DESC';
    } else if (filters?.onSale) {
      query += ' ORDER BY ((p.price - p.sale_price) / p.price) DESC, p.created_at DESC';
    } else {
      query += ' ORDER BY p.created_at DESC';
    }

    const result = await pool.query(query, params);
    return result.rows.map(mapProduct);
  },
  async get(id: number, language: string = 'en') {
    const query = `
      SELECT
        p.id,
        p.price,
        p.sale_price,
        p.image_url,
        p.inventory,
        p.categories,
        p.is_new,
        p.is_featured,
        p.sales_count,
        p.created_at,
        p.updated_at,
        COALESCE(pt.name, p.name) as name,
        COALESCE(pt.short_description, p.short_description) as short_description,
        COALESCE(pt.description, p.description) as description,
        COALESCE(pt.highlights, p.highlights) as highlights,
        COALESCE(pt.usage, p.usage) as usage,
        pt.slug as slug,
        pt.meta_title as meta_title,
        pt.meta_description as meta_description
      FROM products p
      LEFT JOIN product_translations pt ON p.id = pt.product_id AND pt.language_code = $2
      WHERE p.id = $1
    `;
    const result = await pool.query(query, [id, language]);
    return result.rows[0] ? mapProduct(result.rows[0]) : null;
  },
  async create(payload: ProductPayload, imagePath: string) {
    const result = await pool.query(
      `INSERT INTO products (name, short_description, description, price, sale_price, image_url, inventory, categories, highlights, usage, is_new, is_featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        payload.name,
        payload.shortDescription,
        payload.description,
        payload.price,
        payload.salePrice ?? null,
        imagePath,
        payload.inventory,
        JSON.stringify(payload.categories),
        payload.highlights ? JSON.stringify(payload.highlights) : null,
        payload.usage ?? null,
        payload.isNew ?? false,
        payload.isFeatured ?? false
      ]
    );
    return mapProduct(result.rows[0]);
  },
  async update(id: number, payload: ProductPayload, imagePath?: string) {
    const current = await this.get(id);
    if (!current) return null;

    const finalImagePath = imagePath ?? current.imageUrl;
    const result = await pool.query(
      `UPDATE products
       SET name=$1, short_description=$2, description=$3, price=$4, sale_price=$5,
         image_url=$6, inventory=$7, categories=$8, highlights=$9, usage=$10,
         is_new=$11, is_featured=$12, updated_at=CURRENT_TIMESTAMP
       WHERE id=$13
       RETURNING *`,
      [
        payload.name,
        payload.shortDescription,
        payload.description,
        payload.price,
        payload.salePrice ?? null,
        finalImagePath,
        payload.inventory,
        JSON.stringify(payload.categories),
        payload.highlights ? JSON.stringify(payload.highlights) : null,
        payload.usage ?? null,
        payload.isNew ?? false,
        payload.isFeatured ?? false,
        id
      ]
    );

    if (imagePath && current.imageUrl && current.imageUrl.startsWith('/uploads/')) {
      const toDelete = path.join(uploadDir, path.basename(current.imageUrl));
      if (fs.existsSync(toDelete)) {
        fs.unlinkSync(toDelete);
      }
    }

    return mapProduct(result.rows[0]);
  },
  async remove(id: number) {
    const product = await this.get(id);
    if (!product) return false;
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    if (product.imageUrl && product.imageUrl.startsWith('/uploads/')) {
      const filePath = path.join(uploadDir, path.basename(product.imageUrl));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    return true;
  },
  saveImage(file: Express.Multer.File) {
    const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    const destination = path.join(uploadDir, filename);
    fs.writeFileSync(destination, file.buffer);
    return `/uploads/${filename}`;
  },

  // Translation management methods
  async createTranslation(productId: number, languageCode: string, data: ProductTranslationPayload) {
    const result = await pool.query(
      `INSERT INTO product_translations
       (product_id, language_code, name, short_description, description, highlights, usage, slug, meta_title, meta_description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (product_id, language_code)
       DO UPDATE SET
         name = EXCLUDED.name,
         short_description = EXCLUDED.short_description,
         description = EXCLUDED.description,
         highlights = EXCLUDED.highlights,
         usage = EXCLUDED.usage,
         slug = EXCLUDED.slug,
         meta_title = EXCLUDED.meta_title,
         meta_description = EXCLUDED.meta_description,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        productId,
        languageCode,
        data.name,
        data.shortDescription,
        data.description,
        data.highlights ? JSON.stringify(data.highlights) : null,
        data.usage ?? null,
        data.slug ?? null,
        data.metaTitle ?? null,
        data.metaDescription ?? null
      ]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      productId: row.product_id,
      languageCode: row.language_code,
      name: row.name,
      shortDescription: row.short_description,
      description: row.description,
      highlights: row.highlights,
      usage: row.usage,
      slug: row.slug,
      metaTitle: row.meta_title,
      metaDescription: row.meta_description,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  async getTranslation(productId: number, languageCode: string) {
    const result = await pool.query(
      `SELECT * FROM product_translations WHERE product_id = $1 AND language_code = $2`,
      [productId, languageCode]
    );

    if (!result.rows[0]) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      productId: row.product_id,
      languageCode: row.language_code,
      name: row.name,
      shortDescription: row.short_description,
      description: row.description,
      highlights: row.highlights,
      usage: row.usage,
      slug: row.slug,
      metaTitle: row.meta_title,
      metaDescription: row.meta_description,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  async getAllTranslations(productId: number) {
    const result = await pool.query(
      `SELECT * FROM product_translations WHERE product_id = $1 ORDER BY language_code`,
      [productId]
    );

    return result.rows.map(row => ({
      id: row.id,
      productId: row.product_id,
      languageCode: row.language_code,
      name: row.name,
      shortDescription: row.short_description,
      description: row.description,
      highlights: row.highlights,
      usage: row.usage,
      slug: row.slug,
      metaTitle: row.meta_title,
      metaDescription: row.meta_description,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }
};
