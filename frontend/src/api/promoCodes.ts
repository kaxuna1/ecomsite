import api from './client';
import type {
  PromoCode,
  PromoCodeValidation,
  PromoCodeStats,
  CreatePromoCodePayload,
  UpdatePromoCodePayload
} from '../types/product';

export const validatePromoCode = async (
  code: string,
  cartTotal: number
): Promise<PromoCodeValidation> => {
  const response = await api.post<PromoCodeValidation>('/promo-codes/validate', {
    code,
    cartTotal
  });
  return response.data;
};

export const getAllPromoCodes = async (): Promise<PromoCode[]> => {
  const response = await api.get<PromoCode[]>('/promo-codes');
  return response.data;
};

export const getPromoCode = async (id: number): Promise<PromoCode> => {
  const response = await api.get<PromoCode>(`/promo-codes/${id}`);
  return response.data;
};

export const getPromoCodeStats = async (id: number): Promise<PromoCodeStats> => {
  const response = await api.get<PromoCodeStats>(`/promo-codes/${id}/stats`);
  return response.data;
};

export const createPromoCode = async (data: CreatePromoCodePayload): Promise<PromoCode> => {
  const response = await api.post<PromoCode>('/promo-codes', data);
  return response.data;
};

export const updatePromoCode = async (
  id: number,
  data: UpdatePromoCodePayload
): Promise<PromoCode> => {
  const response = await api.patch<PromoCode>(`/promo-codes/${id}`, data);
  return response.data;
};

export const deletePromoCode = async (id: number): Promise<void> => {
  await api.delete(`/promo-codes/${id}`);
};
