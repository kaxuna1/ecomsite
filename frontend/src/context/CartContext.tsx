import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  ReactNode,
  useEffect
} from 'react';
import type { Product } from '../types/product';

type CartItem = {
  product: Product;
  quantity: number;
};

interface CartState {
  items: CartItem[];
}

type Action =
  | { type: 'ADD'; product: Product; quantity: number }
  | { type: 'REMOVE'; productId: number }
  | { type: 'UPDATE'; productId: number; quantity: number }
  | { type: 'CLEAR' };

const CartContext = createContext<{
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clear: () => void;
  total: number;
}>({
  items: [],
  addItem: () => undefined,
  removeItem: () => undefined,
  updateQuantity: () => undefined,
  clear: () => undefined,
  total: 0
});

const CART_STORAGE_KEY = 'luxia-cart';

const reducer = (state: CartState, action: Action): CartState => {
  switch (action.type) {
    case 'ADD': {
      const existing = state.items.find((item) => item.product.id === action.product.id);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.product.id === action.product.id
              ? { ...item, quantity: item.quantity + action.quantity }
              : item
          )
        };
      }
      return { items: [...state.items, { product: action.product, quantity: action.quantity }] };
    }
    case 'REMOVE':
      return { items: state.items.filter((item) => item.product.id !== action.productId) };
    case 'UPDATE':
      return {
        items: state.items.map((item) =>
          item.product.id === action.productId
            ? { ...item, quantity: Math.max(action.quantity, 1) }
            : item
        )
      };
    case 'CLEAR':
      return { items: [] };
    default:
      return state;
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    if (typeof window === 'undefined') {
      return { items: [] };
    }
    const stored = window.localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as CartState;
      } catch (error) {
        console.warn('Failed to parse cart state from storage', error);
      }
    }
    return { items: [] };
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const addItem = (product: Product, quantity = 1) => {
    dispatch({ type: 'ADD', product, quantity });
  };

  const removeItem = (productId: number) => dispatch({ type: 'REMOVE', productId });

  const updateQuantity = (productId: number, quantity: number) =>
    dispatch({ type: 'UPDATE', productId, quantity });

  const clear = () => dispatch({ type: 'CLEAR' });

  const total = useMemo(
    () => state.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [state.items]
  );

  const value = useMemo(
    () => ({ items: state.items, addItem, removeItem, updateQuantity, clear, total }),
    [state.items, total]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
