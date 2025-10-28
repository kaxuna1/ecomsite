import api from './client';

export const login = async (credentials: { username: string; password: string }) => {
  const response = await api.post<{ token: string }>('/auth/login', credentials);
  return response.data;
};
