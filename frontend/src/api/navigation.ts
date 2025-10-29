import api from './client';
import type {
  PublicMenuResponse,
  PageSuggestion,
  MenuLocation,
  MenuItem,
  CreateMenuItemPayload,
  UpdateMenuItemPayload,
  ReorderPayload,
  MenuItemTranslationPayload,
} from '../types/navigation';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// Public endpoints (no auth required)
export async function fetchMenu(
  location: string,
  lang: string = 'en'
): Promise<PublicMenuResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/navigation/menu/${location}?lang=${lang}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch menu');
  }
  return response.json();
}

export async function fetchPageSuggestions(
  lang: string = 'en'
): Promise<PageSuggestion[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/navigation/suggestions?lang=${lang}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch page suggestions');
  }
  return response.json();
}

// Admin endpoints (authenticated)
export async function fetchMenuLocations(): Promise<MenuLocation[]> {
  const response = await api.get('/navigation/locations');
  return response.data;
}

export async function fetchMenuItems(
  locationId?: number,
  lang?: string
): Promise<MenuItem[]> {
  const params = new URLSearchParams();
  if (locationId) params.append('locationId', locationId.toString());
  if (lang) params.append('lang', lang);

  const response = await api.get(`/navigation/items?${params.toString()}`);
  return response.data;
}

export async function createMenuItem(
  payload: CreateMenuItemPayload
): Promise<MenuItem> {
  const response = await api.post('/navigation/items', payload);
  return response.data;
}

export async function updateMenuItem(
  id: number,
  payload: UpdateMenuItemPayload
): Promise<MenuItem> {
  const response = await api.put(`/navigation/items/${id}`, payload);
  return response.data;
}

export async function deleteMenuItem(id: number): Promise<void> {
  await api.delete(`/navigation/items/${id}`);
}

export async function reorderMenuItems(payload: ReorderPayload): Promise<void> {
  await api.post('/navigation/items/reorder', payload);
}

export async function createMenuItemTranslation(
  menuItemId: number,
  lang: string,
  payload: MenuItemTranslationPayload
): Promise<MenuItem> {
  const response = await api.post(
    `/navigation/items/${menuItemId}/translations/${lang}`,
    payload
  );
  return response.data;
}
