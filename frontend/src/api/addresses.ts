import api from './client';
import type { UserAddress, CreateAddressPayload, UpdateAddressPayload } from '../types/address';

export const fetchAddresses = async (): Promise<UserAddress[]> => {
  const response = await api.get<UserAddress[]>('/addresses');
  return response.data;
};

export const fetchDefaultAddress = async (): Promise<UserAddress> => {
  const response = await api.get<UserAddress>('/addresses/default');
  return response.data;
};

export const fetchAddress = async (id: number): Promise<UserAddress> => {
  const response = await api.get<UserAddress>(`/addresses/${id}`);
  return response.data;
};

export const createAddress = async (payload: CreateAddressPayload): Promise<UserAddress> => {
  const response = await api.post<UserAddress>('/addresses', payload);
  return response.data;
};

export const updateAddress = async (id: number, payload: UpdateAddressPayload): Promise<UserAddress> => {
  const response = await api.put<UserAddress>(`/addresses/${id}`, payload);
  return response.data;
};

export const deleteAddress = async (id: number): Promise<void> => {
  await api.delete(`/addresses/${id}`);
};

export const setDefaultAddress = async (id: number): Promise<UserAddress> => {
  const response = await api.post<UserAddress>(`/addresses/${id}/set-default`);
  return response.data;
};
