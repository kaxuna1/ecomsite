// Visual Editor for Hero Block
import { useState, useEffect } from 'react';
import FormField from './FormField';

interface HeroContent {
  headline: string;
  subheadline: string;
  description?: string;
  ctaText: string;
  ctaLink: string;
  textAlignment?: 'left' | 'center' | 'right';
}

interface HeroBlockEditorProps {
  content: HeroContent;
  onChange: (content: HeroContent) => void;
}

export default function HeroBlockEditor({ content, onChange }: HeroBlockEditorProps) {
  const [formData, setFormData] = useState<HeroContent>(content);

  useEffect(() => {
    setFormData(content);
  }, [content]);

  const handleChange = (field: keyof HeroContent, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-white/10">
        <div className="p-2 bg-jade/20 rounded-lg">
          <svg className="h-6 w-6 text-jade" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="font-display text-lg text-champagne">Hero Block</h3>
          <p className="text-sm text-champagne/60">Main banner with headline and call-to-action</p>
        </div>
      </div>

      <FormField label="Headline" required>
        <input
          type="text"
          value={formData.headline}
          onChange={(e) => handleChange('headline', e.target.value)}
          placeholder="e.g., Transform Your Beauty Routine"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
        />
      </FormField>

      <FormField label="Subheadline" required>
        <input
          type="text"
          value={formData.subheadline}
          onChange={(e) => handleChange('subheadline', e.target.value)}
          placeholder="e.g., Discover luxury hair care that delivers results"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
        />
      </FormField>

      <FormField label="Description" helpText="Optional additional text">
        <textarea
          value={formData.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Add more detail about your offering..."
          rows={3}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors resize-none"
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="CTA Button Text" required>
          <input
            type="text"
            value={formData.ctaText}
            onChange={(e) => handleChange('ctaText', e.target.value)}
            placeholder="e.g., Shop Now"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
          />
        </FormField>

        <FormField label="CTA Link" required>
          <input
            type="text"
            value={formData.ctaLink}
            onChange={(e) => handleChange('ctaLink', e.target.value)}
            placeholder="/products"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
          />
        </FormField>
      </div>

      <FormField label="Text Alignment">
        <div className="flex gap-2">
          {(['left', 'center', 'right'] as const).map((alignment) => (
            <button
              key={alignment}
              type="button"
              onClick={() => handleChange('textAlignment', alignment)}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all capitalize ${
                formData.textAlignment === alignment
                  ? 'bg-jade text-midnight'
                  : 'bg-white/5 text-champagne hover:bg-white/10'
              }`}
            >
              {alignment}
            </button>
          ))}
        </div>
      </FormField>
    </div>
  );
}
