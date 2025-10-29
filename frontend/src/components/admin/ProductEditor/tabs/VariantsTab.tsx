import { useQuery } from '@tanstack/react-query';
import { fetchProduct } from '../../../../api/products';
import VariantManager from '../../VariantManager';

interface VariantsTabProps {
  productId: number;
}

export default function VariantsTab({ productId }: VariantsTabProps) {
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProduct(productId)
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blush border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-champagne/60">Product not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-champagne">Product Variants & SKUs</h2>
        <p className="mt-2 text-sm text-champagne/60">
          Create and manage product variants with different options like size, color, or material.
          Each variant can have its own SKU, price, and inventory.
        </p>
      </div>

      <VariantManager
        productId={productId}
        productName={product.name}
        baseProduct={{
          price: product.price,
          salePrice: product.salePrice,
          inventory: product.inventory,
          imageUrl: product.imageUrl
        }}
      />
    </div>
  );
}
