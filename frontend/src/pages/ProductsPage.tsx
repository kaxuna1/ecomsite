import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchProducts } from '../api/products';

function ProductsPage() {
  const { data: products, isLoading } = useQuery({ queryKey: ['products'], queryFn: fetchProducts });

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <Helmet>
        <title>Luxia Rituals — Shop Rituals</title>
      </Helmet>
      <header className="space-y-4 text-center">
        <h1 className="font-display text-3xl sm:text-4xl">Shop Luxia Rituals</h1>
        <p className="mx-auto max-w-2xl text-sm text-midnight/70">
          Discover targeted treatments for detox, nourishment, and renewal. Each product is ethically sourced and tested for sensitive scalps.
        </p>
      </header>
      {isLoading ? (
        <p className="mt-12 text-center text-sm" role="status">
          Loading products…
        </p>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {products?.map((product) => (
            <article
              key={product.id}
              role="listitem"
              className="group flex flex-col overflow-hidden rounded-3xl border border-champagne/40 bg-white shadow-md transition hover:-translate-y-1 hover:shadow-xl"
            >
              <Link to={`/products/${product.id}`} className="block aspect-[4/5] bg-champagne">
                <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
              </Link>
              <div className="flex flex-1 flex-col gap-2 p-6">
                <h2 className="font-display text-lg text-midnight">{product.name}</h2>
                <p className="text-sm text-midnight/70">{product.shortDescription}</p>
                <p className="mt-auto text-sm font-semibold text-jade">${product.price.toFixed(2)}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductsPage;
