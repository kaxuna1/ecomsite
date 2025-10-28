// Visual Editor for Products Block
import { useState, useEffect } from 'react';
import FormField from './FormField';

interface ProductsContent {
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
}

interface ProductsBlockEditorProps {
  content: ProductsContent;
  onChange: (content: ProductsContent) => void;
}

export default function ProductsBlockEditor({ content, onChange }: ProductsBlockEditorProps) {
  const [formData, setFormData] = useState<ProductsContent>(content);

  useEffect(() => {
    setFormData(content);
  }, [content]);

  const handleChange = (field: keyof ProductsContent, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-white/10">
        <div className="p-2 bg-jade/20 rounded-lg">
          <svg className="h-6 w-6 text-jade" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <div>
          <h3 className="font-display text-lg text-champagne">Products Block</h3>
          <p className="text-sm text-champagne/60">Showcase featured products from your catalog</p>
        </div>
      </div>

      <div className="p-4 bg-jade/10 border border-jade/30 rounded-lg">
        <p className="text-sm text-champagne/80">
          This block automatically displays the first 4 products from your catalog. Products are managed in the Products section.
        </p>
      </div>

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

      <div className="grid grid-cols-2 gap-4">
        <FormField label="CTA Button Text">
          <input
            type="text"
            value={formData.ctaText || ''}
            onChange={(e) => handleChange('ctaText', e.target.value)}
            placeholder="e.g., View All Products"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
          />
        </FormField>

        <FormField label="CTA Link">
          <input
            type="text"
            value={formData.ctaLink || ''}
            onChange={(e) => handleChange('ctaLink', e.target.value)}
            placeholder="/products"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
          />
        </FormField>
      </div>
    </div>
  );
}
