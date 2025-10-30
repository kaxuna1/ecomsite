import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutlineIcon, ShareIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCart } from '../../context/CartContext';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { addFavorite, removeFavorite, getFavorites } from '../../api/favorites';
import type { Product } from '../../types/product';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
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

  const isFavorited = favorites?.some(fav => fav.productId === product?.id);

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

  if (!product) return null;

  const images = product.images && product.images.length > 0
    ? product.images.map((img) => typeof img === 'string' ? img : img.url)
    : [product.imageUrl];
  const currentPrice = product.salePrice || product.price;
  const hasDiscount = !!product.salePrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
    : 0;

  const handleAddToCart = () => {
    addItem(product, quantity);
    onClose();
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= product.inventory) {
      setQuantity(newQuantity);
    }
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      onClose();
      navigate(`/${language}/login`, { state: { from: window.location.pathname } });
      return;
    }

    if (isFavorited) {
      await removeFavoriteMutation.mutateAsync(product.id);
    } else {
      await addFavoriteMutation.mutateAsync(product.id);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-midnight/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
                <div className="relative grid grid-cols-1 gap-8 p-8 md:grid-cols-2">
                  {/* Close Button */}
                  <button
                    onClick={onClose}
                    className="absolute right-4 top-4 z-10 rounded-full bg-white p-2 text-midnight shadow-lg transition-all hover:scale-110 hover:bg-jade hover:text-white"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>

                  {/* Left Column - Images */}
                  <div className="space-y-4">
                    {/* Main Image */}
                    <div className="relative aspect-square overflow-hidden rounded-2xl bg-champagne">
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={selectedImage}
                          src={images[selectedImage]}
                          alt={product.name}
                          className="h-full w-full object-cover"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        />
                      </AnimatePresence>

                      {/* Badges */}
                      <div className="absolute left-4 top-4 flex flex-col gap-2">
                        {product.isNew && (
                          <span className="rounded-full bg-jade/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                            New
                          </span>
                        )}
                        {hasDiscount && (
                          <span className="rounded-full bg-red-500/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                            -{discountPercent}%
                          </span>
                        )}
                        {product.inventory < 10 && product.inventory > 0 && (
                          <span className="rounded-full bg-amber-500/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                            Only {product.inventory} left
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Thumbnail Gallery */}
                    {images.length > 1 && (
                      <div className="flex gap-2">
                        {images.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedImage(idx)}
                            className={`relative aspect-square w-20 overflow-hidden rounded-lg border-2 transition-all ${
                              selectedImage === idx
                                ? 'border-jade scale-105'
                                : 'border-champagne/40 hover:border-jade/50'
                            }`}
                          >
                            <img src={img} alt={`${product.name} ${idx + 1}`} className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column - Product Details */}
                  <div className="flex flex-col gap-4">
                    {/* Categories */}
                    {product.categories && product.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {product.categories.slice(0, 3).map((category: string) => (
                          <span
                            key={category}
                            className="rounded-full bg-jade/10 px-3 py-1 text-xs font-medium text-jade capitalize"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Title */}
                    <Dialog.Title className="font-display text-3xl text-midnight">
                      {product.name}
                    </Dialog.Title>

                    {/* Rating */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <StarIconSolid key={i} className="h-5 w-5 text-yellow-400" />
                        ))}
                      </div>
                      <span className="text-sm text-midnight/60">(245 reviews)</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-3 border-y border-champagne/40 py-4">
                      <span className="text-4xl font-bold text-jade">${currentPrice.toFixed(2)}</span>
                      {hasDiscount && (
                        <>
                          <span className="text-xl text-midnight/40 line-through">
                            ${product.price.toFixed(2)}
                          </span>
                          <span className="rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white">
                            Save ${(product.price - product.salePrice!).toFixed(2)}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Description */}
                    {product.shortDescription && (
                      <p className="text-base text-midnight/70">{product.shortDescription}</p>
                    )}

                    {/* Stock Status */}
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          product.inventory > 10 ? 'bg-green-500' : product.inventory > 0 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                      />
                      <span className="text-sm text-midnight/70">
                        {product.inventory > 10
                          ? 'In Stock'
                          : product.inventory > 0
                          ? `Only ${product.inventory} left`
                          : 'Out of Stock'}
                      </span>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-midnight">Quantity:</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuantityChange(-1)}
                          disabled={quantity <= 1}
                          className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-champagne/40 text-midnight transition-all hover:border-jade disabled:opacity-50"
                        >
                          -
                        </button>
                        <span className="w-12 text-center text-lg font-semibold">{quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(1)}
                          disabled={quantity >= product.inventory}
                          className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-champagne/40 text-midnight transition-all hover:border-jade disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-auto space-y-3">
                      <button
                        onClick={handleAddToCart}
                        disabled={product.inventory === 0}
                        className="w-full rounded-full bg-jade px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {product.inventory === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </button>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={handleFavoriteClick}
                          className={`flex items-center justify-center gap-2 rounded-full border-2 px-4 py-3 text-sm font-semibold transition-all ${
                            isFavorited
                              ? 'border-rose-500 bg-rose-500 text-white hover:bg-rose-600'
                              : 'border-jade text-jade hover:bg-jade hover:text-white'
                          }`}
                        >
                          {isFavorited ? (
                            <HeartSolidIcon className="h-5 w-5" />
                          ) : (
                            <HeartOutlineIcon className="h-5 w-5" />
                          )}
                          <span>{isFavorited ? 'Added to Wishlist' : 'Add to Wishlist'}</span>
                        </button>
                        <button className="flex items-center justify-center gap-2 rounded-full border-2 border-champagne/40 px-4 py-3 text-sm font-semibold text-midnight transition-all hover:border-jade">
                          <ShareIcon className="h-5 w-5" />
                          <span>Share</span>
                        </button>
                      </div>

                      <Link
                        to={`/${language}/products/${product.id}`}
                        onClick={onClose}
                        className="block text-center text-sm font-medium text-jade hover:underline"
                      >
                        View Full Details →
                      </Link>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
