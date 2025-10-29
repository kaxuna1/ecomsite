import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { pool } from '../db/client';
import type { ProductPayload, ProductTranslationPayload, ProductMedia } from '../types';
import { getMediaUrl } from '../utils/urlHelper';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Helper function to fetch product images from product_media junction table
 */
const getProductImages = async (productId: number): Promise<ProductMedia[]> => {
  const result = await pool.query(
    `SELECT
      pm.id,
      pm.product_id,
      pm.media_id,
      pm.is_featured,
      pm.display_order,
      m.filename,
      m.original_name,
      m.mime_type,
      m.size_bytes,
      m.width,
      m.height,
      m.alt_text,
      m.caption,
      m.file_path
    FROM product_media pm
    JOIN cms_media m ON pm.media_id = m.id
    WHERE pm.product_id = $1 AND m.is_deleted = FALSE
    ORDER BY pm.display_order ASC, pm.created_at ASC`,
    [productId]
  );

  return result.rows.map(row => ({
    id: row.id,
    productId: row.product_id,
    mediaId: row.media_id,
    isFeatured: row.is_featured,
    displayOrder: row.display_order,
    filename: row.filename,
    originalName: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    width: row.width,
    height: row.height,
    altText: row.alt_text,
    caption: row.caption,
    url: getMediaUrl(row.filename)
  }));
};

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
  slug: row.slug,
  metaTitle: row.meta_title ?? undefined,
  metaDescription: row.meta_description ?? undefined,
  metaKeywords: row.meta_keywords ?? undefined,
  ogImageUrl: row.og_image_url ?? undefined,
  canonicalUrl: row.canonical_url ?? undefined,
  customAttributes: row.custom_attributes ?? undefined,
  images: row.images ?? [] // Initialize images array
});

export const productService = {
  async list(filters?: {
    isNew?: boolean;
    isFeatured?: boolean;
    onSale?: boolean;
    language?: string;
    category?: string;
    search?: string;
    attributes?: Record<string, any>;
    page?: number;
    limit?: number;
  }): Promise<{ products: any[]; total: number; page: number; limit: number }> {
    const language = filters?.language || 'en';
    const page = filters?.page || 1;
    const limit = filters?.limit || 18;
    const offset = (page - 1) * limit;

    // Build WHERE clause conditions
    // For COUNT query: parameters start at $1
    // For main query with JOIN: parameters start at $2 (because $1 is used for language in JOIN)
    let whereClause = '';
    const whereParams: any[] = [];
    let whereParamIndex = 1;

    if (filters?.isNew) {
      whereClause += ` AND p.is_new = $${whereParamIndex}`;
      whereParams.push(true);
      whereParamIndex++;
    }

    if (filters?.isFeatured) {
      whereClause += ` AND p.is_featured = $${whereParamIndex}`;
      whereParams.push(true);
      whereParamIndex++;
    }

    if (filters?.onSale) {
      whereClause += ` AND p.sale_price IS NOT NULL`;
    }

    // Category filter - use JSONB ? operator to check if array contains value
    if (filters?.category) {
      whereClause += ` AND p.categories @> $${whereParamIndex}::jsonb`;
      whereParams.push(JSON.stringify([filters.category]));
      whereParamIndex++;
    }

    // Search filter
    if (filters?.search) {
      whereClause += ` AND p.search_vector @@ plainto_tsquery('english', $${whereParamIndex})`;
      whereParams.push(filters.search);
      whereParamIndex++;
    }

    // Custom attribute filters
    if (filters?.attributes && Object.keys(filters.attributes).length > 0) {
      for (const [key, value] of Object.entries(filters.attributes)) {
        if (value === null || value === undefined || value === '') continue;

        // Handle boolean values
        if (typeof value === 'boolean') {
          whereClause += ` AND p.custom_attributes->>'${key}' = $${whereParamIndex}`;
          whereParams.push(String(value));
          whereParamIndex++;
        }
        // Handle array values (multiselect) - check if product has ALL selected values
        else if (Array.isArray(value) && value.length > 0) {
          whereClause += ` AND p.custom_attributes->>'${key}' IS NOT NULL
            AND p.custom_attributes->'${key}' @> $${whereParamIndex}::jsonb`;
          whereParams.push(JSON.stringify(value));
          whereParamIndex++;
        }
        // Handle single select values
        else {
          whereClause += ` AND p.custom_attributes->>'${key}' = $${whereParamIndex}`;
          whereParams.push(String(value));
          whereParamIndex++;
        }
      }
    }

    // Get total count with same filters
    const countQuery = `
      SELECT COUNT(*)::int as total
      FROM products p
      WHERE 1=1 ${whereClause}
    `;
    const countResult = await pool.query(countQuery, whereParams);
    const total = countResult.rows[0]?.total || 0;

    // Determine ORDER BY clause
    let orderByClause = '';
    if (filters?.isFeatured) {
      orderByClause = ' ORDER BY p.sales_count DESC, p.created_at DESC';
    } else if (filters?.isNew) {
      orderByClause = ' ORDER BY p.created_at DESC';
    } else if (filters?.onSale) {
      orderByClause = ' ORDER BY ((p.price - p.sale_price) / p.price) DESC, p.created_at DESC';
    } else {
      orderByClause = ' ORDER BY p.created_at DESC';
    }

    // Build main query with pagination
    // Main query uses $1 for language in JOIN, then $2, $3, etc. for WHERE clause, then final params for LIMIT/OFFSET
    const mainWhereClause = whereClause.replace(/\$(\d+)/g, (match, num) => {
      // Shift parameter indices by 1 to account for language parameter at $1
      return `$${parseInt(num) + 1}`;
    });

    const limitParamIndex = whereParams.length + 2; // +1 for language, +1 for next index
    const offsetParamIndex = limitParamIndex + 1;

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
        p.meta_keywords,
        p.og_image_url,
        p.canonical_url,
        p.custom_attributes,
        COALESCE(pt.name, p.name) as name,
        COALESCE(pt.short_description, p.short_description) as short_description,
        COALESCE(pt.description, p.description) as description,
        COALESCE(pt.highlights, p.highlights) as highlights,
        COALESCE(pt.usage, p.usage) as usage,
        COALESCE(pt.slug, p.slug) as slug,
        COALESCE(pt.meta_title, p.meta_title) as meta_title,
        COALESCE(pt.meta_description, p.meta_description) as meta_description
      FROM products p
      LEFT JOIN product_translations pt ON p.id = pt.product_id AND pt.language_code = $1
      WHERE 1=1 ${mainWhereClause}
      ${orderByClause}
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
    `;

    const result = await pool.query(query, [language, ...whereParams, limit, offset]);
    const products = result.rows.map(mapProduct);

    // Fetch images for all products
    for (const product of products) {
      product.images = await getProductImages(product.id);
    }

    return {
      products,
      total,
      page,
      limit
    };
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
        p.meta_keywords,
        p.og_image_url,
        p.canonical_url,
        COALESCE(pt.name, p.name) as name,
        COALESCE(pt.short_description, p.short_description) as short_description,
        COALESCE(pt.description, p.description) as description,
        COALESCE(pt.highlights, p.highlights) as highlights,
        COALESCE(pt.usage, p.usage) as usage,
        COALESCE(pt.slug, p.slug) as slug,
        COALESCE(pt.meta_title, p.meta_title) as meta_title,
        COALESCE(pt.meta_description, p.meta_description) as meta_description
      FROM products p
      LEFT JOIN product_translations pt ON p.id = pt.product_id AND pt.language_code = $2
      WHERE p.id = $1
    `;
    const result = await pool.query(query, [id, language]);
    if (!result.rows[0]) return null;

    const product = mapProduct(result.rows[0]);
    product.images = await getProductImages(product.id);
    return product;
  },
  async create(payload: ProductPayload, imagePath: string) {
    const result = await pool.query(
      `INSERT INTO products (name, short_description, description, price, sale_price, image_url, inventory, categories, highlights, usage, is_new, is_featured, slug, meta_title, meta_description, meta_keywords, og_image_url, canonical_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
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
        payload.isFeatured ?? false,
        payload.slug ?? null,
        payload.metaTitle ?? null,
        payload.metaDescription ?? null,
        payload.metaKeywords ? payload.metaKeywords : null,
        payload.ogImageUrl ?? null,
        payload.canonicalUrl ?? null
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
         is_new=$11, is_featured=$12, slug=$13, meta_title=$14, meta_description=$15,
         meta_keywords=$16, og_image_url=$17, canonical_url=$18, updated_at=CURRENT_TIMESTAMP
       WHERE id=$19
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
        payload.slug ?? null,
        payload.metaTitle ?? null,
        payload.metaDescription ?? null,
        payload.metaKeywords ? payload.metaKeywords : null,
        payload.ogImageUrl ?? null,
        payload.canonicalUrl ?? null,
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
  async saveImage(file: Express.Multer.File) {
    // Generate unique filename with .webp extension for optimized format
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/\s+/g, '-');
    const nameWithoutExt = path.parse(originalName).name;
    const filename = `${timestamp}-${nameWithoutExt}.webp`;
    const destination = path.join(uploadDir, filename);

    try {
      // Optimize image: resize if too large, convert to webp, compress
      await sharp(file.buffer)
        .resize(1920, 1920, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({
          quality: 85,
          effort: 4 // Compression effort (0-6, higher = better compression but slower)
        })
        .toFile(destination);

      return `/uploads/${filename}`;
    } catch (error) {
      console.error('Error optimizing image:', error);
      // Fallback to original if optimization fails
      const fallbackFilename = `${timestamp}-${originalName}`;
      const fallbackDest = path.join(uploadDir, fallbackFilename);
      fs.writeFileSync(fallbackDest, file.buffer);
      return `/uploads/${fallbackFilename}`;
    }
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
  },

  async getBySlug(slug: string, language: string = 'en') {
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
        p.meta_keywords,
        p.og_image_url,
        p.canonical_url,
        COALESCE(pt.name, p.name) as name,
        COALESCE(pt.short_description, p.short_description) as short_description,
        COALESCE(pt.description, p.description) as description,
        COALESCE(pt.highlights, p.highlights) as highlights,
        COALESCE(pt.usage, p.usage) as usage,
        COALESCE(pt.slug, p.slug) as slug,
        COALESCE(pt.meta_title, p.meta_title) as meta_title,
        COALESCE(pt.meta_description, p.meta_description) as meta_description
      FROM products p
      LEFT JOIN product_translations pt
        ON p.id = pt.product_id AND pt.language_code = $2
      WHERE p.slug = $1 OR pt.slug = $1
    `;
    const result = await pool.query(query, [slug, language]);
    if (!result.rows[0]) return null;

    const product = mapProduct(result.rows[0]);
    product.images = await getProductImages(product.id);
    return product;
  },

  generateSEOMetadata(product: any) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return {
      slug: product.slug,
      metaTitle: product.metaTitle || `${product.name} | Luxia Products`,
      metaDescription: product.metaDescription || product.shortDescription,
      metaKeywords: product.metaKeywords || product.categories,
      ogImageUrl: product.ogImageUrl || product.imageUrl,
      canonicalUrl: product.canonicalUrl || `${baseUrl}/products/${product.slug}`
    };
  },

  // Search functionality
  async search(query: string, language: string = 'en', limit: number = 20) {
    const result = await pool.query(
      'SELECT * FROM search_products($1, $2, $3)',
      [query, language, limit]
    );
    const products = result.rows.map(row => ({
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
      slug: row.slug,
      metaTitle: row.meta_title ?? undefined,
      metaDescription: row.meta_description ?? undefined,
      metaKeywords: row.meta_keywords ?? undefined,
      ogImageUrl: row.og_image_url ?? undefined,
      canonicalUrl: row.canonical_url ?? undefined,
      searchRank: row.search_rank,
      images: [] as ProductMedia[] // Will be populated below
    }));

    // Fetch images for all products
    for (const product of products) {
      product.images = await getProductImages(product.id);
    }

    return products;
  },

  async autocomplete(prefix: string, language: string = 'en', limit: number = 10) {
    const result = await pool.query(
      'SELECT * FROM autocomplete_products($1, $2, $3)',
      [prefix, language, limit]
    );
    const products = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      imageUrl: row.image_url,
      price: parseFloat(row.price),
      salePrice: row.sale_price ? parseFloat(row.sale_price) : null,
      images: [] as ProductMedia[] // Will be populated below
    }));

    // Fetch images for all products
    for (const product of products) {
      product.images = await getProductImages(product.id);
    }

    return products;
  },

  async getFilterMetadata(language: string = 'en') {
    // Get all unique categories with product counts
    const categoriesResult = await pool.query(`
      SELECT
        category,
        COUNT(*)::int as count
      FROM products p,
      jsonb_array_elements_text(p.categories) as category
      GROUP BY category
      ORDER BY category
    `);

    const categories = categoriesResult.rows.map(row => ({
      value: row.category,
      label: row.category,
      count: row.count
    }));

    // Get all custom attribute values with counts from product_attribute_definitions
    const attributesResult = await pool.query(`
      SELECT
        id,
        attribute_key,
        attribute_label,
        data_type,
        display_order,
        is_filterable,
        options
      FROM product_attribute_definitions
      WHERE is_filterable = true
      ORDER BY display_order, attribute_label
    `);

    const attributes = attributesResult.rows.map(attr => ({
      id: attr.id,
      attributeKey: attr.attribute_key,
      attributeLabel: attr.attribute_label,
      dataType: attr.data_type,
      displayOrder: attr.display_order,
      isFilterable: attr.is_filterable,
      options: attr.options ? attr.options.map((opt: any) => ({
        value: opt.value,
        label: opt.label,
        count: 0 // Will be calculated below
      })) : []
    }));

    // Calculate counts for each attribute option
    for (const attr of attributes) {
      if (attr.options && attr.options.length > 0) {
        for (const option of attr.options) {
          let countQuery: string;
          let params: any[];

          if (attr.dataType === 'boolean') {
            countQuery = `
              SELECT COUNT(*)::int as count
              FROM products
              WHERE custom_attributes->>'${attr.attributeKey}' = $1
            `;
            params = [String(option.value === 'true' || option.value === true)];
          } else if (attr.dataType === 'multiselect') {
            countQuery = `
              SELECT COUNT(*)::int as count
              FROM products
              WHERE custom_attributes->'${attr.attributeKey}' @> $1::jsonb
            `;
            params = [JSON.stringify([option.value])];
          } else {
            // select type
            countQuery = `
              SELECT COUNT(*)::int as count
              FROM products
              WHERE custom_attributes->>'${attr.attributeKey}' = $1
            `;
            params = [option.value];
          }

          const countResult = await pool.query(countQuery, params);
          option.count = countResult.rows[0]?.count || 0;
        }
      }
    }

    return {
      categories,
      attributes
    };
  },

  // Get random products for home page
  async getRandom(limit: number = 8, language: string = 'en') {
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
        p.meta_keywords,
        p.og_image_url,
        p.canonical_url,
        p.custom_attributes,
        COALESCE(pt.name, p.name) as name,
        COALESCE(pt.short_description, p.short_description) as short_description,
        COALESCE(pt.description, p.description) as description,
        COALESCE(pt.highlights, p.highlights) as highlights,
        COALESCE(pt.usage, p.usage) as usage,
        COALESCE(pt.slug, p.slug) as slug,
        COALESCE(pt.meta_title, p.meta_title) as meta_title,
        COALESCE(pt.meta_description, p.meta_description) as meta_description
      FROM products p
      LEFT JOIN product_translations pt ON p.id = pt.product_id AND pt.language_code = $1
      ORDER BY RANDOM()
      LIMIT $2
    `;

    const result = await pool.query(query, [language, limit]);
    const products = result.rows.map(mapProduct);

    // Fetch images for all products
    for (const product of products) {
      product.images = await getProductImages(product.id);
    }

    return products;
  }
};
