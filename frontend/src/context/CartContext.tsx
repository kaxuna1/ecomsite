import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  ReactNode,
  useEffect
} from 'react';
import type { Product, PromoCode, ProductVariant } from '../types/product';

export type CartItem = {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
};

interface CartState {
  items: CartItem[];
  promoCode: PromoCode | null;
  discount: number;
}

type Action =
  | { type: 'ADD'; product: Product; variant?: ProductVariant; quantity: number }
  | { type: 'REMOVE'; productId: number; variantId?: number }
  | { type: 'UPDATE'; productId: number; variantId?: number; quantity: number }
  | { type: 'CLEAR' }
  | { type: 'APPLY_PROMO'; promoCode: PromoCode; discount: number }
  | { type: 'REMOVE_PROMO' };

const CartContext = createContext<{
  items: CartItem[];
  addItem: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  removeItem: (productId: number, variantId?: number) => void;
  updateQuantity: (productId: number, quantity: number, variantId?: number) => void;
  clear: () => void;
  total: number;
  subtotal: number;
  promoCode: PromoCode | null;
  discount: number;
  applyPromoCode: (promoCode: PromoCode, discount: number) => void;
  removePromoCode: () => void;
}>({
  items: [],
  addItem: () => undefined,
  removeItem: () => undefined,
  updateQuantity: () => undefined,
  clear: () => undefined,
  total: 0,
  subtotal: 0,
  promoCode: null,
  discount: 0,
  applyPromoCode: () => undefined,
  removePromoCode: () => undefined
});

const CART_STORAGE_KEY = 'luxia-cart';

const reducer = (state: CartState, action: Action): CartState => {
  switch (action.type) {
    case 'ADD': {
      // Find existing item with same product and variant
      const existing = state.items.find((item) =>
        item.product.id === action.product.id &&
        item.variant?.id === action.variant?.id
      );

      if (existing) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.product.id === action.product.id && item.variant?.id === action.variant?.id
              ? { ...item, quantity: item.quantity + action.quantity }
              : item
          )
        };
      }
      return {
        ...state,
        items: [...state.items, {
          product: action.product,
          variant: action.variant,
          quantity: action.quantity
        }]
      };
    }
    case 'REMOVE':
      return {
        ...state,
        items: state.items.filter((item) =>
          !(item.product.id === action.productId && item.variant?.id === action.variantId)
        )
      };
    case 'UPDATE':
      return {
        ...state,
        items: state.items.map((item) =>
          item.product.id === action.productId && item.variant?.id === action.variantId
            ? { ...item, quantity: Math.max(action.quantity, 1) }
            : item
        )
      };
    case 'CLEAR':
      return { items: [], promoCode: null, discount: 0 };
    case 'APPLY_PROMO':
      return { ...state, promoCode: action.promoCode, discount: action.discount };
    case 'REMOVE_PROMO':
      return { ...state, promoCode: null, discount: 0 };
    default:
      return state;
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    if (typeof window === 'undefined') {
      return { items: [], promoCode: null, discount: 0 };
    }
    const stored = window.localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as CartState;
      } catch (error) {
        console.warn('Failed to parse cart state from storage', error);
      }
    }
    return { items: [], promoCode: null, discount: 0 };
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const addItem = (product: Product, quantity = 1, variant?: ProductVariant) => {
    dispatch({ type: 'ADD', product, variant, quantity });
  };

  const removeItem = (productId: number, variantId?: number) =>
    dispatch({ type: 'REMOVE', productId, variantId });

  const updateQuantity = (productId: number, quantity: number, variantId?: number) =>
    dispatch({ type: 'UPDATE', productId, quantity, variantId });

  const clear = () => dispatch({ type: 'CLEAR' });

  const applyPromoCode = (promoCode: PromoCode, discount: number) => {
    dispatch({ type: 'APPLY_PROMO', promoCode, discount });
  };

  const removePromoCode = () => {
    dispatch({ type: 'REMOVE_PROMO' });
  };

  const subtotal = useMemo(
    () => state.items.reduce((sum, item) => {
      // Use variant price if available, otherwise fall back to product price
      const price = item.variant?.salePrice ?? item.variant?.price ?? item.product.salePrice ?? item.product.price;
      return sum + price * item.quantity;
    }, 0),
    [state.items]
  );

  const total = useMemo(
    () => Math.max(subtotal - state.discount, 0),
    [subtotal, state.discount]
  );

  const value = useMemo(
    () => ({
      items: state.items,
      addItem,
      removeItem,
      updateQuantity,
      clear,
      total,
      subtotal,
      promoCode: state.promoCode,
      discount: state.discount,
      applyPromoCode,
      removePromoCode
    }),
    [state.items, state.promoCode, state.discount, total, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
