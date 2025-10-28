export interface Product {
  id: number;
  name: string;
  short_description: string;
  description: string;
  price: number;
  image_url: string;
  image_key: string;
  inventory: number;
  categories: string[];
  highlights: string[] | null;
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
