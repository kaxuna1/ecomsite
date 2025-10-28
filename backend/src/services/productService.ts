import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db/client';
import type { ProductPayload } from '../types';

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
  salesCount: row.sales_count ?? 0
});

export const productService = {
  async list(filters?: { isNew?: boolean; isFeatured?: boolean; onSale?: boolean }) {
    let query = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.isNew) {
      query += ` AND is_new = $${paramIndex}`;
      params.push(true);
      paramIndex++;
    }

    if (filters?.isFeatured) {
      query += ` AND is_featured = $${paramIndex}`;
      params.push(true);
      paramIndex++;
    }

    if (filters?.onSale) {
      query += ` AND sale_price IS NOT NULL`;
    }

    // Order by: featured items use sales_count, new items use created_at, sale items use discount %
    if (filters?.isFeatured) {
      query += ' ORDER BY sales_count DESC, created_at DESC';
    } else if (filters?.isNew) {
      query += ' ORDER BY created_at DESC';
    } else if (filters?.onSale) {
      query += ' ORDER BY ((price - sale_price) / price) DESC, created_at DESC';
    } else {
      query += ' ORDER BY created_at DESC';
    }

    const result = await pool.query(query, params);
    return result.rows.map(mapProduct);
  },
  async get(id: number) {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
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
  }
};
