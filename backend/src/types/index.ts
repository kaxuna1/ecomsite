export interface Product {
  id: number;
  name: string;
  short_description: string;
  description: string;
  price: number;
  image_url: string;
  inventory: number;
  categories: string;
  highlights: string | null;
  usage: string | null;
}

export interface ProductPayload {
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  inventory: number;
  categories: string[];
  highlights?: string[];
  usage?: string;
}

export interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_notes: string | null;
  customer_address: string;
  total: number;
  status: string;
  created_at: string;
}

export interface OrderPayload {
  customer: {
    name: string;
    email: string;
    phone?: string;
    notes?: string;
    address: string;
  };
  items: Array<{ productId: number; quantity: number }>;
  total: number;
}
