import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db/client';
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
  price: row.price,
  imageUrl: row.image_url,
  inventory: row.inventory,
  categories: JSON.parse(row.categories) as string[],
  highlights: row.highlights ? (JSON.parse(row.highlights) as string[]) : undefined,
  usage: row.usage ?? undefined
});

export const productService = {
  list() {
    const stmt = db.prepare('SELECT * FROM products ORDER BY created_at DESC');
    return stmt.all().map(mapProduct);
  },
  get(id: number) {
    const stmt = db.prepare('SELECT * FROM products WHERE id = ?');
    const row = stmt.get(id);
    return row ? mapProduct(row) : null;
  },
  create(payload: ProductPayload, imagePath: string) {
    const stmt = db.prepare(`
      INSERT INTO products (name, short_description, description, price, image_url, inventory, categories, highlights, usage)
      VALUES (@name, @short_description, @description, @price, @image_url, @inventory, @categories, @highlights, @usage)
    `);
    const result = stmt.run({
      name: payload.name,
      short_description: payload.shortDescription,
      description: payload.description,
      price: payload.price,
      image_url: imagePath,
      inventory: payload.inventory,
      categories: JSON.stringify(payload.categories),
      highlights: payload.highlights ? JSON.stringify(payload.highlights) : null,
      usage: payload.usage ?? null
    });
    return this.get(Number(result.lastInsertRowid));
  },
  update(id: number, payload: ProductPayload, imagePath?: string) {
    const current = this.get(id);
    if (!current) return null;

    const stmt = db.prepare(`
      UPDATE products
      SET name=@name, short_description=@short_description, description=@description, price=@price,
        image_url=@image_url, inventory=@inventory, categories=@categories, highlights=@highlights, usage=@usage,
        updated_at=CURRENT_TIMESTAMP
      WHERE id=@id
    `);
    stmt.run({
      id,
      name: payload.name,
      short_description: payload.shortDescription,
      description: payload.description,
      price: payload.price,
      image_url: imagePath ?? current.imageUrl,
      inventory: payload.inventory,
      categories: JSON.stringify(payload.categories),
      highlights: payload.highlights ? JSON.stringify(payload.highlights) : null,
      usage: payload.usage ?? null
    });

    if (imagePath && current.imageUrl && current.imageUrl.startsWith('/uploads/')) {
      const toDelete = path.join(uploadDir, path.basename(current.imageUrl));
      if (fs.existsSync(toDelete)) {
        fs.unlinkSync(toDelete);
      }
    }

    return this.get(id);
  },
  remove(id: number) {
    const product = this.get(id);
    if (!product) return false;
    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    stmt.run(id);
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
