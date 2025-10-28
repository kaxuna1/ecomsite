import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import path from 'path';
import { pool } from '../db/client';
import type { ProductPayload } from '../types';
import { env } from '../config/env';
import { s3Client, publicUrlForKey } from '../utils/s3';

const toStringArray = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
    } catch (error) {
      return [];
    }
  }
  return [];
};

const mapProduct = (row: any) => ({
  id: row.id,
  name: row.name,
  shortDescription: row.short_description,
  description: row.description,
  price: Number(row.price),
  imageUrl: row.image_url,
  inventory: Number(row.inventory),
  categories: toStringArray(row.categories),
  highlights: row.highlights ? toStringArray(row.highlights) : undefined,
  usage: row.usage ?? undefined
});

const uploadImage = async (file: Express.Multer.File) => {
  const extension = path.extname(file.originalname) || '.jpg';
  const key = `products/${Date.now()}-${crypto.randomUUID()}${extension}`;
  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.s3Bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
    })
  );
  return { imageUrl: publicUrlForKey(key), imageKey: key };
};

const deleteImage = async (key: string | null | undefined) => {
  if (!key) return;
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: env.s3Bucket,
        Key: key
      })
    );
  } catch (error) {
    // Swallow delete errors to avoid blocking CRUD operations
    console.warn('Failed to delete object from S3', error);
  }
};

const getRow = async (id: number) => {
  const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
  return result.rows[0] ?? null;
};

export const productService = {
  async list() {
    const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    return result.rows.map(mapProduct);
  },
  async get(id: number) {
    const row = await getRow(id);
    return row ? mapProduct(row) : null;
  },
  async create(payload: ProductPayload, file: Express.Multer.File) {
    if (!file) {
      throw new Error('Product image file is required');
    }

    const uploaded = await uploadImage(file);

    try {
      const result = await pool.query(
        `INSERT INTO products
          (name, short_description, description, price, image_url, image_key, inventory, categories, highlights, usage)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10)
        RETURNING *`,
        [
          payload.name,
          payload.shortDescription,
          payload.description,
          payload.price,
          uploaded.imageUrl,
          uploaded.imageKey,
          payload.inventory,
          JSON.stringify(payload.categories),
          payload.highlights ? JSON.stringify(payload.highlights) : null,
          payload.usage ?? null
        ]
      );
      return mapProduct(result.rows[0]);
    } catch (error) {
      await deleteImage(uploaded.imageKey);
      throw error;
    }
  },
  async update(id: number, payload: ProductPayload, file?: Express.Multer.File) {
    const existing = await getRow(id);
    if (!existing) return null;

    let imageUrl = existing.image_url as string;
    let imageKey = existing.image_key as string;
    let uploaded: { imageUrl: string; imageKey: string } | undefined;

    if (file) {
      uploaded = await uploadImage(file);
      imageUrl = uploaded.imageUrl;
      imageKey = uploaded.imageKey;
    }

    try {
      const result = await pool.query(
        `UPDATE products
         SET name = $1,
             short_description = $2,
             description = $3,
             price = $4,
             image_url = $5,
             image_key = $6,
             inventory = $7,
             categories = $8::jsonb,
             highlights = $9::jsonb,
             usage = $10,
             updated_at = NOW()
         WHERE id = $11
         RETURNING *`,
        [
          payload.name,
          payload.shortDescription,
          payload.description,
          payload.price,
          imageUrl,
          imageKey,
          payload.inventory,
          JSON.stringify(payload.categories),
          payload.highlights ? JSON.stringify(payload.highlights) : null,
          payload.usage ?? null,
          id
        ]
      );

      if (uploaded) {
        await deleteImage(existing.image_key as string);
      }

      return mapProduct(result.rows[0]);
    } catch (error) {
      if (uploaded) {
        await deleteImage(uploaded.imageKey);
      }
      throw error;
    }
  },
  async remove(id: number) {
    const existing = await getRow(id);
    if (!existing) return false;

    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    await deleteImage(existing.image_key as string);
    return true;
  }
};
