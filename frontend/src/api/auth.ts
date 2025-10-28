import api from './client';
import type { AuthResponse, RegisterPayload, LoginPayload, User } from '../types/product';

export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/user/auth/login', payload);
  return response.data;
};

export const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/user/auth/register', payload);
  return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<User>('/user/auth/me');
  return response.data;
};

export const logout = (): void => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('luxia-user-token');
  }
};

// Admin login (keep existing for backward compatibility)
export const adminLogin = async (credentials: { email: string; password: string }) => {
  const response = await api.post<{ token: string }>('/auth/login', credentials);
  return response.data;
};
