import api from './client';
import type {
  AdminUser,
  RegularUser,
  CreateAdminUserRequest,
  UpdateAdminUserRequest,
  UpdateRegularUserRequest,
  UserStats,
} from '../types/user';

// Admin Users API
export const getAllAdminUsers = async (): Promise<AdminUser[]> => {
  const response = await api.get<AdminUser[]>('/admin/admins');
  return response.data;
};

export const getAdminUser = async (id: number): Promise<AdminUser> => {
  const response = await api.get<AdminUser>(`/admin/admins/${id}`);
  return response.data;
};

export const createAdminUser = async (
  data: CreateAdminUserRequest
): Promise<AdminUser> => {
  const response = await api.post<AdminUser>('/admin/admins', data);
  return response.data;
};

export const updateAdminUser = async (
  id: number,
  data: UpdateAdminUserRequest
): Promise<AdminUser> => {
  const response = await api.put<AdminUser>(`/admin/admins/${id}`, data);
  return response.data;
};

export const deleteAdminUser = async (id: number): Promise<void> => {
  await api.delete(`/admin/admins/${id}`);
};

// Regular Users API
export const getAllUsers = async (): Promise<RegularUser[]> => {
  const response = await api.get<RegularUser[]>('/admin/users');
  return response.data;
};

export const getUser = async (id: number): Promise<RegularUser> => {
  const response = await api.get<RegularUser>(`/admin/users/${id}`);
  return response.data;
};

export const updateUser = async (
  id: number,
  data: UpdateRegularUserRequest
): Promise<RegularUser> => {
  const response = await api.put<RegularUser>(`/admin/users/${id}`, data);
  return response.data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`/admin/users/${id}`);
};

export const getUserStats = async (): Promise<UserStats> => {
  const response = await api.get<UserStats>('/admin/users/stats');
  return response.data;
};
