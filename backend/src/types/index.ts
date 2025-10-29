export interface Product {
  id: number;
  name: string;
  short_description: string;
  description: string;
  price: number;
  sale_price: number | null;
  image_url: string;
  inventory: number;
  categories: string;
  highlights: string | null;
  usage: string | null;
  is_new: boolean;
  is_featured: boolean;
  sales_count: number;
  slug: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  og_image_url?: string;
  canonical_url?: string;
}

export interface ProductPayload {
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  salePrice?: number;
  inventory: number;
  categories: string[];
  highlights?: string[];
  usage?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImageUrl?: string;
  canonicalUrl?: string;
}

export interface ProductSEO {
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImageUrl?: string;
  canonicalUrl?: string;
}

export interface ProductTranslation {
  id: number;
  productId: number;
  languageCode: string;
  name: string;
  shortDescription: string;
  description: string;
  highlights?: string[];
  usage?: string;
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductTranslationPayload {
  name: string;
  shortDescription: string;
  description: string;
  highlights?: string[];
  usage?: string;
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_notes: string | null;
  customer_address: string;
  total: number;
  status: string;
  created_at: string;
}

export interface OrderPayload {
  customer: {
    name: string;
    email: string;
    phone?: string;
    notes?: string;
    address: string;
  };
  addressId?: number; // Optional: ID of saved address if user selected one
  items: Array<{ productId: number; quantity: number }>;
  total: number;
  promoCode?: {
    id: number;
    code: string;
    discount: number;
  };
}

// Product Variants
export interface VariantOption {
  id: number;
  name: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface VariantOptionValue {
  id: number;
  optionId: number;
  value: string;
  displayOrder: number;
  createdAt: string;
}

export interface ProductVariant {
  id: number;
  productId: number;
  sku: string;
  price: number | null;
  salePrice: number | null;
  inventory: number;
  weight: number | null;
  dimensionsLength: number | null;
  dimensionsWidth: number | null;
  dimensionsHeight: number | null;
  isActive: boolean;
  isDefault: boolean;
  imageUrl: string | null;
  salesCount: number;
  options: Array<{
    optionId: number;
    optionName: string;
    valueId: number;
    value: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVariantPayload {
  sku: string;
  price?: number;
  salePrice?: number;
  inventory: number;
  weight?: number;
  dimensionsLength?: number;
  dimensionsWidth?: number;
  dimensionsHeight?: number;
  isActive?: boolean;
  isDefault?: boolean;
  imageUrl?: string;
  optionValueIds: number[]; // Array of variant_option_value IDs
}

export interface UpdateVariantPayload {
  sku?: string;
  price?: number;
  salePrice?: number;
  inventory?: number;
  weight?: number;
  dimensionsLength?: number;
  dimensionsWidth?: number;
  dimensionsHeight?: number;
  isActive?: boolean;
  isDefault?: boolean;
  imageUrl?: string;
  optionValueIds?: number[];
}
