import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, Keyboard, A11y } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
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

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface ProductCarouselProps {
  products: Product[];
  carouselSettings?: {
    autoPlay?: boolean;
    autoPlayInterval?: number;
    loop?: boolean;
    showArrows?: boolean;
    showDots?: boolean;
    slidesPerView?: number;
  };
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
  onQuickView?: (product: Product) => void;
}

interface ProductSlideProps {
  product: Product;
  showElements: ProductCarouselProps['showElements'];
  style: ProductCarouselProps['style'];
  cardStyleClasses: Record<string, string>;
  borderRadiusClasses: Record<string, string>;
  imageAspectRatio: string;
  hoverEffect: string;
  borderRadius: string;
  cardStyle: string;
  handleQuickAdd: (product: Product, hasVariants: boolean) => void;
  handleFavoriteClick: (e: React.MouseEvent, productId: number) => void;
  onQuickView?: (product: Product) => void;
  favorites?: Array<{ productId: number }>;
  language: string;
}

function ProductSlide({
  product,
  showElements = {},
  cardStyleClasses,
  borderRadiusClasses,
  imageAspectRatio,
  hoverEffect,
  borderRadius,
  cardStyle,
  handleQuickAdd,
  handleFavoriteClick,
  onQuickView,
  favorites,
  language
}: ProductSlideProps) {
  const navigate = useNavigate();

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

  // Get display image - prefer featured image from images array
  const getDisplayImage = () => {
    if (product.images && product.images.length > 0) {
      const featuredImage = product.images.find(img => img.isFeatured);
      const imageUrl = featuredImage?.url || product.images[0].url;
      console.log('ProductCarousel - Using media library image:', imageUrl, 'for product:', product.id);
      return imageUrl;
    }
    // Ensure imageUrl has proper API prefix if it's a relative path
    const imageUrl = product.imageUrl;
    if (imageUrl && imageUrl.startsWith('/uploads/') && !imageUrl.startsWith('http')) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      const fullUrl = `${apiUrl}${imageUrl}`;
      console.log('ProductCarousel - Using imageUrl with API prefix:', fullUrl, 'for product:', product.id);
      return fullUrl;
    }
    console.log('ProductCarousel - Using imageUrl as-is:', imageUrl, 'for product:', product.id);
    return imageUrl;
  };

  const displayImage = getDisplayImage();

  return (
    <article
      className={`group relative flex flex-col overflow-hidden border-2 border-champagne/40 bg-white transition-all hover:border-jade/40 ${borderRadiusClasses[borderRadius as keyof typeof borderRadiusClasses]} ${cardStyleClasses[cardStyle as keyof typeof cardStyleClasses]}`}
    >
      {/* Product Image */}
      {showElements.image !== false && (
        <Link
          to={`/${language}/products/${product.id}`}
          className={`relative overflow-hidden bg-champagne ${
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
            src={displayImage}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
            whileHover={hoverEffect === 'zoom' ? { scale: 1.05 } : {}}
            transition={{ duration: 0.4 }}
          />

          {/* Quick View Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-midnight/60 via-midnight/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

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
              className="absolute right-3 top-3 z-10 rounded-full bg-white p-2 shadow-lg transition-all hover:scale-110"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title={favorites?.some(fav => fav.productId === product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              {favorites?.some(fav => fav.productId === product.id) ? (
                <HeartSolidIcon className="h-5 w-5 text-rose-500" />
              ) : (
                <HeartOutlineIcon className="h-5 w-5 text-midnight" />
              )}
            </motion.button>
          )}

          {/* Action Buttons */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            {showElements.quickView !== false && onQuickView && (
              <motion.button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onQuickView(product);
                }}
                className="flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-midnight shadow-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Quick View"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </motion.button>
            )}
            {showElements.addToCart !== false && (
              <motion.button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleQuickAdd(product, hasVariants);
                }}
                className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-midnight shadow-xl"
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
                <span>{hasVariants ? 'Select Options' : 'Add'}</span>
              </motion.button>
            )}
          </div>
        </Link>
      )}

      {/* Product Info */}
      <div className="flex flex-1 flex-col gap-2 p-6">
        {/* Star Rating */}
        {showElements.rating !== false && (
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <StarIconSolid key={i} className="h-4 w-4 text-yellow-400" />
            ))}
            {showElements.reviewCount !== false && (
              <span className="ml-2 text-xs text-midnight/60">(245)</span>
            )}
          </div>
        )}

        {/* Product Title */}
        {showElements.title !== false && (
          <Link to={`/${language}/products/${product.id}`}>
            <h3 className="font-display text-lg leading-tight text-midnight transition-colors hover:text-jade line-clamp-2">
              {product.name}
            </h3>
          </Link>
        )}

        {/* Short Description */}
        {showElements.shortDescription !== false && product.shortDescription && (
          <p className="mt-1 text-sm text-midnight/60 line-clamp-2">
            {product.shortDescription}
          </p>
        )}

        {/* Description (full) */}
        {showElements.description !== false &&
          showElements.shortDescription === false &&
          product.description && (
            <p className="mt-1 text-sm text-midnight/60 line-clamp-3">
              {product.description}
            </p>
          )}

        {/* Price */}
        {showElements.price !== false && (
          <div className="mt-auto flex items-center gap-2">
            {showPriceRange ? (
              <span className="text-xl font-bold text-jade">
                ${priceRange!.min.toFixed(2)} - ${priceRange!.max.toFixed(2)}
              </span>
            ) : (
              <>
                <span className="text-xl font-bold text-jade">
                  ${(product.salePrice || product.price).toFixed(2)}
                </span>
                {showElements.comparePrice !== false && product.salePrice && (
                  <span className="text-sm text-midnight/40 line-through">
                    ${product.price.toFixed(2)}
                  </span>
                )}
              </>
            )}
          </div>
        )}

        {/* Categories */}
        {showElements.categories !== false &&
          product.categories &&
          product.categories.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {product.categories.slice(0, 2).map((category: string) => (
                <span
                  key={category}
                  className="rounded-full bg-jade/10 px-2 py-0.5 text-xs font-medium text-jade capitalize"
                >
                  {category}
                </span>
              ))}
            </div>
          )}
      </div>
    </article>
  );
}

export default function ProductCarousel({
  products,
  carouselSettings = {},
  showElements = {},
  style = {},
  onQuickAdd,
  onQuickView
}: ProductCarouselProps) {
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
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

  // Carousel settings with defaults
  const {
    autoPlay = true,
    autoPlayInterval = 5000,
    loop = true,
    showArrows = true,
    showDots = true,
    slidesPerView = 4
  } = carouselSettings;

  // Style properties with defaults
  const cardStyle = style?.cardStyle || 'elevated';
  const imageAspectRatio = style?.imageAspectRatio || '4:5';
  const hoverEffect = style?.hoverEffect || 'zoom';
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

  const handleQuickAdd = (product: Product, hasVariants: boolean) => {
    if (hasVariants) {
      // Redirect to product page for variant selection
      navigate(`/${language}/products/${product.id}`);
      return;
    }

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
    <div className="relative">
      <Swiper
        modules={[Navigation, Pagination, Autoplay, Keyboard, A11y]}
        spaceBetween={24}
        slidesPerView={1}
        breakpoints={{
          640: {
            slidesPerView: Math.min(2, slidesPerView),
            spaceBetween: 20
          },
          768: {
            slidesPerView: Math.min(3, slidesPerView),
            spaceBetween: 24
          },
          1024: {
            slidesPerView: slidesPerView,
            spaceBetween: 24
          }
        }}
        navigation={showArrows ? {
          prevEl: '.swiper-button-prev-custom',
          nextEl: '.swiper-button-next-custom'
        } : false}
        pagination={showDots ? {
          clickable: true,
          dynamicBullets: true,
          dynamicMainBullets: 3
        } : false}
        autoplay={autoPlay ? {
          delay: autoPlayInterval,
          disableOnInteraction: false,
          pauseOnMouseEnter: true
        } : false}
        loop={loop && products.length > slidesPerView}
        keyboard={{
          enabled: true,
          onlyInViewport: true
        }}
        a11y={{
          prevSlideMessage: 'Previous product',
          nextSlideMessage: 'Next product',
          paginationBulletMessage: 'Go to product {{index}}'
        }}
        onSwiper={setSwiperInstance}
        className="!pb-12"
      >
        {products.map((product) => (
          <SwiperSlide key={product.id}>
            <ProductSlide
              product={product}
              showElements={showElements}
              style={style}
              cardStyleClasses={cardStyleClasses}
              borderRadiusClasses={borderRadiusClasses}
              imageAspectRatio={imageAspectRatio}
              hoverEffect={hoverEffect}
              borderRadius={borderRadius}
              cardStyle={cardStyle}
              handleQuickAdd={handleQuickAdd}
              handleFavoriteClick={handleFavoriteClick}
              onQuickView={onQuickView}
              favorites={favorites}
              language={language}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Navigation Buttons */}
      {showArrows && (
        <>
          <button
            className="swiper-button-prev-custom absolute left-0 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-xl transition-all hover:scale-110 hover:bg-jade hover:text-white disabled:opacity-50"
            aria-label="Previous products"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            className="swiper-button-next-custom absolute right-0 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-xl transition-all hover:scale-110 hover:bg-jade hover:text-white disabled:opacity-50"
            aria-label="Next products"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      )}

      {/* Custom styling for pagination */}
      <style>{`
        .swiper-pagination-bullet {
          background: #1a1a1a;
          opacity: 0.3;
          width: 8px;
          height: 8px;
          transition: all 0.3s ease;
        }
        .swiper-pagination-bullet-active {
          opacity: 1;
          background: #7c9473;
          width: 24px;
          border-radius: 4px;
        }
        .swiper-pagination {
          bottom: 0 !important;
        }
      `}</style>
    </div>
  );
}
