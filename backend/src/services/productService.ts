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
  imageUrl: row.image_url,
  inventory: row.inventory,
  categories: row.categories,
  highlights: row.highlights ?? undefined,
  usage: row.usage ?? undefined
});

export const productService = {
  async list() {
    const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    return result.rows.map(mapProduct);
  },
  async get(id: number) {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    return result.rows[0] ? mapProduct(result.rows[0]) : null;
  },
  async create(payload: ProductPayload, imagePath: string) {
    const result = await pool.query(
      `INSERT INTO products (name, short_description, description, price, image_url, inventory, categories, highlights, usage)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        payload.name,
        payload.shortDescription,
        payload.description,
        payload.price,
        imagePath,
        payload.inventory,
        JSON.stringify(payload.categories),
        payload.highlights ? JSON.stringify(payload.highlights) : null,
        payload.usage ?? null
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
       SET name=$1, short_description=$2, description=$3, price=$4,
         image_url=$5, inventory=$6, categories=$7, highlights=$8, usage=$9,
         updated_at=CURRENT_TIMESTAMP
       WHERE id=$10
       RETURNING *`,
      [
        payload.name,
        payload.shortDescription,
        payload.description,
        payload.price,
        finalImagePath,
        payload.inventory,
        JSON.stringify(payload.categories),
        payload.highlights ? JSON.stringify(payload.highlights) : null,
        payload.usage ?? null,
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
