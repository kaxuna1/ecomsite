import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  XMarkIcon,
  PhotoIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import { createProduct, deleteProduct, fetchAllProducts, updateProduct } from '../../api/products';
import { getAllAttributes } from '../../api/attributes';
import type { Product } from '../../types/product';
import LoadingState from '../../components/admin/LoadingState';
import EmptyState from '../../components/admin/EmptyState';
import SearchInput from '../../components/admin/SearchInput';
import Button from '../../components/admin/Button';
import ProductTable from '../../components/admin/ProductTable';
import BulkActionsBar from '../../components/admin/BulkActionsBar';
import VariantManager from '../../components/admin/VariantManager';
import PageHeader from '../../components/admin/PageHeader';

interface ProductForm {
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  salePrice?: number;
  inventory: number;
  categories: string[];
  highlights?: string[];
  usage?: string;
  isNew: boolean;
  isFeatured: boolean;
  image?: FileList;
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImageUrl?: string;
  canonicalUrl?: string;
  customAttributes?: Record<string, any>;
}

type FilterOption = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock' | 'new' | 'featured' | 'on-sale';
type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc' | 'newest' | 'oldest';

function AdminProducts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: products = [], isLoading } = useQuery({ queryKey: ['admin-products'], queryFn: fetchAllProducts });
  const { data: attributes = [] } = useQuery({
    queryKey: ['admin-attributes'],
    queryFn: getAllAttributes
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categoryInput, setCategoryInput] = useState('');
  const [highlightInput, setHighlightInput] = useState('');
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const hasActiveFilters = Boolean(
    searchQuery || filterOption !== 'all' || sortOption !== 'newest'
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors, isDirty }
  } = useForm<ProductForm>({
    defaultValues: {
      name: '',
      shortDescription: '',
      description: '',
      price: 0,
      salePrice: undefined,
      inventory: 0,
      categories: [],
      highlights: [],
      usage: '',
      isNew: false,
      isFeatured: false,
      customAttributes: {}
    }
  });

  const categories = watch('categories');
  const highlights = watch('highlights');
  const imageFile = watch('image');
  const customAttributes = watch('customAttributes') || {};

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(query) ||
          p.shortDescription.toLowerCase().includes(query) ||
          p.categories.some(c => c.toLowerCase().includes(query))
      );
    }

    // Status filter
    switch (filterOption) {
      case 'in-stock':
        filtered = filtered.filter(p => p.inventory > 10);
        break;
      case 'low-stock':
        filtered = filtered.filter(p => p.inventory > 0 && p.inventory <= 10);
        break;
      case 'out-of-stock':
        filtered = filtered.filter(p => p.inventory === 0);
        break;
      case 'new':
        filtered = filtered.filter(p => p.isNew);
        break;
      case 'featured':
        filtered = filtered.filter(p => p.isFeatured);
        break;
      case 'on-sale':
        filtered = filtered.filter(p => p.salePrice);
        break;
    }

    // Sort
    const sorted = [...filtered];
    switch (sortOption) {
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'stock-asc':
        sorted.sort((a, b) => a.inventory - b.inventory);
        break;
      case 'stock-desc':
        sorted.sort((a, b) => b.inventory - a.inventory);
        break;
      case 'oldest':
        sorted.sort((a, b) => a.id - b.id);
        break;
      case 'newest':
      default:
        sorted.sort((a, b) => b.id - a.id);
    }

    return sorted;
  }, [products, searchQuery, filterOption, sortOption]);

  const resetFilters = () => {
    setSearchQuery('');
    setFilterOption('all');
    setSortOption('newest');
  };

  const createMutation = useMutation({
    mutationFn: (data: FormData) => createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      closeModal();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }: { id: number; formData: FormData }) => updateProduct(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      closeModal();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] })
  });

  // Handle inline field update
  const handleUpdateField = async (productId: number, field: string, value: any) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const formData = new FormData();
    formData.append('name', product.name);
    formData.append('shortDescription', product.shortDescription);
    formData.append('description', product.description);
    formData.append('price', field === 'price' ? String(value) : String(product.price));
    if (product.salePrice) formData.append('salePrice', String(product.salePrice));
    formData.append('inventory', field === 'inventory' ? String(value) : String(product.inventory));
    formData.append('categories', JSON.stringify(product.categories));
    if (product.highlights && product.highlights.length > 0) {
      formData.append('highlights', JSON.stringify(product.highlights));
    }
    if (product.usage) formData.append('usage', product.usage);
    formData.append('isNew', String(product.isNew || false));
    formData.append('isFeatured', String(product.isFeatured || false));

    await updateMutation.mutateAsync({ id: productId, formData });
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    const count = selectedProductIds.length;
    if (!window.confirm(`Are you sure you want to delete ${count} product${count > 1 ? 's' : ''}? This action cannot be undone.`)) {
      return;
    }

    try {
      await Promise.all(selectedProductIds.map(id => deleteMutation.mutateAsync(id)));
      setSelectedProductIds([]);
    } catch (error) {
      console.error('Failed to delete products:', error);
      alert('Failed to delete some products. Please try again.');
    }
  };

  // Handle bulk set new
  const handleBulkSetNew = async (value: boolean) => {
    try {
      await Promise.all(
        selectedProductIds.map(async (id) => {
          const product = products.find(p => p.id === id);
          if (!product) return;

          const formData = new FormData();
          formData.append('name', product.name);
          formData.append('shortDescription', product.shortDescription);
          formData.append('description', product.description);
          formData.append('price', String(product.price));
          if (product.salePrice) formData.append('salePrice', String(product.salePrice));
          formData.append('inventory', String(product.inventory));
          formData.append('categories', JSON.stringify(product.categories));
          if (product.highlights && product.highlights.length > 0) {
            formData.append('highlights', JSON.stringify(product.highlights));
          }
          if (product.usage) formData.append('usage', product.usage);
          formData.append('isNew', String(value));
          formData.append('isFeatured', String(product.isFeatured || false));

          await updateMutation.mutateAsync({ id, formData });
        })
      );
      setSelectedProductIds([]);
    } catch (error) {
      console.error('Failed to update products:', error);
      alert('Failed to update some products. Please try again.');
    }
  };

  // Handle bulk set featured
  const handleBulkSetFeatured = async (value: boolean) => {
    try {
      await Promise.all(
        selectedProductIds.map(async (id) => {
          const product = products.find(p => p.id === id);
          if (!product) return;

          const formData = new FormData();
          formData.append('name', product.name);
          formData.append('shortDescription', product.shortDescription);
          formData.append('description', product.description);
          formData.append('price', String(product.price));
          if (product.salePrice) formData.append('salePrice', String(product.salePrice));
          formData.append('inventory', String(product.inventory));
          formData.append('categories', JSON.stringify(product.categories));
          if (product.highlights && product.highlights.length > 0) {
            formData.append('highlights', JSON.stringify(product.highlights));
          }
          if (product.usage) formData.append('usage', product.usage);
          formData.append('isNew', String(product.isNew || false));
          formData.append('isFeatured', String(value));

          await updateMutation.mutateAsync({ id, formData });
        })
      );
      setSelectedProductIds([]);
    } catch (error) {
      console.error('Failed to update products:', error);
      alert('Failed to update some products. Please try again.');
    }
  };

  // Handle bulk set active (placeholder - would need backend support)
  const handleBulkSetActive = async (value: boolean) => {
    alert(`Bulk ${value ? 'activate' : 'deactivate'} functionality coming soon!`);
  };

  // Handle duplicate product
  const handleDuplicate = (product: Product) => {
    openCreateModal();
    reset({
      name: `${product.name} (Copy)`,
      shortDescription: product.shortDescription,
      description: product.description,
      price: product.price,
      salePrice: product.salePrice || undefined,
      inventory: product.inventory,
      categories: product.categories,
      highlights: product.highlights || [],
      usage: product.usage || '',
      isNew: false,
      isFeatured: false,
      customAttributes: product.customAttributes || {}
    });
  };

  const onSubmit = (form: ProductForm) => {
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('shortDescription', form.shortDescription);
    formData.append('description', form.description);
    formData.append('price', String(form.price));
    if (form.salePrice) formData.append('salePrice', String(form.salePrice));
    formData.append('inventory', String(form.inventory));
    formData.append('categories', JSON.stringify(form.categories));
    if (form.highlights && form.highlights.length > 0) {
      formData.append('highlights', JSON.stringify(form.highlights));
    }
    if (form.usage) formData.append('usage', form.usage);
    formData.append('isNew', String(form.isNew));
    formData.append('isFeatured', String(form.isFeatured));

    // SEO fields
    if (form.slug) formData.append('slug', form.slug);
    if (form.metaTitle) formData.append('metaTitle', form.metaTitle);
    if (form.metaDescription) formData.append('metaDescription', form.metaDescription);
    if (form.metaKeywords && form.metaKeywords.length > 0) {
      formData.append('metaKeywords', JSON.stringify(form.metaKeywords));
    }
    if (form.ogImageUrl) formData.append('ogImageUrl', form.ogImageUrl);
    if (form.canonicalUrl) formData.append('canonicalUrl', form.canonicalUrl);

    // Custom attributes
    if (form.customAttributes) {
      formData.append('customAttributes', JSON.stringify(form.customAttributes));
    }

    if (form.image?.[0]) {
      formData.append('image', form.image[0]);
    }

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openCreateModal = () => {
    navigate('/admin/products/new');
  };

  const openEditModal = (product: Product) => {
    navigate(`/admin/products/${product.id}/edit`);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setImagePreview(null);
    reset();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addCategory = () => {
    if (categoryInput.trim() && !categories.includes(categoryInput.trim())) {
      setValue('categories', [...categories, categoryInput.trim()], { shouldDirty: true });
      setCategoryInput('');
    }
  };

  const removeCategory = (category: string) => {
    setValue('categories', categories.filter(c => c !== category), { shouldDirty: true });
  };

  const addHighlight = () => {
    if (highlightInput.trim() && !highlights?.includes(highlightInput.trim())) {
      setValue('highlights', [...(highlights || []), highlightInput.trim()], { shouldDirty: true });
      setHighlightInput('');
    }
  };

  const removeHighlight = (highlight: string) => {
    setValue('highlights', highlights?.filter(h => h !== highlight) || [], { shouldDirty: true });
  };

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const getStockStatus = (inventory: number): { variant: 'success' | 'warning' | 'error'; label: string } => {
    if (inventory === 0) return { variant: 'error', label: 'Out of Stock' };
    if (inventory <= 10) return { variant: 'warning', label: 'Low Stock' };
    return { variant: 'success', label: 'In Stock' };
  };

  if (isLoading) {
    return <LoadingState message="Loading products..." />;
  }

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Manage Products — Luxia Admin</title>
      </Helmet>

      <PageHeader
        title="Product Management"
        description={`${filteredAndSortedProducts.length} of ${products.length} products`}
        actions={(
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={<ArrowDownTrayIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />}
              onClick={() => {
                // Export functionality placeholder
                alert('Export functionality coming soon!');
              }}
              className="flex-1 sm:flex-none min-w-0 !px-4 !py-2.5 sm:!px-5 sm:!py-3 !text-xs sm:!text-sm min-h-[44px] sm:min-h-[48px] transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <span className="whitespace-nowrap">Export</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />}
              onClick={openCreateModal}
              className="flex-1 sm:flex-none min-w-0 !px-4 !py-2.5 sm:!px-6 sm:!py-3 !text-xs sm:!text-sm min-h-[44px] sm:min-h-[48px] transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
            >
              <span className="whitespace-nowrap">
                <span className="hidden sm:inline">Add Product</span>
                <span className="sm:hidden">Add</span>
              </span>
            </Button>
          </>
        )}
      />

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div>
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder="Search products by name, description, or category..."
            label="Search products"
            resultsCount={filteredAndSortedProducts.length}
            resultsLabel="products"
            className="w-full"
          />
        </div>

        {/* Filters and Sort - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:grid-cols-3">
          {/* Filter */}
          <div className="relative sm:col-span-1">
            <FunnelIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-tertiary pointer-events-none z-10" />
            <select
              value={filterOption}
              onChange={(e) => setFilterOption(e.target.value as FilterOption)}
              aria-label="Filter products"
              className="w-full appearance-none rounded-full border border-border-default bg-bg-elevated pl-12 pr-4 py-3 text-sm sm:text-base text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
            >
              <option value="all">All Products</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
              <option value="new">New Arrivals</option>
              <option value="featured">Best Sellers</option>
              <option value="on-sale">On Sale</option>
            </select>
          </div>

          {/* Sort */}
          <div className="relative sm:col-span-1 lg:col-span-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-sm text-text-secondary whitespace-nowrap flex-shrink-0">Sort by:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                aria-label="Sort products"
                className="w-full rounded-full border border-border-default bg-bg-elevated px-4 py-3 text-sm sm:text-base text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="price-asc">Price (Low to High)</option>
                <option value="price-desc">Price (High to Low)</option>
                <option value="stock-asc">Stock (Low to High)</option>
                <option value="stock-desc">Stock (High to Low)</option>
              </select>
            </div>
          </div>
          {hasActiveFilters && (
            <div className="flex justify-end sm:col-span-2 lg:col-span-3">
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-semibold uppercase tracking-wider text-text-secondary hover:text-text-primary"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Products Table */}
      {filteredAndSortedProducts.length > 0 ? (
        <ProductTable
          products={filteredAndSortedProducts}
          isLoading={isLoading}
          onEdit={openEditModal}
          onDelete={(product) => handleDelete(product.id, product.name)}
          onManageVariants={setVariantProduct}
          onDuplicate={handleDuplicate}
          onUpdateField={handleUpdateField}
          selectedIds={selectedProductIds}
          onSelectionChange={setSelectedProductIds}
        />
      ) : (
        <EmptyState
          icon={<CubeIcon className="h-16 w-16" />}
          title="No products found"
          description={searchQuery ? "Try adjusting your search or filters" : "Get started by adding your first product"}
          action={
            !searchQuery
              ? {
                  label: 'Add Product',
                  onClick: openCreateModal,
                  icon: <PlusIcon className="h-5 w-5" />
                }
              : undefined
          }
        />
      )}

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedProductIds.length}
        onClearSelection={() => setSelectedProductIds([])}
        onBulkDelete={handleBulkDelete}
        onBulkSetNew={handleBulkSetNew}
        onBulkSetFeatured={handleBulkSetFeatured}
        onBulkSetActive={handleBulkSetActive}
      />

      {/* Product Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/90 backdrop-blur-sm p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-bg-elevated border border-border-default p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-2xl text-text-primary">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full p-2 text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Image Upload */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
                    Product Image
                  </label>
                  <div className="flex items-start gap-4">
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-32 w-32 rounded-xl object-cover"
                      />
                    )}
                    <label className="flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-default bg-bg-secondary px-6 py-8 transition-colors hover:border-primary hover:bg-bg-elevated">
                      <PhotoIcon className="h-12 w-12 text-text-tertiary" />
                      <p className="mt-2 text-sm text-text-secondary">Click to upload image</p>
                      <p className="mt-1 text-xs text-text-tertiary">PNG, JPG up to 10MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        {...register('image', { required: !editingProduct })}
                        onChange={(e) => {
                          register('image').onChange(e);
                          handleImageChange(e);
                        }}
                      />
                    </label>
                  </div>
                  {errors.image && <p className="mt-2 text-xs text-rose-400">{errors.image.message}</p>}
                </div>

                {/* Basic Information */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                      Product Name *
                    </label>
                    <input
                      className="w-full rounded-full border border-border-default bg-bg-elevated px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                      placeholder="e.g., Luxia Repair Serum"
                      {...register('name', { required: 'Product name is required' })}
                    />
                    {errors.name && <p className="mt-1 text-xs text-rose-400">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                      Inventory Count *
                    </label>
                    <input
                      type="number"
                      min={0}
                      className="w-full rounded-full border border-border-default bg-bg-elevated px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                      placeholder="0"
                      {...register('inventory', { required: 'Inventory count is required', valueAsNumber: true, min: 0 })}
                    />
                    {errors.inventory && <p className="mt-1 text-xs text-rose-400">{errors.inventory.message}</p>}
                  </div>
                </div>

                {/* Pricing */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                      Regular Price (USD) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      className="w-full rounded-full border border-border-default bg-bg-elevated px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                      placeholder="0.00"
                      {...register('price', { required: 'Price is required', valueAsNumber: true, min: 0 })}
                    />
                    {errors.price && <p className="mt-1 text-xs text-rose-400">{errors.price.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                      Sale Price (USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      className="w-full rounded-full border border-border-default bg-bg-elevated px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                      placeholder="Leave empty for no sale"
                      {...register('salePrice', { valueAsNumber: true })}
                    />
                    {errors.salePrice && <p className="mt-1 text-xs text-rose-400">{errors.salePrice.message}</p>}
                  </div>
                </div>

                {/* Descriptions */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                    Short Description *
                  </label>
                  <input
                    className="w-full rounded-full border border-border-default bg-bg-elevated px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                    placeholder="Brief one-line description"
                    {...register('shortDescription', { required: 'Short description is required' })}
                  />
                  {errors.shortDescription && <p className="mt-1 text-xs text-rose-400">{errors.shortDescription.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                    Full Description *
                  </label>
                  <textarea
                    rows={5}
                    className="w-full rounded-2xl border border-border-default bg-bg-elevated px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                    placeholder="Detailed product description"
                    {...register('description', { required: 'Description is required' })}
                  />
                  {errors.description && <p className="mt-1 text-xs text-rose-400">{errors.description.message}</p>}
                </div>

                {/* Categories */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-champagne/60 mb-2">
                    Categories *
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={categoryInput}
                      onChange={(e) => setCategoryInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                      className="flex-1 rounded-full border border-border-default bg-bg-elevated px-4 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                      placeholder="Add a category"
                    />
                    <button
                      type="button"
                      onClick={addCategory}
                      className="rounded-full bg-blush px-4 py-2 text-sm font-semibold text-midnight transition-colors hover:bg-champagne"
                    >
                      Add
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <span
                        key={category}
                        className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-champagne"
                      >
                        {category}
                        <button
                          type="button"
                          onClick={() => removeCategory(category)}
                          className="text-champagne/70 hover:text-champagne"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                  {categories.length === 0 && <p className="mt-2 text-xs text-rose-400">At least one category is required</p>}
                </div>

                {/* Highlights */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-champagne/60 mb-2">
                    Product Highlights
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={highlightInput}
                      onChange={(e) => setHighlightInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHighlight())}
                      className="flex-1 rounded-full border border-border-default bg-bg-elevated px-4 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                      placeholder="Add a highlight"
                    />
                    <button
                      type="button"
                      onClick={addHighlight}
                      className="rounded-full bg-blush px-4 py-2 text-sm font-semibold text-midnight transition-colors hover:bg-champagne"
                    >
                      Add
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {highlights?.map((highlight) => (
                      <span
                        key={highlight}
                        className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-champagne"
                      >
                        {highlight}
                        <button
                          type="button"
                          onClick={() => removeHighlight(highlight)}
                          className="text-champagne/70 hover:text-champagne"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Usage Instructions */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                    Usage Instructions
                  </label>
                  <textarea
                    rows={3}
                    className="w-full rounded-2xl border border-border-default bg-bg-elevated px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                    placeholder="How to use this product"
                    {...register('usage')}
                  />
                </div>

                {/* SEO Fields */}
                <div className="space-y-4 rounded-2xl border border-border-default bg-bg-secondary p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-text-primary">
                    SEO & Metadata (Optional)
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Optimize product for search engines and social media sharing
                  </p>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Slug */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                        URL Slug
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-2xl border border-border-default bg-bg-elevated px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                        placeholder="auto-generated-from-name"
                        {...register('slug')}
                      />
                      <p className="mt-1 text-xs text-text-tertiary">Leave empty to auto-generate</p>
                    </div>

                    {/* Meta Title */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                        Meta Title
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-2xl border border-border-default bg-bg-elevated px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                        placeholder="Custom title for search engines"
                        {...register('metaTitle')}
                      />
                    </div>
                  </div>

                  {/* Meta Description */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                      Meta Description
                    </label>
                    <textarea
                      rows={2}
                      className="w-full rounded-2xl border border-border-default bg-bg-elevated px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                      placeholder="Description shown in search results"
                      {...register('metaDescription')}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* OG Image URL */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                        Social Share Image URL
                      </label>
                      <input
                        type="url"
                        className="w-full rounded-2xl border border-border-default bg-bg-elevated px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                        placeholder="https://example.com/image.jpg"
                        {...register('ogImageUrl')}
                      />
                      <p className="mt-1 text-xs text-text-tertiary">Uses product image if empty</p>
                    </div>

                    {/* Canonical URL */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                        Canonical URL
                      </label>
                      <input
                        type="url"
                        className="w-full rounded-2xl border border-border-default bg-bg-elevated px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                        placeholder="https://example.com/products/slug"
                        {...register('canonicalUrl')}
                      />
                      <p className="mt-1 text-xs text-text-tertiary">Auto-generated if empty</p>
                    </div>
                  </div>
                </div>

                {/* Custom Attributes */}
                {attributes.length > 0 && (
                  <div className="space-y-4 rounded-2xl border border-border-default bg-bg-secondary p-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-text-primary">
                      Custom Attributes
                    </h3>
                    <p className="text-xs text-text-secondary">
                      Additional product properties for filtering and categorization
                    </p>

                    <div className="grid gap-4 md:grid-cols-2">
                      {attributes.map((attr) => (
                        <div key={attr.id}>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                            {attr.attributeLabel} {attr.isRequired && '*'}
                          </label>

                          {/* Text input */}
                          {attr.dataType === 'text' && (
                            <input
                              type="text"
                              value={customAttributes[attr.attributeKey] || ''}
                              onChange={(e) => setValue('customAttributes', { ...customAttributes, [attr.attributeKey]: e.target.value }, { shouldDirty: true })}
                              className="w-full rounded-2xl border border-border-default bg-bg-elevated px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                            />
                          )}

                          {/* Number input */}
                          {attr.dataType === 'number' && (
                            <input
                              type="number"
                              value={customAttributes[attr.attributeKey] || ''}
                              onChange={(e) => setValue('customAttributes', { ...customAttributes, [attr.attributeKey]: parseFloat(e.target.value) || '' }, { shouldDirty: true })}
                              className="w-full rounded-2xl border border-border-default bg-bg-elevated px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                            />
                          )}

                          {/* Boolean checkbox */}
                          {attr.dataType === 'boolean' && (
                            <label className="flex cursor-pointer items-center gap-2">
                              <input
                                type="checkbox"
                                checked={customAttributes[attr.attributeKey] || false}
                                onChange={(e) => setValue('customAttributes', { ...customAttributes, [attr.attributeKey]: e.target.checked }, { shouldDirty: true })}
                                className="h-4 w-4 rounded border-border-default bg-bg-elevated text-primary focus:ring-primary/20"
                              />
                              <span className="text-sm text-text-primary">Enable</span>
                            </label>
                          )}

                          {/* Select dropdown */}
                          {attr.dataType === 'select' && attr.options && (
                            <select
                              value={customAttributes[attr.attributeKey] || ''}
                              onChange={(e) => setValue('customAttributes', { ...customAttributes, [attr.attributeKey]: e.target.value }, { shouldDirty: true })}
                              className="w-full rounded-2xl border border-border-default bg-bg-elevated px-4 py-3 text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                            >
                              <option value="">Select {attr.attributeLabel}</option>
                              {attr.options.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          )}

                          {/* Multiselect */}
                          {attr.dataType === 'multiselect' && attr.options && (
                            <div className="space-y-2">
                              {attr.options.map((opt) => (
                                <label key={opt.value} className="flex cursor-pointer items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={(customAttributes[attr.attributeKey] || []).includes(opt.value)}
                                    onChange={(e) => {
                                      const currentValues = customAttributes[attr.attributeKey] || [];
                                      const newValues = e.target.checked
                                        ? [...currentValues, opt.value]
                                        : currentValues.filter((v: string) => v !== opt.value);
                                      setValue('customAttributes', { ...customAttributes, [attr.attributeKey]: newValues }, { shouldDirty: true });
                                    }}
                                    className="h-4 w-4 rounded border-border-default bg-bg-elevated text-primary focus:ring-primary/20"
                                  />
                                  <span className="text-sm text-text-primary">{opt.label}</span>
                                </label>
                              ))}
                            </div>
                          )}

                          {/* Date input */}
                          {attr.dataType === 'date' && (
                            <input
                              type="date"
                              value={customAttributes[attr.attributeKey] || ''}
                              onChange={(e) => setValue('customAttributes', { ...customAttributes, [attr.attributeKey]: e.target.value }, { shouldDirty: true })}
                              className="w-full rounded-2xl border border-border-default bg-bg-elevated px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Flags */}
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex items-center gap-3 rounded-2xl border border-border-default bg-bg-secondary p-4 cursor-pointer transition-colors hover:bg-bg-elevated">
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-border-default bg-bg-elevated text-primary focus:ring-2 focus:ring-primary/20"
                      {...register('isNew')}
                    />
                    <div>
                      <p className="font-semibold text-text-primary">Mark as New Arrival</p>
                      <p className="text-xs text-text-secondary">Show "NEW" badge on storefront</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl border border-border-default bg-bg-secondary p-4 cursor-pointer transition-colors hover:bg-bg-elevated">
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-border-default bg-bg-elevated text-primary focus:ring-2 focus:ring-primary/20"
                      {...register('isFeatured')}
                    />
                    <div>
                      <p className="font-semibold text-text-primary">Mark as Best Seller</p>
                      <p className="text-xs text-text-secondary">Feature in Best Sellers section</p>
                    </div>
                  </label>
                </div>

                {/* Form Actions */}
                <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-full border border-border-default px-6 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending || categories.length === 0}
                    className="rounded-full bg-interactive-default px-6 py-3 text-sm font-semibold text-on-interactive transition-colors hover:bg-interactive-hover disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? 'Saving...'
                      : editingProduct
                      ? 'Update Product'
                      : 'Create Product'}
                  </button>
                </div>

                {/* Error Messages */}
                {(createMutation.isError || updateMutation.isError) && (
                  <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">
                    Failed to save product. Please check all fields and try again.
                  </div>
                )}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Variant Manager Modal */}
      <AnimatePresence>
        {variantProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/90 backdrop-blur-sm p-4"
            onClick={() => setVariantProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-bg-elevated border border-border-default p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl text-text-primary">
                    Product Variants
                  </h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    Manage variants for {variantProduct.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setVariantProduct(null)}
                  className="rounded-full p-2 text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <VariantManager
                productId={variantProduct.id}
                productName={variantProduct.name}
                baseProduct={{
                  price: variantProduct.price,
                  salePrice: variantProduct.salePrice,
                  inventory: variantProduct.inventory,
                  imageUrl: variantProduct.imageUrl
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminProducts;
