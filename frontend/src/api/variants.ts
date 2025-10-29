import api from './client';
import type {
  VariantOption,
  VariantOptionValue,
  ProductVariant,
  CreateVariantPayload,
  UpdateVariantPayload
} from '../types/product';

// Public API - Get variant options and values

// Get all variant option types (Size, Color, etc.)
export const getVariantOptions = async (): Promise<VariantOption[]> => {
  const response = await api.get<VariantOption[]>('/variant-options');
  return response.data;
};

// Get all variant option values
export const getAllVariantOptionValues = async (): Promise<VariantOptionValue[]> => {
  const response = await api.get<VariantOptionValue[]>('/variant-option-values');
  return response.data;
};

// Get values for a specific variant option
export const getVariantOptionValues = async (optionId: number): Promise<VariantOptionValue[]> => {
  const response = await api.get<VariantOptionValue[]>(`/variant-options/${optionId}/values`);
  return response.data;
};

// Get all variants for a product
export const getProductVariants = async (productId: number): Promise<ProductVariant[]> => {
  const response = await api.get<ProductVariant[]>(`/products/${productId}/variants`);
  return response.data;
};

// Get a single variant by ID
export const getVariant = async (variantId: number): Promise<ProductVariant> => {
  const response = await api.get<ProductVariant>(`/variants/${variantId}`);
  return response.data;
};

// Get a variant by SKU
export const getVariantBySKU = async (sku: string): Promise<ProductVariant> => {
  const response = await api.get<ProductVariant>(`/variants/sku/${sku}`);
  return response.data;
};

// Admin API - Create, update, delete variants and options

// Create a new variant option type
export const createVariantOption = async (name: string, displayOrder?: number): Promise<VariantOption> => {
  const response = await api.post<VariantOption>('/variant-options', {
    name,
    displayOrder: displayOrder ?? 0
  });
  return response.data;
};

// Create a new variant option value
export const createVariantOptionValue = async (
  optionId: number,
  value: string,
  displayOrder?: number
): Promise<VariantOptionValue> => {
  const response = await api.post<VariantOptionValue>(`/variant-options/${optionId}/values`, {
    value,
    displayOrder: displayOrder ?? 0
  });
  return response.data;
};

// Create a new variant for a product
export const createVariant = async (
  productId: number,
  payload: CreateVariantPayload
): Promise<ProductVariant> => {
  const response = await api.post<ProductVariant>(`/products/${productId}/variants`, payload);
  return response.data;
};

// Update a variant
export const updateVariant = async (
  variantId: number,
  payload: UpdateVariantPayload
): Promise<ProductVariant> => {
  const response = await api.put<ProductVariant>(`/variants/${variantId}`, payload);
  return response.data;
};

// Delete a variant
export const deleteVariant = async (variantId: number): Promise<void> => {
  await api.delete(`/variants/${variantId}`);
};

// Set a variant as default
export const setDefaultVariant = async (variantId: number): Promise<ProductVariant> => {
  const response = await api.put<ProductVariant>(`/variants/${variantId}/default`);
  return response.data;
};
