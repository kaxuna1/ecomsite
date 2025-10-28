import api from './client';
import type { Product, ProductFilters } from '../types/product';

export const fetchProducts = async (filters?: ProductFilters): Promise<Product[]> => {
  const params = new URLSearchParams();
  if (filters?.isNew) params.append('isNew', 'true');
  if (filters?.isFeatured) params.append('isFeatured', 'true');
  if (filters?.onSale) params.append('onSale', 'true');

  const response = await api.get<Product[]>(`/products?${params.toString()}`);
  return response.data;
};

export const fetchNewArrivals = async (): Promise<Product[]> => {
  return fetchProducts({ isNew: true });
};

export const fetchBestSellers = async (): Promise<Product[]> => {
  return fetchProducts({ isFeatured: true });
};

export const fetchSaleProducts = async (): Promise<Product[]> => {
  return fetchProducts({ onSale: true });
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
