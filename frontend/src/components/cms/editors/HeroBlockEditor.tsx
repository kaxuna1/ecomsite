// Visual Editor for Hero Block
import { useState, useEffect } from 'react';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import FormField from './FormField';
import ColorPicker, { ColorSchemePicker } from './ColorPicker';

interface HeroContent {
  headline: string;
  subheadline: string;
  description?: string;
  ctaText: string;
  ctaLink: string;
  textAlignment?: 'left' | 'center' | 'right';
  template?: string;
  style?: {
    backgroundColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    textColor?: string;
    headlineSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    minHeight?: 'auto' | 'screen' | '75vh' | '50vh';
    enableAnimations?: boolean;
  };
}

const HERO_TEMPLATES = [
  {
    id: 'split-screen',
    name: 'Split Screen',
    description: 'Classic two-column layout with image on right',
    preview: '🎭',
    bestFor: 'E-commerce, Product launches'
  },
  {
    id: 'centered-minimal',
    name: 'Centered Minimal',
    description: 'Apple-style centered content, clean and elegant',
    preview: '⭐',
    bestFor: 'Premium brands, Minimalist design'
  },
  {
    id: 'full-width-overlay',
    name: 'Full-Width Overlay',
    description: 'Dramatic full-screen background with overlay text',
    preview: '🎬',
    bestFor: 'Luxury brands, Fashion, Lifestyle'
  },
  {
    id: 'asymmetric-bold',
    name: 'Asymmetric Bold',
    description: 'Modern magazine-style with bold typography',
    preview: '📰',
    bestFor: 'Editorial, Creative brands'
  },
  {
    id: 'luxury-minimal',
    name: 'Luxury Minimal',
    description: 'Sophisticated high-end brand aesthetic',
    preview: '💎',
    bestFor: 'High-end products, Jewelry, Cosmetics'
  },
  {
    id: 'gradient-modern',
    name: 'Gradient Modern',
    description: 'Futuristic with animated gradients',
    preview: '🌈',
    bestFor: 'Tech, Innovation, Science'
  }
];

interface HeroBlockEditorProps {
  content: HeroContent;
  onChange: (content: HeroContent) => void;
}

export default function HeroBlockEditor({ content, onChange }: HeroBlockEditorProps) {
  const [formData, setFormData] = useState<HeroContent>(content);
  const [showStyleControls, setShowStyleControls] = useState(false);

  useEffect(() => {
    setFormData(content);
  }, [content]);

  const handleChange = (field: keyof HeroContent, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
  };

  const handleStyleChange = (styleField: string, value: any) => {
    const updated = {
      ...formData,
      style: {
        ...formData.style,
        [styleField]: value
      }
    };
    setFormData(updated);
    onChange(updated);
  };

  const handleColorScheme = (colors: { primary: string; secondary: string; accent: string; text: string }) => {
    const updated = {
      ...formData,
      style: {
        ...formData.style,
        backgroundColor: colors.primary,
        secondaryColor: colors.secondary,
        accentColor: colors.accent,
        textColor: colors.text
      }
    };
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

      {/* Template Selector */}
      <div className="space-y-3">
        <FormField label="Choose Template" helpText="Select a hero section style">
          <div className="grid grid-cols-2 gap-3">
            {HERO_TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => handleChange('template', template.id)}
                className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                  formData.template === template.id || (!formData.template && template.id === 'split-screen')
                    ? 'border-jade bg-jade/10 shadow-lg'
                    : 'border-white/10 bg-white/5 hover:border-jade/50 hover:bg-white/10'
                }`}
              >
                {(formData.template === template.id || (!formData.template && template.id === 'split-screen')) && (
                  <div className="absolute top-2 right-2 p-1 bg-jade rounded-full">
                    <CheckIcon className="h-3 w-3 text-midnight" />
                  </div>
                )}
                <div className="text-3xl mb-2">{template.preview}</div>
                <h4 className="font-semibold text-champagne text-sm">{template.name}</h4>
                <p className="text-xs text-champagne/60 mt-1">{template.description}</p>
                <div className="mt-2 px-2 py-1 bg-jade/20 text-jade rounded text-xs">
                  {template.bestFor}
                </div>
              </button>
            ))}
          </div>
        </FormField>
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

      {/* Advanced Style Controls */}
      <div className="border-t border-white/10 pt-6">
        <button
          type="button"
          onClick={() => setShowStyleControls(!showStyleControls)}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-jade/10 to-champagne/10 border border-jade/20 rounded-xl hover:border-jade/40 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-jade/20 rounded-lg group-hover:bg-jade/30 transition-colors">
              <svg className="h-5 w-5 text-jade" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <div className="text-left">
              <h4 className="font-display text-champagne text-lg">Advanced Styling</h4>
              <p className="text-xs text-champagne/60">Customize colors, spacing, and typography</p>
            </div>
          </div>
          {showStyleControls ? (
            <ChevronUpIcon className="h-5 w-5 text-jade" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-jade" />
          )}
        </button>

        {showStyleControls && (
          <div className="mt-4 space-y-6 p-6 bg-white/5 rounded-xl border border-white/10">
            {/* Color Scheme Presets */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-jade" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                <h5 className="text-sm font-semibold text-champagne">Quick Color Schemes</h5>
              </div>
              <p className="text-xs text-champagne/60">Apply a preset color palette instantly</p>
              <ColorSchemePicker onSelect={handleColorScheme} />
            </div>

            {/* Individual Color Controls */}
            <div className="grid grid-cols-2 gap-4">
              <ColorPicker
                label="Background Color"
                value={formData.style?.backgroundColor || '#1a1d24'}
                onChange={(color) => handleStyleChange('backgroundColor', color)}
              />
              <ColorPicker
                label="Text Color"
                value={formData.style?.textColor || '#ffffff'}
                onChange={(color) => handleStyleChange('textColor', color)}
              />
              <ColorPicker
                label="Accent Color"
                value={formData.style?.accentColor || '#8bba9c'}
                onChange={(color) => handleStyleChange('accentColor', color)}
              />
              <ColorPicker
                label="Secondary Color"
                value={formData.style?.secondaryColor || '#e8c7c8'}
                onChange={(color) => handleStyleChange('secondaryColor', color)}
              />
            </div>

            {/* Typography Controls */}
            <div className="space-y-3">
              <FormField label="Headline Size">
                <div className="grid grid-cols-5 gap-2">
                  {(['sm', 'md', 'lg', 'xl', '2xl'] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleStyleChange('headlineSize', size)}
                      className={`px-3 py-2 rounded-lg font-medium transition-all text-xs uppercase ${
                        (formData.style?.headlineSize || 'lg') === size
                          ? 'bg-jade text-midnight'
                          : 'bg-white/5 text-champagne hover:bg-white/10'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </FormField>
            </div>

            {/* Spacing Controls */}
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Padding Top">
                <select
                  value={formData.style?.paddingTop || 'md'}
                  onChange={(e) => handleStyleChange('paddingTop', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade"
                >
                  <option value="none" className="bg-midnight">None</option>
                  <option value="sm" className="bg-midnight">Small</option>
                  <option value="md" className="bg-midnight">Medium</option>
                  <option value="lg" className="bg-midnight">Large</option>
                  <option value="xl" className="bg-midnight">Extra Large</option>
                </select>
              </FormField>

              <FormField label="Padding Bottom">
                <select
                  value={formData.style?.paddingBottom || 'md'}
                  onChange={(e) => handleStyleChange('paddingBottom', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade"
                >
                  <option value="none" className="bg-midnight">None</option>
                  <option value="sm" className="bg-midnight">Small</option>
                  <option value="md" className="bg-midnight">Medium</option>
                  <option value="lg" className="bg-midnight">Large</option>
                  <option value="xl" className="bg-midnight">Extra Large</option>
                </select>
              </FormField>
            </div>

            {/* Height Control */}
            <FormField label="Section Height">
              <div className="grid grid-cols-4 gap-2">
                {(['auto', '50vh', '75vh', 'screen'] as const).map((height) => (
                  <button
                    key={height}
                    type="button"
                    onClick={() => handleStyleChange('minHeight', height)}
                    className={`px-3 py-2 rounded-lg font-medium transition-all text-xs ${
                      (formData.style?.minHeight || 'auto') === height
                        ? 'bg-jade text-midnight'
                        : 'bg-white/5 text-champagne hover:bg-white/10'
                    }`}
                  >
                    {height === 'screen' ? 'Full' : height}
                  </button>
                ))}
              </div>
            </FormField>

            {/* Animation Toggle */}
            <FormField label="Enable Animations">
              <button
                type="button"
                onClick={() => handleStyleChange('enableAnimations', !formData.style?.enableAnimations)}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-all ${
                  formData.style?.enableAnimations !== false
                    ? 'bg-jade text-midnight'
                    : 'bg-white/5 text-champagne hover:bg-white/10'
                }`}
              >
                {formData.style?.enableAnimations !== false ? 'Animations On' : 'Animations Off'}
              </button>
            </FormField>
          </div>
        )}
      </div>
    </div>
  );
}
