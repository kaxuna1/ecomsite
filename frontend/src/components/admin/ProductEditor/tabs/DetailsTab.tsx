import { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  XMarkIcon,
  ChevronDownIcon,
  InformationCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import AIDescriptionGenerator from '../../AIDescriptionGenerator';
import SEOGenerator from '../../SEOGenerator';
import Toast, { ToastType } from '../../../Toast';
import type { ProductForm } from '../../../../pages/admin/ProductEditor';
import type { AttributeDefinition } from '../../../../api/attributes';
import type { GenerateDescriptionResponse, GenerateSEOResponse } from '../../../../api/ai';

interface DetailsTabProps {
  form: UseFormReturn<ProductForm>;
  attributes: AttributeDefinition[];
}

// Helper function to generate slug from product name
const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
};

export default function DetailsTab({ form, attributes }: DetailsTabProps) {
  const { register, formState: { errors }, watch, setValue } = form;

  const [categoryInput, setCategoryInput] = useState('');
  const [highlightInput, setHighlightInput] = useState('');
  const [metaKeywordInput, setMetaKeywordInput] = useState('');
  const [showSEO, setShowSEO] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showSEOGenerator, setShowSEOGenerator] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const [showToast, setShowToast] = useState(false);

  const categories = watch('categories') || [];
  const highlights = watch('highlights') || [];
  const customAttributes = watch('customAttributes') || {};
  const productName = watch('name') || '';
  const shortDescription = watch('shortDescription') || '';
  const description = watch('description') || '';
  const metaTitle = watch('metaTitle') || '';
  const metaDescription = watch('metaDescription') || '';
  const metaKeywords = watch('metaKeywords') || [];
  const slug = watch('slug') || '';
  const price = watch('price');
  const salePrice = watch('salePrice');

  // Auto-generate slug from product name
  useEffect(() => {
    if (productName && !slug) {
      setValue('slug', generateSlug(productName), { shouldDirty: true });
    }
  }, [productName, slug, setValue]);

  const addCategory = () => {
    if (categoryInput.trim() && !categories.includes(categoryInput.trim())) {
      setValue('categories', [...categories, categoryInput.trim()], { shouldDirty: true });
      setCategoryInput('');
    }
  };

  const removeCategory = (category: string) => {
    setValue('categories', categories.filter((c) => c !== category), { shouldDirty: true });
  };

  const addHighlight = () => {
    if (highlightInput.trim() && !highlights.includes(highlightInput.trim())) {
      setValue('highlights', [...highlights, highlightInput.trim()], { shouldDirty: true });
      setHighlightInput('');
    }
  };

  const removeHighlight = (highlight: string) => {
    setValue('highlights', highlights.filter((h) => h !== highlight), { shouldDirty: true });
  };

  const addMetaKeyword = () => {
    if (metaKeywordInput.trim() && !metaKeywords.includes(metaKeywordInput.trim())) {
      setValue('metaKeywords', [...metaKeywords, metaKeywordInput.trim()], { shouldDirty: true });
      setMetaKeywordInput('');
    }
  };

  const removeMetaKeyword = (keyword: string) => {
    setValue('metaKeywords', metaKeywords.filter((k) => k !== keyword), { shouldDirty: true });
  };

  const handleAIApply = (generated: GenerateDescriptionResponse) => {
    // Apply generated content to form
    setValue('description', generated.description, { shouldDirty: true });
    setValue('highlights', generated.highlights, { shouldDirty: true });
    if (generated.usage) {
      setValue('usage', generated.usage, { shouldDirty: true });
    }
    if (generated.metaDescription) {
      setValue('metaDescription', generated.metaDescription, { shouldDirty: true });
    }

    // Show success toast
    setToastMessage('AI-generated content applied successfully!');
    setToastType('success');
    setShowToast(true);
    setShowAIGenerator(false);
  };

  const showToastNotification = (message: string, type: ToastType = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleSEOApply = (seo: GenerateSEOResponse) => {
    // Apply SEO content to form
    setValue('metaTitle', seo.metaTitle, { shouldDirty: true });
    setValue('metaDescription', seo.metaDescription, { shouldDirty: true });

    // Add focus keyword and secondary keywords
    const allKeywords = [seo.focusKeyword, ...seo.secondaryKeywords];
    const uniqueKeywords = [...new Set([...metaKeywords, ...allKeywords])];
    setValue('metaKeywords', uniqueKeywords, { shouldDirty: true });

    // Close modal
    setShowSEOGenerator(false);

    // Expand SEO section if collapsed
    if (!showSEO) {
      setShowSEO(true);
    }

    // Show success toast
    showToastNotification('SEO meta tags generated and applied successfully!', 'success');
  };

  // Character counter helper
  const CharCounter = ({ current, max, warn = 0.8 }: { current: number; max: number; warn?: number }) => {
    const isWarning = current > max * warn;
    const isOver = current > max;
    return (
      <span className={`text-xs ${isOver ? 'text-rose-400' : isWarning ? 'text-yellow-400' : 'text-text-tertiary'}`}>
        {current}/{max}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Basic Information */}
      <section className="rounded-2xl border border-border-default bg-bg-elevated p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-primary">
          Basic Information
        </h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="product-name"
                className="text-xs font-semibold uppercase tracking-wider text-text-secondary"
              >
                Product Name *
              </label>
              <CharCounter current={productName.length} max={100} />
            </div>
            <input
              id="product-name"
              maxLength={100}
              className="w-full rounded-full border border-border-default bg-bg-elevated px-4 py-3 text-text-primary placeholder:text-text-tertiary transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="e.g., Luxia Repair Serum"
              aria-required="true"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : "name-hint"}
              {...register('name', {
                required: 'Product name is required',
                maxLength: { value: 100, message: 'Name must be 100 characters or less' }
              })}
            />
            {!errors.name && (
              <p id="name-hint" className="mt-1 text-xs text-text-tertiary">
                Clear, descriptive name for your product
              </p>
            )}
            {errors.name && (
              <div id="name-error" className="mt-2 flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2">
                <InformationCircleIcon className="h-4 w-4 text-rose-400" />
                <p className="text-xs text-rose-400">{errors.name.message}</p>
              </div>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="inventory"
                className="text-xs font-semibold uppercase tracking-wider text-text-secondary"
              >
                Inventory Count *
              </label>
            </div>
            <input
              id="inventory"
              type="number"
              min={0}
              className="w-full rounded-full border border-border-default bg-bg-elevated px-4 py-3 text-text-primary placeholder:text-text-tertiary transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="0"
              aria-required="true"
              aria-invalid={!!errors.inventory}
              aria-describedby={errors.inventory ? "inventory-error" : "inventory-hint"}
              {...register('inventory', {
                required: 'Inventory count is required',
                valueAsNumber: true,
                min: { value: 0, message: 'Inventory cannot be negative' }
              })}
            />
            {!errors.inventory && (
              <p id="inventory-hint" className="mt-1 text-xs text-text-tertiary">
                Available stock quantity
              </p>
            )}
            {errors.inventory && (
              <div id="inventory-error" className="mt-2 flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2">
                <InformationCircleIcon className="h-4 w-4 text-rose-400" />
                <p className="text-xs text-rose-400">{errors.inventory.message}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="short-description"
              className="text-xs font-semibold uppercase tracking-wider text-champagne/60"
            >
              Short Description *
            </label>
            <CharCounter current={shortDescription.length} max={150} />
          </div>
          <input
            id="short-description"
            maxLength={150}
                  className="w-full rounded-full border border-border-default bg-bg-elevated px-4 py-3 text-text-primary placeholder:text-text-tertiary transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Brief one-line description for product listings"
            aria-required="true"
            aria-invalid={!!errors.shortDescription}
            aria-describedby={errors.shortDescription ? "short-desc-error" : "short-desc-hint"}
            {...register('shortDescription', {
              required: 'Short description is required',
              maxLength: { value: 150, message: 'Short description must be 150 characters or less' }
            })}
          />
          {!errors.shortDescription && (
            <p id="short-desc-hint" className="mt-1 text-xs text-text-tertiary">
              This appears in product listings and search results
            </p>
          )}
          {errors.shortDescription && (
            <div id="short-desc-error" className="mt-2 flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2">
              <InformationCircleIcon className="h-4 w-4 text-rose-400" />
              <p className="text-xs text-rose-400">{errors.shortDescription.message}</p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="description"
              className="text-xs font-semibold uppercase tracking-wider text-champagne/60"
            >
              Full Description *
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowAIGenerator(true)}
                disabled={!productName.trim()}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                <SparklesIcon className="h-4 w-4" />
                Generate with AI
              </button>
              <CharCounter current={description.length} max={2000} />
            </div>
          </div>
          <textarea
            id="description"
            rows={5}
            maxLength={2000}
            className="w-full rounded-2xl border border-border-default bg-bg-elevated px-4 py-3 text-text-primary placeholder:text-text-tertiary transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Detailed product description with benefits, features, and usage information"
            aria-required="true"
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? "desc-error" : "desc-hint"}
            {...register('description', {
              required: 'Description is required',
              maxLength: { value: 2000, message: 'Description must be 2000 characters or less' }
            })}
          />
          {!errors.description && (
            <p id="desc-hint" className="mt-1 text-xs text-text-tertiary">
              Comprehensive product information shown on the product page
            </p>
          )}
          {errors.description && (
            <div id="desc-error" className="mt-2 flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2">
              <InformationCircleIcon className="h-4 w-4 text-rose-400" />
              <p className="text-xs text-rose-400">{errors.description.message}</p>
            </div>
          )}
        </div>
      </section>

      {/* Pricing */}
      <section className="rounded-2xl border border-border-default bg-bg-elevated p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-primary">
          Pricing
        </h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="regular-price"
              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-champagne/60"
            >
              Regular Price (USD) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
              <input
                id="regular-price"
                type="number"
                step="0.01"
                min={0}
                className="w-full rounded-full border border-border-default bg-bg-elevated pl-8 pr-4 py-3 text-text-primary placeholder:text-text-tertiary transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="0.00"
                aria-required="true"
                aria-invalid={!!errors.price}
                aria-describedby={errors.price ? "price-error" : "price-hint"}
                {...register('price', {
                  required: 'Price is required',
                  valueAsNumber: true,
                  min: { value: 0.01, message: 'Price must be greater than $0' }
                })}
              />
            </div>
            {!errors.price && (
              <p id="price-hint" className="mt-1 text-xs text-text-tertiary">
                Base price before any discounts
              </p>
            )}
            {errors.price && (
              <div id="price-error" className="mt-2 flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2">
                <InformationCircleIcon className="h-4 w-4 text-rose-400" />
                <p className="text-xs text-rose-400">{errors.price.message}</p>
              </div>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="sale-price"
                className="text-xs font-semibold uppercase tracking-wider text-text-secondary"
              >
                Sale Price (USD)
              </label>
              {salePrice && price && salePrice < price && (
                <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs font-semibold text-green-400">
                  {Math.round(((price - salePrice) / price) * 100)}% OFF
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
              <input
                id="sale-price"
                type="number"
                step="0.01"
                min={0}
                className="w-full rounded-full border border-border-default bg-bg-elevated pl-8 pr-4 py-3 text-text-primary placeholder:text-text-tertiary transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Optional discount price"
                aria-invalid={!!errors.salePrice}
                aria-describedby={errors.salePrice ? "sale-price-error" : "sale-price-hint"}
                {...register('salePrice', {
                  valueAsNumber: true,
                  validate: {
                    lessThanPrice: (value) => {
                      if (!value) return true;
                      const regularPrice = watch('price');
                      return !regularPrice || value < regularPrice || 'Sale price must be less than regular price';
                    },
                    positive: (value) => {
                      if (!value) return true;
                      return value > 0 || 'Sale price must be greater than $0';
                    }
                  }
                })}
              />
            </div>
            {!errors.salePrice && salePrice && price && salePrice >= price && (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-yellow-500/10 px-3 py-2">
                <InformationCircleIcon className="h-4 w-4 text-yellow-400" />
                <p className="text-xs text-yellow-400">Sale price should be less than regular price</p>
              </div>
            )}
            {!errors.salePrice && !salePrice && (
              <p id="sale-price-hint" className="mt-1 text-xs text-text-tertiary">
                Leave empty if product is not on sale
              </p>
            )}
            {errors.salePrice && (
              <div id="sale-price-error" className="mt-2 flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2">
                <InformationCircleIcon className="h-4 w-4 text-rose-400" />
                <p className="text-xs text-rose-400">{errors.salePrice.message}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="rounded-2xl border border-border-default bg-bg-elevated p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-primary">
          Categories *
        </h3>
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
            className="rounded-full bg-interactive-default px-4 py-2 text-sm font-semibold text-on-interactive transition-colors hover:bg-interactive-hover"
          >
            Add
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((category) => (
            <span
              key={category}
              className="flex items-center gap-2 rounded-full bg-bg-secondary px-3 py-1 text-sm text-text-primary"
            >
              {category}
              <button
                type="button"
                onClick={() => removeCategory(category)}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </span>
          ))}
        </div>
        {categories.length === 0 && <p className="mt-2 text-xs text-rose-400">At least one category is required</p>}
      </section>

      {/* Highlights */}
      <section className="rounded-2xl border border-border-default bg-bg-elevated p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-primary">
          Product Highlights
        </h3>
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
            className="rounded-full bg-interactive-default px-4 py-2 text-sm font-semibold text-on-interactive transition-colors hover:bg-interactive-hover"
          >
            Add
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {highlights.map((highlight) => (
            <span
              key={highlight}
              className="flex items-center gap-2 rounded-full bg-bg-secondary px-3 py-1 text-sm text-text-primary"
            >
              {highlight}
              <button
                type="button"
                onClick={() => removeHighlight(highlight)}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </span>
          ))}
        </div>
      </section>

      {/* Usage Instructions */}
      <section className="rounded-2xl border border-border-default bg-bg-elevated p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-primary">
          Usage Instructions
        </h3>
        <textarea
          rows={3}
          className="w-full rounded-2xl border border-border-default bg-bg-elevated px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
          placeholder="How to use this product"
          {...register('usage')}
        />
      </section>

      {/* Product Flags */}
      <section className="rounded-2xl border border-border-default bg-bg-elevated p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-primary">
          Product Flags
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              {...register('isNew')}
              className="h-5 w-5 rounded border-border-default bg-bg-elevated text-primary focus:ring-2 focus:ring-primary/20"
            />
            <div>
              <span className="text-sm font-semibold text-text-primary">Mark as New</span>
              <p className="text-xs text-text-secondary">Show "New Arrival" badge on product</p>
            </div>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              {...register('isFeatured')}
              className="h-5 w-5 rounded border-border-default bg-bg-elevated text-primary focus:ring-2 focus:ring-primary/20"
            />
            <div>
              <span className="text-sm font-semibold text-text-primary">Mark as Featured</span>
              <p className="text-xs text-text-secondary">Highlight product in featured sections</p>
            </div>
          </label>
        </div>
      </section>

      {/* SEO & Meta Data */}
      <section className="rounded-2xl border border-border-default bg-bg-elevated p-6">
        <div className="flex items-start justify-between gap-4">
          <button
            type="button"
            onClick={() => setShowSEO(!showSEO)}
            className="flex flex-1 items-center justify-between transition-colors hover:text-primary"
          >
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-primary">
                SEO & Meta Data
              </h3>
              <p className="mt-1 text-xs text-text-secondary">
                Optimize your product for search engines and social media
              </p>
            </div>
            <ChevronDownIcon
              className={`h-5 w-5 text-text-primary transition-transform ${showSEO ? 'rotate-180' : ''}`}
            />
          </button>

          {/* AI Generate Button */}
          <button
            type="button"
            onClick={() => setShowSEOGenerator(true)}
            disabled={!productName}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            title={!productName ? 'Enter product name first' : 'Generate SEO with AI'}
          >
            <SparklesIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Generate SEO</span>
          </button>
        </div>

        {showSEO && (
          <div className="mt-6 space-y-6">
            {/* URL Slug */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="slug"
                  className="text-xs font-semibold uppercase tracking-wider text-text-secondary"
                >
                  URL Slug
                </label>
                {slug && (
                  <span className="text-xs text-text-tertiary">
                    /products/{slug}
                  </span>
                )}
              </div>
              <input
                id="slug"
                className="w-full rounded-full border border-border-default bg-bg-elevated px-4 py-3 text-text-primary placeholder:text-text-tertiary transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="auto-generated-from-product-name"
                aria-describedby="slug-hint"
                {...register('slug')}
              />
              <p id="slug-hint" className="mt-1 text-xs text-text-tertiary">
                Auto-generated from product name. Edit for custom URLs.
              </p>
            </div>

            {/* Meta Title */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="meta-title"
                  className="text-xs font-semibold uppercase tracking-wider text-text-secondary"
                >
                  Meta Title
                </label>
                <CharCounter current={metaTitle.length} max={60} warn={50/60} />
              </div>
              <input
                id="meta-title"
                maxLength={60}
                className="w-full rounded-full border border-border-default bg-bg-elevated px-4 py-3 text-text-primary placeholder:text-text-tertiary transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Leave empty to use product name"
                aria-describedby="meta-title-hint"
                {...register('metaTitle', {
                  maxLength: { value: 60, message: 'Meta title should be 60 characters or less' }
                })}
              />
              <p id="meta-title-hint" className="mt-1 text-xs text-text-tertiary">
                Optimal: 50-60 characters. Appears in search engine results.
              </p>
            </div>

            {/* Meta Description */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="meta-description"
                  className="text-xs font-semibold uppercase tracking-wider text-text-secondary"
                >
                  Meta Description
                </label>
                <CharCounter current={metaDescription.length} max={160} warn={150/160} />
              </div>
              <textarea
                id="meta-description"
                rows={3}
                maxLength={160}
                className="w-full rounded-2xl border border-border-default bg-bg-elevated px-4 py-3 text-text-primary placeholder:text-text-tertiary transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Compelling description for search results"
                aria-describedby="meta-desc-hint"
                {...register('metaDescription', {
                  maxLength: { value: 160, message: 'Meta description should be 160 characters or less' }
                })}
              />
              <p id="meta-desc-hint" className="mt-1 text-xs text-text-tertiary">
                Optimal: 150-160 characters. Appears below title in search results.
              </p>
            </div>

            {/* Meta Keywords */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-champagne/60">
                Meta Keywords
              </label>
              <div className="flex gap-2">
                <input
                  value={metaKeywordInput}
                  onChange={(e) => setMetaKeywordInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMetaKeyword())}
                  className="flex-1 rounded-full border border-border-default bg-bg-elevated px-4 py-2 text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Add a keyword"
                />
                <button
                  type="button"
                  onClick={addMetaKeyword}
                  className="rounded-full bg-interactive-default px-4 py-2 text-sm font-semibold text-on-interactive transition-colors hover:bg-interactive-hover"
                >
                  Add
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {metaKeywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="flex items-center gap-2 rounded-full bg-bg-secondary px-3 py-1 text-sm text-text-primary"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeMetaKeyword(keyword)}
                      className="text-text-secondary hover:text-text-primary transition-colors"
                      aria-label={`Remove keyword ${keyword}`}
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
              <p className="mt-1 text-xs text-text-tertiary">
                Relevant search terms for this product
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* OG Image URL */}
              <div>
                <label
                  htmlFor="og-image"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wider text-champagne/60"
                >
                  Social Media Image URL
                </label>
                <input
                  id="og-image"
                  type="url"
                  className="w-full rounded-full border border-border-default bg-bg-elevated px-4 py-3 text-text-primary placeholder:text-text-tertiary transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="https://example.com/image.jpg"
                  aria-describedby="og-image-hint"
                  {...register('ogImageUrl')}
                />
                <p id="og-image-hint" className="mt-1 text-xs text-text-tertiary">
                  Image shown when shared on social media
                </p>
              </div>

              {/* Canonical URL */}
              <div>
                <label
                  htmlFor="canonical-url"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wider text-champagne/60"
                >
                  Canonical URL
                </label>
                <input
                  id="canonical-url"
                  type="url"
                  className="w-full rounded-full border border-border-default bg-bg-elevated px-4 py-3 text-text-primary placeholder:text-text-tertiary transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="https://example.com/product"
                  aria-describedby="canonical-hint"
                  {...register('canonicalUrl')}
                />
                <p id="canonical-hint" className="mt-1 text-xs text-text-tertiary">
                  Preferred URL for duplicate content
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Custom Attributes */}
      {attributes.length > 0 && (
        <section className="rounded-2xl border border-border-default bg-bg-elevated p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-primary">
            Custom Attributes
          </h3>
          <p className="mb-6 text-xs text-text-secondary">
            Additional product properties for filtering and categorization
          </p>

          <div className="grid gap-6 md:grid-cols-2">
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
                    className="w-full rounded-full border border-border-default bg-bg-elevated px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                  />
                )}

                {/* Number input */}
                {attr.dataType === 'number' && (
                  <input
                    type="number"
                    value={customAttributes[attr.attributeKey] || ''}
                    onChange={(e) => setValue('customAttributes', { ...customAttributes, [attr.attributeKey]: parseFloat(e.target.value) || '' }, { shouldDirty: true })}
                    className="w-full rounded-full border border-border-default bg-bg-elevated px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                  />
                )}

                {/* Boolean checkbox */}
                {attr.dataType === 'boolean' && (
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={customAttributes[attr.attributeKey] || false}
                      onChange={(e) => setValue('customAttributes', { ...customAttributes, [attr.attributeKey]: e.target.checked }, { shouldDirty: true })}
                      className="h-5 w-5 rounded border-border-default bg-bg-elevated text-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="text-sm text-text-primary">Enable</span>
                  </label>
                )}

                {/* Select dropdown */}
                {attr.dataType === 'select' && attr.options && (
                  <select
                    value={customAttributes[attr.attributeKey] || ''}
                    onChange={(e) => setValue('customAttributes', { ...customAttributes, [attr.attributeKey]: e.target.value }, { shouldDirty: true })}
                    className="w-full rounded-full border border-border-default bg-bg-elevated px-4 py-3 text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
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
                          className="h-5 w-5 rounded border-border-default bg-bg-elevated text-primary focus:ring-2 focus:ring-primary/20"
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
                    className="w-full rounded-full border border-border-default bg-bg-elevated px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* AI Description Generator Modal */}
      <AIDescriptionGenerator
        productName={productName}
        shortDescription={shortDescription}
        categories={categories}
        currentDescription={description}
        currentHighlights={highlights}
        currentUsage={watch('usage')}
        currentMetaDescription={metaDescription}
        isOpen={showAIGenerator}
        onApply={handleAIApply}
        onClose={() => setShowAIGenerator(false)}
      />

      {/* SEO Generator Modal */}
      {showSEOGenerator && (
        <SEOGenerator
          productName={productName}
          shortDescription={shortDescription}
          description={description}
          categories={categories}
          onApply={handleSEOApply}
          onClose={() => setShowSEOGenerator(false)}
        />
      )}

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
