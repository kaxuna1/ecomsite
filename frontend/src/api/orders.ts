import api from './client';
import type { Order, OrderPayload } from '../types/product';

export const createOrder = async (payload: OrderPayload): Promise<Order> => {
  const response = await api.post<Order>('/orders', payload);
  return response.data;
};

export const fetchOrders = async (): Promise<Order[]> => {
  const response = await api.get<Order[]>('/orders');
  return response.data;
};

export const updateOrderStatus = async (id: number, status: string) => {
  const response = await api.patch<Order>(`/orders/${id}`, { status });
  return response.data;
};
