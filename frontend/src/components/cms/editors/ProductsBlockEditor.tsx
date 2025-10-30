// Visual Editor for Products Block - Enhanced with Advanced Configuration
import { useState, useEffect } from 'react';
import FormField from './FormField';

interface ProductShowcaseContent {
  type: 'products';
  title: string;
  subtitle?: string;

  // Selection Method
  selectionMethod: 'manual' | 'category' | 'rules' | 'featured' | 'recent' | 'recommended';
  productIds?: number[];
  categoryFilter?: string[];
  attributeFilters?: { [key: string]: string[] };
  sourceProductId?: number;

  // Rules-based selection
  rules?: {
    showNewArrivals?: boolean;
    showBestsellers?: boolean;
    showOnSale?: boolean;
    showFeatured?: boolean;
    showLowStock?: boolean;
    excludeOutOfStock?: boolean;
    minRating?: number;
    minReviews?: number;
  };

  // Display options
  displayStyle: 'grid' | 'carousel' | 'list' | 'masonry' | 'featured';
  columns?: 2 | 3 | 4 | 5 | 6;
  maxProducts?: number;

  // Product card elements
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

  // Sorting
  sortBy?: 'default' | 'price_asc' | 'price_desc' | 'date_desc' | 'date_asc' | 'popularity' | 'rating' | 'name_asc' | 'name_desc';

  // CTA
  ctaText?: string;
  ctaLink?: string;
  showCta?: boolean;

  // Styling
  style?: {
    cardStyle?: 'elevated' | 'flat' | 'outlined' | 'minimal';
    imageAspectRatio?: '1:1' | '4:5' | '3:4' | '16:9';
    hoverEffect?: 'zoom' | 'lift' | 'fade' | 'slide' | 'none';
    gap?: 'none' | 'small' | 'medium' | 'large';
    borderRadius?: 'none' | 'small' | 'medium' | 'large' | 'full';
  };

  // Carousel settings
  carouselSettings?: {
    autoPlay?: boolean;
    autoPlayInterval?: number;
    loop?: boolean;
    showArrows?: boolean;
    showDots?: boolean;
    slidesPerView?: number;
  };
}

interface ProductsBlockEditorProps {
  content: ProductShowcaseContent;
  onChange: (content: ProductShowcaseContent) => void;
}

export default function ProductsBlockEditor({ content, onChange }: ProductsBlockEditorProps) {
  const [formData, setFormData] = useState<ProductShowcaseContent>({
    type: 'products',
    title: content.title || 'Featured Products',
    subtitle: content.subtitle,
    selectionMethod: content.selectionMethod || 'featured',
    displayStyle: content.displayStyle || 'grid',
    columns: content.columns || 4,
    maxProducts: content.maxProducts || 8,
    sortBy: content.sortBy || 'default',
    showCta: content.showCta ?? false,
    ctaText: content.ctaText,
    ctaLink: content.ctaLink,
    productIds: content.productIds || [],
    categoryFilter: content.categoryFilter || [],
    attributeFilters: content.attributeFilters || {},
    rules: content.rules || {
      showNewArrivals: false,
      showBestsellers: false,
      showOnSale: false,
      showFeatured: true,
      showLowStock: false,
      excludeOutOfStock: true
    },
    showElements: content.showElements || {
      image: true,
      title: true,
      shortDescription: true,
      price: true,
      comparePrice: true,
      addToCart: true,
      quickView: false,
      wishlist: false,
      rating: false,
      reviewCount: false,
      categories: false,
      badges: true,
      stock: false
    },
    style: content.style || {
      cardStyle: 'elevated',
      imageAspectRatio: '1:1',
      hoverEffect: 'lift',
      gap: 'medium',
      borderRadius: 'medium'
    },
    carouselSettings: content.carouselSettings || {
      autoPlay: false,
      autoPlayInterval: 5000,
      loop: true,
      showArrows: true,
      showDots: true,
      slidesPerView: 4
    }
  });

  const [activeTab, setActiveTab] = useState<'selection' | 'display' | 'elements' | 'style'>('selection');

  useEffect(() => {
    setFormData({
      ...formData,
      ...content,
      rules: { ...formData.rules, ...content.rules },
      showElements: { ...formData.showElements, ...content.showElements },
      style: { ...formData.style, ...content.style },
      carouselSettings: { ...formData.carouselSettings, ...content.carouselSettings }
    });
  }, [content]);

  const handleChange = (field: keyof ProductShowcaseContent, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
  };

  const handleNestedChange = (parent: 'rules' | 'showElements' | 'style' | 'carouselSettings', field: string, value: any) => {
    const updated = {
      ...formData,
      [parent]: {
        ...formData[parent],
        [field]: value
      }
    };
    setFormData(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-white/10">
        <div className="p-2 bg-jade/20 rounded-lg">
          <svg className="h-6 w-6 text-jade" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <div>
          <h3 className="font-display text-lg text-champagne">Products Widget</h3>
          <p className="text-sm text-champagne/60">Advanced product showcase with multiple selection methods</p>
        </div>
      </div>

      {/* Basic Fields */}
      <div className="space-y-4">
        <FormField label="Section Title" required>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="e.g., Best Sellers"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
          />
        </FormField>

        <FormField label="Subtitle" helpText="Optional description">
          <input
            type="text"
            value={formData.subtitle || ''}
            onChange={(e) => handleChange('subtitle', e.target.value)}
            placeholder="Add a subtitle..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
          />
        </FormField>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        {(['selection', 'display', 'elements', 'style'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-jade border-b-2 border-jade'
                : 'text-champagne/60 hover:text-champagne'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Selection Tab */}
      {activeTab === 'selection' && (
        <div className="space-y-6">
          <FormField label="Selection Method" required>
            <select
              value={formData.selectionMethod}
              onChange={(e) => handleChange('selectionMethod', e.target.value as any)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade transition-colors"
            >
              <option value="featured">Featured Products</option>
              <option value="recent">Recent Products</option>
              <option value="rules">Rules-Based Selection</option>
              <option value="category">By Category</option>
              <option value="manual">Manual Selection</option>
              <option value="recommended">Recommended Products</option>
            </select>
          </FormField>

          {/* Rules-Based Configuration */}
          {formData.selectionMethod === 'rules' && (
            <div className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-3">
              <h4 className="text-sm font-medium text-champagne mb-3">Product Selection Rules</h4>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.rules?.showNewArrivals || false}
                    onChange={(e) => handleNestedChange('rules', 'showNewArrivals', e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-jade focus:ring-jade focus:ring-offset-0"
                  />
                  <span className="text-sm text-champagne">New Arrivals</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.rules?.showBestsellers || false}
                    onChange={(e) => handleNestedChange('rules', 'showBestsellers', e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-jade focus:ring-jade focus:ring-offset-0"
                  />
                  <span className="text-sm text-champagne">Bestsellers</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.rules?.showOnSale || false}
                    onChange={(e) => handleNestedChange('rules', 'showOnSale', e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-jade focus:ring-jade focus:ring-offset-0"
                  />
                  <span className="text-sm text-champagne">On Sale</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.rules?.showFeatured || false}
                    onChange={(e) => handleNestedChange('rules', 'showFeatured', e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-jade focus:ring-jade focus:ring-offset-0"
                  />
                  <span className="text-sm text-champagne">Featured</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.rules?.showLowStock || false}
                    onChange={(e) => handleNestedChange('rules', 'showLowStock', e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-jade focus:ring-jade focus:ring-offset-0"
                  />
                  <span className="text-sm text-champagne">Low Stock</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.rules?.excludeOutOfStock || false}
                    onChange={(e) => handleNestedChange('rules', 'excludeOutOfStock', e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-jade focus:ring-jade focus:ring-offset-0"
                  />
                  <span className="text-sm text-champagne">Exclude Out of Stock</span>
                </label>
              </div>
            </div>
          )}

          {/* Category Selection */}
          {formData.selectionMethod === 'category' && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-sm text-champagne/80">
                Category selection will be available once categories are fetched from the API.
                For now, products will be selected based on the first available category.
              </p>
            </div>
          )}

          {/* Manual Selection */}
          {formData.selectionMethod === 'manual' && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-sm text-champagne/80">
                Manual product selection UI will be implemented in the next phase.
                This will include a searchable product picker with multi-select.
              </p>
            </div>
          )}

          <FormField label="Maximum Products" helpText="Number of products to display">
            <input
              type="number"
              min="1"
              max="50"
              value={formData.maxProducts || 8}
              onChange={(e) => handleChange('maxProducts', parseInt(e.target.value) || 8)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade transition-colors"
            />
          </FormField>

          <FormField label="Sort By">
            <select
              value={formData.sortBy || 'default'}
              onChange={(e) => handleChange('sortBy', e.target.value as any)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade transition-colors"
            >
              <option value="default">Default (Featured First)</option>
              <option value="popularity">Popularity</option>
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A-Z</option>
              <option value="name_desc">Name: Z-A</option>
            </select>
          </FormField>
        </div>
      )}

      {/* Display Tab */}
      {activeTab === 'display' && (
        <div className="space-y-6">
          <FormField label="Display Style" required>
            <div className="grid grid-cols-2 gap-3">
              {(['grid', 'carousel', 'list', 'masonry'] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => handleChange('displayStyle', style)}
                  className={`px-4 py-3 rounded-lg border-2 transition-all capitalize ${
                    formData.displayStyle === style
                      ? 'border-jade bg-jade/10 text-jade'
                      : 'border-white/10 bg-white/5 text-champagne/60 hover:border-white/20'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </FormField>

          {formData.displayStyle === 'grid' && (
            <FormField label="Columns" helpText="Number of columns in grid layout">
              <select
                value={formData.columns || 4}
                onChange={(e) => handleChange('columns', parseInt(e.target.value) as any)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade transition-colors"
              >
                <option value={2}>2 Columns</option>
                <option value={3}>3 Columns</option>
                <option value={4}>4 Columns</option>
                <option value={5}>5 Columns</option>
                <option value={6}>6 Columns</option>
              </select>
            </FormField>
          )}

          {formData.displayStyle === 'carousel' && (
            <div className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-4">
              <h4 className="text-sm font-medium text-champagne">Carousel Settings</h4>

              <FormField label="Slides Per View">
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={formData.carouselSettings?.slidesPerView || 4}
                  onChange={(e) => handleNestedChange('carouselSettings', 'slidesPerView', parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade transition-colors"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.carouselSettings?.autoPlay || false}
                    onChange={(e) => handleNestedChange('carouselSettings', 'autoPlay', e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-jade focus:ring-jade focus:ring-offset-0"
                  />
                  <span className="text-sm text-champagne">Auto Play</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.carouselSettings?.loop || false}
                    onChange={(e) => handleNestedChange('carouselSettings', 'loop', e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-jade focus:ring-jade focus:ring-offset-0"
                  />
                  <span className="text-sm text-champagne">Loop</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.carouselSettings?.showArrows || false}
                    onChange={(e) => handleNestedChange('carouselSettings', 'showArrows', e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-jade focus:ring-jade focus:ring-offset-0"
                  />
                  <span className="text-sm text-champagne">Show Arrows</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.carouselSettings?.showDots || false}
                    onChange={(e) => handleNestedChange('carouselSettings', 'showDots', e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-jade focus:ring-jade focus:ring-offset-0"
                  />
                  <span className="text-sm text-champagne">Show Dots</span>
                </label>
              </div>

              {formData.carouselSettings?.autoPlay && (
                <FormField label="Auto Play Interval (ms)">
                  <input
                    type="number"
                    min="1000"
                    max="10000"
                    step="1000"
                    value={formData.carouselSettings?.autoPlayInterval || 5000}
                    onChange={(e) => handleNestedChange('carouselSettings', 'autoPlayInterval', parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade transition-colors"
                  />
                </FormField>
              )}
            </div>
          )}

          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showCta || false}
                onChange={(e) => handleChange('showCta', e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-jade focus:ring-jade focus:ring-offset-0"
              />
              <span className="text-sm text-champagne">Show Call-to-Action Button</span>
            </label>

            {formData.showCta && (
              <div className="grid grid-cols-2 gap-4 ml-6">
                <FormField label="Button Text">
                  <input
                    type="text"
                    value={formData.ctaText || ''}
                    onChange={(e) => handleChange('ctaText', e.target.value)}
                    placeholder="View All Products"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
                  />
                </FormField>
                <FormField label="Button Link">
                  <input
                    type="text"
                    value={formData.ctaLink || ''}
                    onChange={(e) => handleChange('ctaLink', e.target.value)}
                    placeholder="/products"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
                  />
                </FormField>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Elements Tab */}
      {activeTab === 'elements' && (
        <div className="space-y-4">
          <p className="text-sm text-champagne/60">Choose which elements to display on product cards</p>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(formData.showElements || {}).map(([key, value]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value || false}
                  onChange={(e) => handleNestedChange('showElements', key, e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-jade focus:ring-jade focus:ring-offset-0"
                />
                <span className="text-sm text-champagne capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Style Tab */}
      {activeTab === 'style' && (
        <div className="space-y-6">
          <FormField label="Card Style">
            <select
              value={formData.style?.cardStyle || 'elevated'}
              onChange={(e) => handleNestedChange('style', 'cardStyle', e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade transition-colors"
            >
              <option value="elevated">Elevated (Shadow)</option>
              <option value="flat">Flat</option>
              <option value="outlined">Outlined</option>
              <option value="minimal">Minimal</option>
            </select>
          </FormField>

          <FormField label="Image Aspect Ratio">
            <select
              value={formData.style?.imageAspectRatio || '1:1'}
              onChange={(e) => handleNestedChange('style', 'imageAspectRatio', e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade transition-colors"
            >
              <option value="1:1">Square (1:1)</option>
              <option value="4:5">Portrait (4:5)</option>
              <option value="3:4">Portrait (3:4)</option>
              <option value="16:9">Landscape (16:9)</option>
            </select>
          </FormField>

          <FormField label="Hover Effect">
            <select
              value={formData.style?.hoverEffect || 'lift'}
              onChange={(e) => handleNestedChange('style', 'hoverEffect', e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade transition-colors"
            >
              <option value="zoom">Zoom</option>
              <option value="lift">Lift (Elevate)</option>
              <option value="fade">Fade</option>
              <option value="slide">Slide</option>
              <option value="none">None</option>
            </select>
          </FormField>

          <FormField label="Gap Between Cards">
            <select
              value={formData.style?.gap || 'medium'}
              onChange={(e) => handleNestedChange('style', 'gap', e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade transition-colors"
            >
              <option value="none">None</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </FormField>

          <FormField label="Border Radius">
            <select
              value={formData.style?.borderRadius || 'medium'}
              onChange={(e) => handleNestedChange('style', 'borderRadius', e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade transition-colors"
            >
              <option value="none">None (Sharp)</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="full">Full (Rounded)</option>
            </select>
          </FormField>
        </div>
      )}

      {/* Preview Info */}
      <div className="p-4 bg-jade/10 border border-jade/30 rounded-lg">
        <p className="text-sm text-champagne/80">
          <strong>Configuration Summary:</strong> Displaying {formData.maxProducts} products using{' '}
          <strong>{formData.selectionMethod}</strong> selection in a <strong>{formData.displayStyle}</strong> layout
          {formData.displayStyle === 'grid' && ` with ${formData.columns} columns`}.
        </p>
      </div>
    </div>
  );
}
