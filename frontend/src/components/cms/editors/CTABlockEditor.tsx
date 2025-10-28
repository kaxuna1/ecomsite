// Visual Editor for CTA (Call-to-Action) Block
import { useState, useEffect } from 'react';
import FormField from './FormField';

interface CTAContent {
  title: string;
  description?: string;
  primaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  backgroundImage?: string;
  backgroundImageAlt?: string;
}

interface CTABlockEditorProps {
  content: CTAContent;
  onChange: (content: CTAContent) => void;
}

export default function CTABlockEditor({ content, onChange }: CTABlockEditorProps) {
  const [formData, setFormData] = useState<CTAContent>(content);

  useEffect(() => {
    setFormData(content);
  }, [content]);

  const handleChange = (field: keyof CTAContent, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-white/10">
        <div className="p-2 bg-jade/20 rounded-lg">
          <svg className="h-6 w-6 text-jade" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h3 className="font-display text-lg text-champagne">CTA Block</h3>
          <p className="text-sm text-champagne/60">Powerful call-to-action section</p>
        </div>
      </div>

      <FormField label="Title" required>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="e.g., Ready to Get Started?"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
        />
      </FormField>

      <FormField label="Description" helpText="Optional supporting text">
        <textarea
          value={formData.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Add a compelling description"
          rows={3}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors resize-none"
        />
      </FormField>

      {/* Primary Button */}
      <div className="space-y-4 p-4 bg-jade/5 border border-jade/20 rounded-xl">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-jade" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
          <h4 className="font-semibold text-jade">Primary Button</h4>
        </div>

        <FormField label="Button Text">
          <input
            type="text"
            value={formData.primaryButtonText || ''}
            onChange={(e) => handleChange('primaryButtonText', e.target.value)}
            placeholder="e.g., Shop Now"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
          />
        </FormField>

        <FormField label="Button Link">
          <input
            type="text"
            value={formData.primaryButtonLink || ''}
            onChange={(e) => handleChange('primaryButtonLink', e.target.value)}
            placeholder="e.g., /products"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors font-mono text-sm"
          />
        </FormField>
      </div>

      {/* Secondary Button */}
      <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-xl">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-champagne/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <h4 className="font-semibold text-champagne/70">Secondary Button (Optional)</h4>
        </div>

        <FormField label="Button Text" helpText="Leave empty to hide">
          <input
            type="text"
            value={formData.secondaryButtonText || ''}
            onChange={(e) => handleChange('secondaryButtonText', e.target.value)}
            placeholder="e.g., Learn More"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
          />
        </FormField>

        <FormField label="Button Link">
          <input
            type="text"
            value={formData.secondaryButtonLink || ''}
            onChange={(e) => handleChange('secondaryButtonLink', e.target.value)}
            placeholder="e.g., /about"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors font-mono text-sm"
          />
        </FormField>
      </div>

      {/* Background Image */}
      <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-xl">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-champagne/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h4 className="font-semibold text-champagne/70">Background Image (Optional)</h4>
        </div>

        <FormField label="Image URL" helpText="Optional background image">
          <input
            type="url"
            value={formData.backgroundImage || ''}
            onChange={(e) => handleChange('backgroundImage', e.target.value)}
            placeholder="https://example.com/background.jpg"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors font-mono text-sm"
          />
        </FormField>

        {formData.backgroundImage && (
          <>
            <FormField label="Image Alt Text" helpText="Accessibility description">
              <input
                type="text"
                value={formData.backgroundImageAlt || ''}
                onChange={(e) => handleChange('backgroundImageAlt', e.target.value)}
                placeholder="e.g., CTA background"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
              />
            </FormField>

            <div className="p-4 bg-jade/5 border border-jade/20 rounded-xl">
              <p className="text-xs text-jade mb-2">Image Preview</p>
              <div className="relative rounded-lg overflow-hidden border border-white/10">
                <img
                  src={formData.backgroundImage}
                  alt={formData.backgroundImageAlt || 'Preview'}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23374151" width="400" height="300"/%3E%3Ctext fill="%239CA3AF" font-family="sans-serif" font-size="18" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EImage not found%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
