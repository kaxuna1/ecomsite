import api from './client';
import type { Product, ProductFilters } from '../types/product';

export interface PaginatedProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export const fetchProducts = async (
  filters?: ProductFilters,
  page: number = 1,
  limit: number = 18
): Promise<PaginatedProductsResponse> => {
  const params = new URLSearchParams();
  if (filters?.isNew) params.append('isNew', 'true');
  if (filters?.isFeatured) params.append('isFeatured', 'true');
  if (filters?.onSale) params.append('onSale', 'true');
  if (filters?.category) params.append('category', filters.category);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.attributes && Object.keys(filters.attributes).length > 0) {
    params.append('attributes', JSON.stringify(filters.attributes));
  }
  params.append('page', page.toString());
  params.append('limit', limit.toString());

  const response = await api.get<PaginatedProductsResponse>(`/products?${params.toString()}`);
  const { products, total, page: responsePage, limit: responseLimit } = response.data;

  return {
    products,
    total,
    page: responsePage,
    limit: responseLimit,
    hasMore: responsePage * responseLimit < total
  };
};

export const fetchAllProducts = async (): Promise<Product[]> => {
  const response = await fetchProducts({}, 1, 1000); // Fetch up to 1000 products
  return response.products;
};

export const fetchNewArrivals = async (): Promise<Product[]> => {
  const result = await fetchProducts({ isNew: true });
  return result.products;
};

export const fetchBestSellers = async (): Promise<Product[]> => {
  const result = await fetchProducts({ isFeatured: true });
  return result.products;
};

export const fetchSaleProducts = async (): Promise<Product[]> => {
  const result = await fetchProducts({ onSale: true });
  return result.products;
};

export const fetchProduct = async (id: number): Promise<Product> => {
  const response = await api.get<Product>(`/products/${id}`);
  return response.data;
};

export const createProduct = async (formData: FormData): Promise<Product> => {
  const response = await api.post<Product>('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const updateProduct = async (id: number, formData: FormData): Promise<Product> => {
  const response = await api.put<Product>(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const deleteProduct = async (id: number): Promise<void> => {
  await api.delete(`/products/${id}`);
};

export const searchProducts = async (query: string, limit?: number): Promise<Product[]> => {
  if (!query || query.trim().length === 0) {
    return [];
  }
  const params = new URLSearchParams({ q: query });
  if (limit) params.append('limit', limit.toString());

  const response = await api.get<Product[]>(`/products/search?${params.toString()}`);
  return response.data;
};

interface AutocompleteResult {
  id: number;
  name: string;
  slug: string;
  imageUrl: string;
  price: number;
  salePrice: number | null;
}

export const autocompleteProducts = async (prefix: string, limit?: number): Promise<AutocompleteResult[]> => {
  if (!prefix || prefix.trim().length === 0) {
    return [];
  }
  const params = new URLSearchParams({ q: prefix });
  if (limit) params.append('limit', limit.toString());

  const response = await api.get<AutocompleteResult[]>(`/products/autocomplete?${params.toString()}`);
  return response.data;
};

export interface FilterMetadata {
  categories: Array<{
    value: string;
    label: string;
    count: number;
  }>;
  attributes: Array<{
    id: number;
    attributeKey: string;
    attributeLabel: string;
    dataType: string;
    displayOrder: number;
    isFilterable: boolean;
    options: Array<{
      value: string;
      label: string;
      count: number;
    }>;
  }>;
}

export const fetchFilterMetadata = async (language: string = 'en'): Promise<FilterMetadata> => {
  const response = await api.get<FilterMetadata>(`/products/filter-metadata?lang=${language}`);
  return response.data;
};

export const fetchRandomProducts = async (limit: number = 8): Promise<Product[]> => {
  const response = await api.get<Product[]>(`/products/random?limit=${limit}`);
  return response.data;
};

export interface ProductTranslation {
  id: number;
  productId: number;
  languageCode: string;
  name: string;
  shortDescription: string;
  description: string;
  highlights: string[];
  usage: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  createdAt: string;
  updatedAt: string;
}

export const getProductTranslation = async (
  productId: number,
  languageCode: string
): Promise<ProductTranslation | null> => {
  try {
    const response = await api.get<ProductTranslation>(
      `/products/${productId}/translations/${languageCode}`
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const saveProductTranslation = async (
  productId: number,
  languageCode: string,
  data: {
    name: string;
    shortDescription: string;
    description: string;
    highlights?: string[];
    usage?: string;
    slug?: string;
    metaTitle?: string;
    metaDescription?: string;
  }
): Promise<ProductTranslation> => {
  const response = await api.post<ProductTranslation>(
    `/products/${productId}/translations/${languageCode}`,
    data
  );
  return response.data;
};
