import api from './client';
import { API_BASE_URL } from '../utils/apiBaseUrl';

export interface SiteSettings {
  logoType: 'text' | 'image';
  logoText: string | null;
  logoImageUrl: string | null;
  aiProvider?: 'openai' | 'anthropic' | 'gemini';
  openaiModel?: string | null; // Selected OpenAI model
  anthropicModel?: string | null; // Selected Anthropic model
  geminiModel?: string | null; // Selected Gemini model
}

// Public endpoint - no authentication required
export async function fetchPublicSettings(): Promise<SiteSettings> {
  const url = `${API_BASE_URL}/api/settings/public`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch public settings: ${response.statusText}`);
  }
  return response.json();
}

// Admin endpoints - require authentication
export async function fetchSettings(): Promise<Record<string, string | null>> {
  const res = await api.get('/settings');
  return res.data;
}

export async function updateSettings(settings: Partial<SiteSettings>) {
  const res = await api.put('/settings', settings);
  return res.data;
}

export async function uploadLogo(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('logo', file);

  const res = await api.post('/settings/logo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
}
