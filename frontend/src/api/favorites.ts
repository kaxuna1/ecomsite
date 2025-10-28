import api from './client';
import type { Favorite } from '../types/product';

export const getFavorites = async (): Promise<Favorite[]> => {
  const response = await api.get<Favorite[]>('/favorites');
  return response.data;
};

export const addFavorite = async (productId: number): Promise<Favorite> => {
  const response = await api.post<Favorite>(`/favorites/${productId}`);
  return response.data;
};

export const removeFavorite = async (productId: number): Promise<void> => {
  await api.delete(`/favorites/${productId}`);
};

export const isFavorite = async (productId: number): Promise<boolean> => {
  try {
    const favorites = await getFavorites();
    return favorites.some(fav => fav.productId === productId);
  } catch (error) {
    return false;
  }
};
