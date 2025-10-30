import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutlineIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCart } from '../../context/CartContext';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { addFavorite, removeFavorite, getFavorites } from '../../api/favorites';
import { getProductVariants } from '../../api/variants';
import type { Product } from '../../types/product';

interface ProductListProps {
  products: Product[];
  showElements?: {
    image?: boolean;
    title?: boolean;
    description?: boolean;
    shortDescription?: boolean;
    price?: boolean;
    comparePrice?: boolean;
    rating?: boolean;
    reviewCount?: boolean;
    addToCart?: boolean;
    quickView?: boolean;
    wishlist?: boolean;
    categories?: boolean;
    badges?: boolean;
    stock?: boolean;
  };
  style?: {
    cardStyle?: 'elevated' | 'flat' | 'outlined' | 'minimal';
    imageAspectRatio?: '1:1' | '4:5' | '3:4' | '16:9';
    hoverEffect?: 'zoom' | 'lift' | 'fade' | 'slide' | 'none';
    borderRadius?: 'none' | 'small' | 'medium' | 'large' | 'full';
  };
  onQuickAdd?: (product: Product) => void;
}

interface ProductListItemProps {
  product: Product;
  index: number;
  showElements: NonNullable<ProductListProps['showElements']>;
  style: NonNullable<ProductListProps['style']>;
  onQuickAdd: (product: Product) => void;
  favorites: Array<{ productId: number }> | undefined;
  handleFavoriteClick: (e: React.MouseEvent, productId: number) => Promise<void>;
  cardStyleClasses: Record<string, string>;
  borderRadiusClasses: Record<string, string>;
  hoverEffectClasses: Record<string, string>;
}

function ProductListItem({
  product,
  index,
  showElements,
  style,
  onQuickAdd,
  favorites,
  handleFavoriteClick,
  cardStyleClasses,
  borderRadiusClasses,
  hoverEffectClasses
}: ProductListItemProps) {
  const { language } = useI18n();
  const navigate = useNavigate();
  const { cardStyle, imageAspectRatio, hoverEffect, borderRadius } = style;

  // Fetch variants for this product
  const { data: variants = [] } = useQuery({
    queryKey: ['product-variants', product.id],
    queryFn: () => getProductVariants(product.id),
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  });

  // Calculate variant info
  const hasVariants = variants.length > 0;
  const variantCount = variants.length;
  const priceRange = hasVariants
    ? {
        min: Math.min(...variants.map(v => v.price ?? product.price)),
        max: Math.max(...variants.map(v => v.price ?? product.price))
      }
    : null;
  const showPriceRange = priceRange && priceRange.min !== priceRange.max;

  const handleQuickAdd = (product: Product) => {
    if (hasVariants) {
      navigate(`/${language}/products/${product.id}`);
    } else {
      onQuickAdd(product);
    }
  };

  // Get display image - prefer featured image from images array
  const getDisplayImage = () => {
    if (product.images && product.images.length > 0) {
      const featuredImage = product.images.find(img => img.isFeatured);
      return featuredImage?.url || product.images[0].url;
    }
    // Ensure imageUrl has proper API prefix if it's a relative path
    const imageUrl = product.imageUrl;
    if (imageUrl && imageUrl.startsWith('/uploads/') && !imageUrl.startsWith('http')) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      return `${apiUrl}${imageUrl}`;
    }
    return imageUrl;
  };

  return (
    <motion.article
      key={product.id}
      className={`group relative flex flex-col md:flex-row gap-6 overflow-hidden border-2 border-champagne/40 bg-white p-6 transition-all hover:border-jade/40 ${borderRadiusClasses[borderRadius as keyof typeof borderRadiusClasses]} ${cardStyleClasses[cardStyle as keyof typeof cardStyleClasses]} ${hoverEffectClasses[hoverEffect as keyof typeof hoverEffectClasses]}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
    >
      {/* Product Image */}
      {showElements.image !== false && (
        <Link
          to={`/${language}/products/${product.id}`}
          className={`relative flex-shrink-0 w-full md:w-64 overflow-hidden bg-champagne ${
            borderRadius === 'none'
              ? 'rounded-none'
              : borderRadius === 'small'
              ? 'rounded-lg'
              : borderRadius === 'medium'
              ? 'rounded-2xl'
              : borderRadius === 'large'
              ? 'rounded-3xl'
              : 'rounded-full'
          } ${
            imageAspectRatio === '1:1'
              ? 'aspect-square'
              : imageAspectRatio === '4:5'
              ? 'aspect-[4/5]'
              : imageAspectRatio === '3:4'
              ? 'aspect-[3/4]'
              : 'aspect-[16/9]'
          }`}
        >
          <motion.img
            src={getDisplayImage()}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
            whileHover={hoverEffect === 'zoom' ? { scale: 1.05 } : {}}
            transition={{ duration: 0.4 }}
          />

          {/* Badges */}
          {showElements.badges !== false && (
            <>
              {product.isNew && (
                <div className="absolute left-3 top-3 rounded-full bg-jade/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                  New
                </div>
              )}
              {product.salePrice && (
                <div className="absolute right-3 top-3 rounded-full bg-red-500/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                  Sale
                </div>
              )}
            </>
          )}

          {/* Stock Badge */}
          {showElements.stock !== false &&
            product.inventory < 10 &&
            product.inventory > 0 && (
              <div className="absolute left-3 top-12 rounded-full bg-amber-500/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                Only {product.inventory} left
              </div>
            )}

          {/* Variant Options Badge */}
          {hasVariants && (
            <div className="absolute left-3 top-[5.5rem] rounded-full bg-blush/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur flex items-center gap-1">
              <Squares2X2Icon className="h-3.5 w-3.5" />
              {variantCount} {variantCount === 1 ? 'Option' : 'Options'}
            </div>
          )}

          {/* Wishlist Button - Top Right */}
          {showElements.wishlist !== false && (
            <motion.button
              type="button"
              onClick={(e) => handleFavoriteClick(e, product.id)}
              className="absolute right-3 bottom-3 z-10 rounded-full bg-white p-2.5 shadow-lg transition-all hover:scale-110"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title={favorites?.some(fav => fav.productId === product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              {favorites?.some(fav => fav.productId === product.id) ? (
                <HeartSolidIcon className="h-6 w-6 text-rose-500" />
              ) : (
                <HeartOutlineIcon className="h-6 w-6 text-midnight" />
              )}
            </motion.button>
          )}
        </Link>
      )}

      {/* Product Info */}
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex-1">
          {/* Categories */}
          {showElements.categories !== false &&
            product.categories &&
            product.categories.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {product.categories.slice(0, 3).map((category: string) => (
                  <span
                    key={category}
                    className="rounded-full bg-jade/10 px-2 py-0.5 text-xs font-medium text-jade capitalize"
                  >
                    {category}
                  </span>
                ))}
              </div>
            )}

          {/* Product Title */}
          {showElements.title !== false && (
            <Link to={`/${language}/products/${product.id}`}>
              <h3 className="font-display text-2xl leading-tight text-midnight transition-colors hover:text-jade">
                {product.name}
              </h3>
            </Link>
          )}

          {/* Star Rating */}
          {showElements.rating !== false && (
            <div className="mt-2 flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <StarIconSolid key={i} className="h-5 w-5 text-yellow-400" />
              ))}
              {showElements.reviewCount !== false && (
                <span className="ml-2 text-sm text-midnight/60">(245 reviews)</span>
              )}
            </div>
          )}

          {/* Description */}
          {showElements.description !== false && product.description && (
            <p className="mt-3 text-base text-midnight/70 line-clamp-3">
              {product.description}
            </p>
          )}

          {/* Short Description (fallback) */}
          {showElements.shortDescription !== false &&
            !showElements.description &&
            product.shortDescription && (
              <p className="mt-3 text-base text-midnight/70 line-clamp-2">
                {product.shortDescription}
              </p>
            )}
        </div>

        {/* Price and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-champagne/40">
          {/* Price */}
          {showElements.price !== false && (
            <div className="flex items-baseline gap-3">
              {showPriceRange ? (
                <span className="text-3xl font-bold text-jade">
                  ${priceRange!.min.toFixed(2)} - ${priceRange!.max.toFixed(2)}
                </span>
              ) : (
                <>
                  <span className="text-3xl font-bold text-jade">
                    ${(product.salePrice || product.price).toFixed(2)}
                  </span>
                  {showElements.comparePrice !== false && product.salePrice && (
                    <span className="text-lg text-midnight/40 line-through">
                      ${product.price.toFixed(2)}
                    </span>
                  )}
                </>
              )}
            </div>
          )}

          {/* Add to Cart Button */}
          {showElements.addToCart !== false && (
            <motion.button
              type="button"
              onClick={() => handleQuickAdd(product)}
              className="flex items-center justify-center gap-2 rounded-full bg-jade px-8 py-3 text-base font-semibold text-white shadow-lg transition-all hover:bg-jade/90 hover:shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <span>{hasVariants ? 'Select Options' : 'Add to Cart'}</span>
            </motion.button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export default function ProductList({
  products,
  showElements = {},
  style = {},
  onQuickAdd
}: ProductListProps) {
  const { addItem } = useCart();
  const { language } = useI18n();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch favorites
  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
    enabled: isAuthenticated
  });

  // Mutations
  const addFavoriteMutation = useMutation({
    mutationFn: addFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    }
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: removeFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    }
  });

  // Style properties with defaults
  const cardStyle = style?.cardStyle || 'elevated';
  const imageAspectRatio = style?.imageAspectRatio || '4:5';
  const hoverEffect = style?.hoverEffect || 'lift';
  const borderRadius = style?.borderRadius || 'large';

  // Style mappings
  const cardStyleClasses = {
    elevated: 'shadow-lg hover:shadow-2xl',
    flat: 'shadow-none',
    outlined: 'shadow-none border-2 border-champagne/40',
    minimal: 'shadow-none border-0'
  };

  const borderRadiusClasses = {
    none: 'rounded-none',
    small: 'rounded-lg',
    medium: 'rounded-3xl',
    large: 'rounded-[2rem]',
    full: 'rounded-full'
  };

  const hoverEffectClasses = {
    zoom: 'hover:scale-[1.02]',
    lift: 'hover:-translate-y-1',
    fade: 'hover:opacity-90',
    slide: 'hover:translate-x-1',
    none: ''
  };

  const handleQuickAdd = (product: Product) => {
    if (onQuickAdd) {
      onQuickAdd(product);
    } else {
      addItem(product, 1);
    }
  };

  const handleFavoriteClick = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate(`/${language}/login`, { state: { from: window.location.pathname } });
      return;
    }

    const isFavorited = favorites?.some(fav => fav.productId === productId);

    if (isFavorited) {
      await removeFavoriteMutation.mutateAsync(productId);
    } else {
      await addFavoriteMutation.mutateAsync(productId);
    }
  };

  return (
    <div className="space-y-6">
      {products.map((product, index) => (
        <ProductListItem
          key={product.id}
          product={product}
          index={index}
          showElements={showElements}
          style={{ cardStyle, imageAspectRatio, hoverEffect, borderRadius }}
          onQuickAdd={handleQuickAdd}
          favorites={favorites}
          handleFavoriteClick={handleFavoriteClick}
          cardStyleClasses={cardStyleClasses}
          borderRadiusClasses={borderRadiusClasses}
          hoverEffectClasses={hoverEffectClasses}
        />
      ))}
    </div>
  );
}
