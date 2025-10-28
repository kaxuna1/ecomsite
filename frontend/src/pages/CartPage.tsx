import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function CartPage() {
  const { items, removeItem, updateQuantity, total } = useCart();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <Helmet>
        <title>Your Luxia Cart</title>
      </Helmet>
      <h1 className="font-display text-3xl">Your Rituals</h1>
      {items.length === 0 ? (
        <div className="mt-12 space-y-4 text-center">
          <p className="text-sm text-midnight/60">Your cart is currently empty.</p>
          <Link to="/products" className="btn-secondary inline-block">
            Browse rituals
          </Link>
        </div>
      ) : (
        <div className="mt-10 space-y-6">
          <ul className="space-y-4" aria-label="Cart items">
            {items.map(({ product, quantity }) => (
              <li key={product.id} className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-md sm:flex-row sm:items-center sm:gap-6">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-24 w-24 flex-shrink-0 rounded-2xl object-cover"
                  loading="lazy"
                />
                <div className="flex-1 space-y-1">
                  <h2 className="font-display text-lg">{product.name}</h2>
                  <p className="text-sm text-midnight/60">${product.price.toFixed(2)}</p>
                  <label className="block text-xs uppercase tracking-[0.4em] text-midnight/50">
                    Quantity
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        updateQuantity(product.id, Number.isNaN(value) ? 1 : value);
                      }}
                      className="mt-2 w-20 rounded-full border border-midnight/20 bg-champagne px-3 py-2 text-sm"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  className="btn-secondary self-start"
                  onClick={() => removeItem(product.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-col items-center justify-between gap-4 rounded-3xl bg-midnight px-6 py-8 text-champagne sm:flex-row">
            <p className="text-lg font-semibold">Subtotal: ${total.toFixed(2)}</p>
            <Link to="/checkout" className="btn-primary bg-white text-midnight hover:bg-blush">
              Proceed to checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;
