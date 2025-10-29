export interface ProductSEO {
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImageUrl?: string;
  canonicalUrl?: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  salePrice?: number | null;
  imageUrl: string;
  inventory: number;
  categories: string[];
  highlights?: string[];
  usage?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  salesCount?: number;
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImageUrl?: string;
  canonicalUrl?: string;
  seo?: ProductSEO;
  customAttributes?: Record<string, any>;
}

export interface ProductFilters {
  isNew?: boolean;
  isFeatured?: boolean;
  onSale?: boolean;
  category?: string;
  search?: string;
  attributes?: Record<string, any>;
}

export interface OrderPayload {
  items: Array<{ productId: number; quantity: number; variantId?: number }>;
  customer: {
    name: string;
    email: string;
    phone?: string;
    notes?: string;
    address: string;
  };
  total: number;
  promoCode?: string;
}

export interface Order extends OrderPayload {
  id: number;
  status: string;
  createdAt: string;
  items: Array<{ productId: number; quantity: number; name?: string; price?: number }>;
}

export interface User {
  id: number;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface Favorite {
  id: number;
  userId: number;
  productId: number;
  product: Product;
  createdAt: string;
}

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';

export interface PromoCode {
  id: number;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minimumPurchase?: number | null;
  maxUsageCount?: number | null;
  usageCount: number;
  isActive: boolean;
  validFrom: string;
  validUntil?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PromoCodeValidation {
  valid: boolean;
  message: string;
  discount?: number;
  promoCode?: PromoCode;
}

export interface PromoCodeStats {
  id: number;
  code: string;
  usageCount: number;
  totalDiscountGiven: number;
  averageOrderValue: number;
}

export interface CreatePromoCodePayload {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minimumPurchase?: number;
  maxUsageCount?: number;
  isActive?: boolean;
  validFrom: string;
  validUntil?: string;
}

export interface UpdatePromoCodePayload {
  code?: string;
  discountType?: DiscountType;
  discountValue?: number;
  minimumPurchase?: number;
  maxUsageCount?: number;
  isActive?: boolean;
  validFrom?: string;
  validUntil?: string;
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
  optionValueIds: number[];
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
