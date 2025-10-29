import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  PhotoIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  ArrowDownTrayIcon,
  CubeIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import { createProduct, deleteProduct, fetchAllProducts, updateProduct } from '../../api/products';
import { getAllAttributes } from '../../api/attributes';
import type { Product } from '../../types/product';
import LoadingState from '../../components/admin/LoadingState';
import EmptyState from '../../components/admin/EmptyState';
import SearchInput from '../../components/admin/SearchInput';
import Badge from '../../components/admin/Badge';
import Button from '../../components/admin/Button';
import Dropdown, { type DropdownItem } from '../../components/admin/Dropdown';
import DataTable, { type Column } from '../../components/admin/DataTable';
import VariantManager from '../../components/admin/VariantManager';

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

  const createMutation = useMutation({
    mutationFn: (data: FormData) => createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      closeModal();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }: { id: number; formData: FormData }) => updateProduct(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      closeModal();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] })
  });

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
    setEditingProduct(null);
    setImagePreview(null);
    reset({
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
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setImagePreview(product.imageUrl);
    reset({
      name: product.name,
      shortDescription: product.shortDescription,
      description: product.description,
      price: product.price,
      salePrice: product.salePrice || undefined,
      inventory: product.inventory,
      categories: product.categories,
      highlights: product.highlights || [],
      usage: product.usage || '',
      isNew: product.isNew || false,
      isFeatured: product.isFeatured || false,
      customAttributes: product.customAttributes || {}
    });
    setIsModalOpen(true);
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

  const columns: Column<Product>[] = [
    {
      key: 'name',
      label: 'Product',
      sortable: true,
      render: (product) => (
        <div className="flex items-center gap-4">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-12 w-12 rounded-lg object-cover"
          />
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-champagne">{product.name}</p>
              {product.isNew && <Badge variant="success" size="sm">NEW</Badge>}
              {product.isFeatured && <Badge variant="info" size="sm">FEATURED</Badge>}
            </div>
            <p className="text-sm text-champagne/60">{product.shortDescription}</p>
            <p className="text-xs text-champagne/40">{product.categories.join(' • ')}</p>
          </div>
        </div>
      )
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (product) => (
        <div className="text-champagne">
          {product.salePrice ? (
            <div>
              <p className="font-semibold text-rose-400">${product.salePrice.toFixed(2)}</p>
              <p className="text-xs text-champagne/40 line-through">${product.price.toFixed(2)}</p>
            </div>
          ) : (
            <p className="font-semibold">${product.price.toFixed(2)}</p>
          )}
        </div>
      )
    },
    {
      key: 'inventory',
      label: 'Stock',
      sortable: true,
      render: (product) => (
        <p className="text-champagne">{product.inventory} units</p>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: false,
      render: (product) => {
        const status = getStockStatus(product.inventory);
        return <Badge variant={status.variant}>{status.label}</Badge>;
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      align: 'right',
      render: (product) => {
        const dropdownItems: DropdownItem[] = [
          {
            label: 'Edit',
            icon: <PencilIcon />,
            onClick: () => openEditModal(product)
          },
          {
            label: 'Manage Variants',
            icon: <Squares2X2Icon />,
            onClick: () => setVariantProduct(product)
          },
          {
            label: 'Delete',
            icon: <TrashIcon />,
            onClick: () => handleDelete(product.id, product.name),
            danger: true
          }
        ];

        return (
          <Dropdown
            trigger={
              <button
                type="button"
                className="rounded-full p-2 text-champagne/70 transition-colors hover:bg-white/10 hover:text-champagne"
              >
                <EllipsisVerticalIcon className="h-5 w-5" />
              </button>
            }
            items={dropdownItems}
          />
        );
      }
    }
  ];

  if (isLoading) {
    return <LoadingState message="Loading products..." />;
  }

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Manage Products — Luxia Admin</title>
      </Helmet>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-champagne">Product Management</h1>
          <p className="mt-1 text-sm text-champagne/70">
            {filteredAndSortedProducts.length} of {products.length} products
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="md"
            icon={<ArrowDownTrayIcon />}
            onClick={() => {
              // Export functionality placeholder
              alert('Export functionality coming soon!');
            }}
          >
            Export
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={<PlusIcon />}
            onClick={openCreateModal}
          >
            Add Product
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Search */}
        <div className="lg:col-span-2">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder="Search products by name, description, or category..."
          />
        </div>

        {/* Filter */}
        <div className="relative">
          <FunnelIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-champagne/40" />
          <select
            value={filterOption}
            onChange={(e) => setFilterOption(e.target.value as FilterOption)}
            className="w-full appearance-none rounded-full border border-white/20 bg-midnight px-12 py-3 text-champagne focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
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
      </div>

      {/* Sort */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-champagne/70">Sort by:</span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="rounded-full border border-white/20 bg-midnight px-4 py-2 text-sm text-champagne focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
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

      {/* Products Table */}
      <DataTable
        columns={columns}
        data={filteredAndSortedProducts}
        keyExtractor={(product) => product.id.toString()}
        emptyState={
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
        }
        sortable={false}
      />

      {/* Product Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/90 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-midnight border border-white/10 p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-2xl text-champagne">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full p-2 text-champagne/70 transition-colors hover:bg-white/10 hover:text-champagne"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Image Upload */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-champagne/60 mb-3">
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
                    <label className="flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-white/5 px-6 py-8 transition-colors hover:border-blush hover:bg-white/10">
                      <PhotoIcon className="h-12 w-12 text-champagne/40" />
                      <p className="mt-2 text-sm text-champagne/70">Click to upload image</p>
                      <p className="mt-1 text-xs text-champagne/40">PNG, JPG up to 10MB</p>
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
                    <label className="block text-xs font-semibold uppercase tracking-wider text-champagne/60 mb-2">
                      Product Name *
                    </label>
                    <input
                      className="w-full rounded-full border border-white/20 bg-white/5 px-4 py-3 text-champagne placeholder-champagne/40 focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                      placeholder="e.g., Luxia Repair Serum"
                      {...register('name', { required: 'Product name is required' })}
                    />
                    {errors.name && <p className="mt-1 text-xs text-rose-400">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-champagne/60 mb-2">
                      Inventory Count *
                    </label>
                    <input
                      type="number"
                      min={0}
                      className="w-full rounded-full border border-white/20 bg-white/5 px-4 py-3 text-champagne placeholder-champagne/40 focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                      placeholder="0"
                      {...register('inventory', { required: 'Inventory count is required', valueAsNumber: true, min: 0 })}
                    />
                    {errors.inventory && <p className="mt-1 text-xs text-rose-400">{errors.inventory.message}</p>}
                  </div>
                </div>

                {/* Pricing */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-champagne/60 mb-2">
                      Regular Price (USD) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      className="w-full rounded-full border border-white/20 bg-white/5 px-4 py-3 text-champagne placeholder-champagne/40 focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                      placeholder="0.00"
                      {...register('price', { required: 'Price is required', valueAsNumber: true, min: 0 })}
                    />
                    {errors.price && <p className="mt-1 text-xs text-rose-400">{errors.price.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-champagne/60 mb-2">
                      Sale Price (USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      className="w-full rounded-full border border-white/20 bg-white/5 px-4 py-3 text-champagne placeholder-champagne/40 focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                      placeholder="Leave empty for no sale"
                      {...register('salePrice', { valueAsNumber: true })}
                    />
                    {errors.salePrice && <p className="mt-1 text-xs text-rose-400">{errors.salePrice.message}</p>}
                  </div>
                </div>

                {/* Descriptions */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-champagne/60 mb-2">
                    Short Description *
                  </label>
                  <input
                    className="w-full rounded-full border border-white/20 bg-white/5 px-4 py-3 text-champagne placeholder-champagne/40 focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                    placeholder="Brief one-line description"
                    {...register('shortDescription', { required: 'Short description is required' })}
                  />
                  {errors.shortDescription && <p className="mt-1 text-xs text-rose-400">{errors.shortDescription.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-champagne/60 mb-2">
                    Full Description *
                  </label>
                  <textarea
                    rows={5}
                    className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-champagne placeholder-champagne/40 focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
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
                      className="flex-1 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-champagne placeholder-champagne/40 focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
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
                      className="flex-1 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-champagne placeholder-champagne/40 focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
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
                  <label className="block text-xs font-semibold uppercase tracking-wider text-champagne/60 mb-2">
                    Usage Instructions
                  </label>
                  <textarea
                    rows={3}
                    className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-champagne placeholder-champagne/40 focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                    placeholder="How to use this product"
                    {...register('usage')}
                  />
                </div>

                {/* SEO Fields */}
                <div className="space-y-4 rounded-2xl border border-champagne/20 bg-white/5 p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-champagne">
                    SEO & Metadata (Optional)
                  </h3>
                  <p className="text-xs text-champagne/60">
                    Optimize product for search engines and social media sharing
                  </p>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Slug */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-champagne/60 mb-2">
                        URL Slug
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-champagne placeholder-champagne/40 focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                        placeholder="auto-generated-from-name"
                        {...register('slug')}
                      />
                      <p className="mt-1 text-xs text-champagne/40">Leave empty to auto-generate</p>
                    </div>

                    {/* Meta Title */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-champagne/60 mb-2">
                        Meta Title
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-champagne placeholder-champagne/40 focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                        placeholder="Custom title for search engines"
                        {...register('metaTitle')}
                      />
                    </div>
                  </div>

                  {/* Meta Description */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-champagne/60 mb-2">
                      Meta Description
                    </label>
                    <textarea
                      rows={2}
                      className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-champagne placeholder-champagne/40 focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                      placeholder="Description shown in search results"
                      {...register('metaDescription')}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* OG Image URL */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-champagne/60 mb-2">
                        Social Share Image URL
                      </label>
                      <input
                        type="url"
                        className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-champagne placeholder-champagne/40 focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                        placeholder="https://example.com/image.jpg"
                        {...register('ogImageUrl')}
                      />
                      <p className="mt-1 text-xs text-champagne/40">Uses product image if empty</p>
                    </div>

                    {/* Canonical URL */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-champagne/60 mb-2">
                        Canonical URL
                      </label>
                      <input
                        type="url"
                        className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-champagne placeholder-champagne/40 focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                        placeholder="https://example.com/products/slug"
                        {...register('canonicalUrl')}
                      />
                      <p className="mt-1 text-xs text-champagne/40">Auto-generated if empty</p>
                    </div>
                  </div>
                </div>

                {/* Custom Attributes */}
                {attributes.length > 0 && (
                  <div className="space-y-4 rounded-2xl border border-champagne/20 bg-white/5 p-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-champagne">
                      Custom Attributes
                    </h3>
                    <p className="text-xs text-champagne/60">
                      Additional product properties for filtering and categorization
                    </p>

                    <div className="grid gap-4 md:grid-cols-2">
                      {attributes.map((attr) => (
                        <div key={attr.id}>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-champagne/60">
                            {attr.attributeLabel} {attr.isRequired && '*'}
                          </label>

                          {/* Text input */}
                          {attr.dataType === 'text' && (
                            <input
                              type="text"
                              value={customAttributes[attr.attributeKey] || ''}
                              onChange={(e) => setValue('customAttributes', { ...customAttributes, [attr.attributeKey]: e.target.value }, { shouldDirty: true })}
                              className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-champagne placeholder-champagne/40 focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                            />
                          )}

                          {/* Number input */}
                          {attr.dataType === 'number' && (
                            <input
                              type="number"
                              value={customAttributes[attr.attributeKey] || ''}
                              onChange={(e) => setValue('customAttributes', { ...customAttributes, [attr.attributeKey]: parseFloat(e.target.value) || '' }, { shouldDirty: true })}
                              className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-champagne placeholder-champagne/40 focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                            />
                          )}

                          {/* Boolean checkbox */}
                          {attr.dataType === 'boolean' && (
                            <label className="flex cursor-pointer items-center gap-2">
                              <input
                                type="checkbox"
                                checked={customAttributes[attr.attributeKey] || false}
                                onChange={(e) => setValue('customAttributes', { ...customAttributes, [attr.attributeKey]: e.target.checked }, { shouldDirty: true })}
                                className="h-4 w-4 rounded border-white/20 bg-white/5 text-blush focus:ring-blush"
                              />
                              <span className="text-sm text-champagne/80">Enable</span>
                            </label>
                          )}

                          {/* Select dropdown */}
                          {attr.dataType === 'select' && attr.options && (
                            <select
                              value={customAttributes[attr.attributeKey] || ''}
                              onChange={(e) => setValue('customAttributes', { ...customAttributes, [attr.attributeKey]: e.target.value }, { shouldDirty: true })}
                              className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-champagne focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
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
                                    className="h-4 w-4 rounded border-white/20 bg-white/5 text-blush focus:ring-blush"
                                  />
                                  <span className="text-sm text-champagne/80">{opt.label}</span>
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
                              className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-champagne placeholder-champagne/40 focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Flags */}
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/5 p-4 cursor-pointer transition-colors hover:bg-white/10">
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-white/20 bg-midnight text-blush focus:ring-2 focus:ring-blush/20"
                      {...register('isNew')}
                    />
                    <div>
                      <p className="font-semibold text-champagne">Mark as New Arrival</p>
                      <p className="text-xs text-champagne/60">Show "NEW" badge on storefront</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/5 p-4 cursor-pointer transition-colors hover:bg-white/10">
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-white/20 bg-midnight text-blush focus:ring-2 focus:ring-blush/20"
                      {...register('isFeatured')}
                    />
                    <div>
                      <p className="font-semibold text-champagne">Mark as Best Seller</p>
                      <p className="text-xs text-champagne/60">Feature in Best Sellers section</p>
                    </div>
                  </label>
                </div>

                {/* Form Actions */}
                <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-champagne transition-colors hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending || categories.length === 0}
                    className="rounded-full bg-blush px-6 py-3 text-sm font-semibold text-midnight transition-colors hover:bg-champagne disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/90 p-4"
            onClick={() => setVariantProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-midnight border border-white/10 p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl text-champagne">
                    Product Variants
                  </h2>
                  <p className="mt-1 text-sm text-champagne/70">
                    Manage variants for {variantProduct.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setVariantProduct(null)}
                  className="rounded-full p-2 text-champagne/70 transition-colors hover:bg-white/10 hover:text-champagne"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <VariantManager
                productId={variantProduct.id}
                productName={variantProduct.name}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminProducts;
