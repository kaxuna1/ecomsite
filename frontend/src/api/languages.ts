import api from './client';
import type { Language, LanguagePayload, UpdateLanguagePayload } from '../types/language';

export const fetchLanguages = async (includeDisabled: boolean = false): Promise<Language[]> => {
  const params = includeDisabled ? '?includeDisabled=true' : '';
  const response = await api.get<Language[]>(`/languages${params}`);
  return response.data;
};

export const fetchLanguage = async (code: string): Promise<Language> => {
  const response = await api.get<Language>(`/languages/${code}`);
  return response.data;
};

export const fetchDefaultLanguage = async (): Promise<Language> => {
  const response = await api.get<Language>('/languages/default/language');
  return response.data;
};

export const createLanguage = async (payload: LanguagePayload): Promise<Language> => {
  const response = await api.post<Language>('/languages', payload);
  return response.data;
};

export const updateLanguage = async (code: string, payload: UpdateLanguagePayload): Promise<Language> => {
  const response = await api.put<Language>(`/languages/${code}`, payload);
  return response.data;
};

export const deleteLanguage = async (code: string): Promise<void> => {
  await api.delete(`/languages/${code}`);
};

export const toggleLanguageEnabled = async (code: string): Promise<Language> => {
  const response = await api.patch<Language>(`/languages/${code}/toggle`);
  return response.data;
};
