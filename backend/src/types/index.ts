export interface Product {
  id: number;
  name: string;
  short_description: string;
  description: string;
  price: number;
  sale_price: number | null;
  image_url: string;
  inventory: number;
  categories: string;
  highlights: string | null;
  usage: string | null;
  is_new: boolean;
  is_featured: boolean;
  sales_count: number;
}

export interface ProductPayload {
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  salePrice?: number;
  inventory: number;
  categories: string[];
  highlights?: string[];
  usage?: string;
  isNew?: boolean;
  isFeatured?: boolean;
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
  addressId?: number; // Optional: ID of saved address if user selected one
  items: Array<{ productId: number; quantity: number }>;
  total: number;
  promoCode?: {
    id: number;
    code: string;
    discount: number;
  };
}
