export interface Product {
  id: number;
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  imageUrl: string;
  inventory: number;
  categories: string[];
  highlights?: string[];
  usage?: string;
}

export interface OrderPayload {
  items: Array<{ productId: number; quantity: number }>;
  customer: {
    name: string;
    email: string;
    phone?: string;
    notes?: string;
    address: string;
  };
  total: number;
}

export interface Order extends OrderPayload {
  id: number;
  status: string;
  createdAt: string;
  items: Array<{ productId: number; quantity: number; name?: string; price?: number }>;
}
