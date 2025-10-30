// Enhanced Visual Editor for Newsletter Block with Templates and Customization
import { useState, useEffect } from 'react';
import FormField from './FormField';

interface NewsletterContent {
  title: string;
  description: string;
  buttonText: string;
  placeholderText?: string;
  template?: 'gradient' | 'minimal' | 'split' | 'card';
  style?: {
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    buttonColor?: string;
    buttonTextColor?: string;
    showIcon?: boolean;
    centerAlign?: boolean;
  };
}

interface NewsletterBlockEditorProps {
  content: NewsletterContent;
  onChange: (content: NewsletterContent) => void;
}

export default function NewsletterBlockEditor({ content, onChange }: NewsletterBlockEditorProps) {
  const [formData, setFormData] = useState<NewsletterContent>(content);

  useEffect(() => {
    setFormData(content);
  }, [content]);

  const handleChange = (field: keyof NewsletterContent, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
  };

  const handleStyleChange = (field: string, value: any) => {
    const updated = {
      ...formData,
      style: {
        ...formData.style,
        [field]: value
      }
    };
    setFormData(updated);
    onChange(updated);
  };

  // Template previews
  const templatePreviews = {
    gradient: {
      name: 'Gradient',
      description: 'Eye-catching gradient background',
      preview: 'bg-gradient-to-br from-jade via-jade/90 to-midnight'
    },
    minimal: {
      name: 'Minimal',
      description: 'Clean and simple design',
      preview: 'bg-champagne/10 border border-champagne/20'
    },
    split: {
      name: 'Split Layout',
      description: 'Icon on left, form on right',
      preview: 'bg-white border-2 border-jade/20'
    },
    card: {
      name: 'Card Style',
      description: 'Elevated card with shadow',
      preview: 'bg-white shadow-2xl'
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-white/10">
        <div className="p-2 bg-jade/20 rounded-lg">
          <svg className="h-6 w-6 text-jade" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="font-display text-lg text-champagne">Newsletter Block</h3>
          <p className="text-sm text-champagne/60">Email subscription form with templates</p>
        </div>
      </div>

      {/* Content Settings */}
      <FormField label="Title" required>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="e.g., Join Our Community"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
        />
      </FormField>

      <FormField label="Description" required>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="e.g., Subscribe to get exclusive offers and beauty tips"
          rows={3}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors resize-none"
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Button Text" required>
          <input
            type="text"
            value={formData.buttonText}
            onChange={(e) => handleChange('buttonText', e.target.value)}
            placeholder="e.g., Subscribe"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
          />
        </FormField>

        <FormField label="Input Placeholder">
          <input
            type="text"
            value={formData.placeholderText || ''}
            onChange={(e) => handleChange('placeholderText', e.target.value)}
            placeholder="e.g., Enter your email"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
          />
        </FormField>
      </div>

      {/* Template Selection */}
      <div className="pt-6 border-t border-white/10">
        <h4 className="font-semibold text-champagne mb-4">Template</h4>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(templatePreviews) as Array<keyof typeof templatePreviews>).map((template) => (
            <button
              key={template}
              type="button"
              onClick={() => handleChange('template', template)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                formData.template === template
                  ? 'border-jade bg-jade/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <div className={`h-20 rounded mb-2 ${templatePreviews[template].preview}`}></div>
              <h5 className="font-semibold text-champagne text-sm">{templatePreviews[template].name}</h5>
              <p className="text-xs text-champagne/60 mt-1">{templatePreviews[template].description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Style Customization */}
      <div className="pt-6 border-t border-white/10">
        <h4 className="font-semibold text-jade mb-4">Style Customization</h4>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <FormField label="Background Color">
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.style?.backgroundColor || '#10b981'}
                onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                className="h-10 w-20 rounded border border-white/10 bg-white/5 cursor-pointer"
              />
              <input
                type="text"
                value={formData.style?.backgroundColor || '#10b981'}
                onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                placeholder="#10b981"
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-champagne text-sm"
              />
            </div>
          </FormField>

          <FormField label="Text Color">
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.style?.textColor || '#ffffff'}
                onChange={(e) => handleStyleChange('textColor', e.target.value)}
                className="h-10 w-20 rounded border border-white/10 bg-white/5 cursor-pointer"
              />
              <input
                type="text"
                value={formData.style?.textColor || '#ffffff'}
                onChange={(e) => handleStyleChange('textColor', e.target.value)}
                placeholder="#ffffff"
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-champagne text-sm"
              />
            </div>
          </FormField>

          <FormField label="Button Color">
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.style?.buttonColor || '#ffffff'}
                onChange={(e) => handleStyleChange('buttonColor', e.target.value)}
                className="h-10 w-20 rounded border border-white/10 bg-white/5 cursor-pointer"
              />
              <input
                type="text"
                value={formData.style?.buttonColor || '#ffffff'}
                onChange={(e) => handleStyleChange('buttonColor', e.target.value)}
                placeholder="#ffffff"
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-champagne text-sm"
              />
            </div>
          </FormField>

          <FormField label="Button Text Color">
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.style?.buttonTextColor || '#10b981'}
                onChange={(e) => handleStyleChange('buttonTextColor', e.target.value)}
                className="h-10 w-20 rounded border border-white/10 bg-white/5 cursor-pointer"
              />
              <input
                type="text"
                value={formData.style?.buttonTextColor || '#10b981'}
                onChange={(e) => handleStyleChange('buttonTextColor', e.target.value)}
                placeholder="#10b981"
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-champagne text-sm"
              />
            </div>
          </FormField>
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-champagne/80 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.style?.showIcon !== false}
              onChange={(e) => handleStyleChange('showIcon', e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-jade focus:ring-jade"
            />
            <span className="text-sm">Show icon</span>
          </label>

          <label className="flex items-center gap-2 text-champagne/80 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.style?.centerAlign !== false}
              onChange={(e) => handleStyleChange('centerAlign', e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-jade focus:ring-jade"
            />
            <span className="text-sm">Center align</span>
          </label>
        </div>
      </div>

      {/* Preview */}
      <div className="p-4 bg-jade/10 border border-jade/30 rounded-lg space-y-2">
        <h4 className="font-semibold text-champagne text-sm">Preview</h4>
        <div className="p-6 bg-gradient-to-br from-jade/20 to-midnight/20 rounded-lg">
          <div className={formData.style?.centerAlign !== false ? 'text-center' : ''}>
            {formData.style?.showIcon !== false && (
              <svg className="h-12 w-12 text-jade mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
            <h3 className="font-display text-xl text-champagne">{formData.title || 'Your Title'}</h3>
            <p className="mt-2 text-sm text-champagne/70 max-w-2xl mx-auto">
              {formData.description || 'Your description'}
            </p>
            <div className="flex gap-2 mt-4 max-w-xl mx-auto">
              <input
                type="email"
                placeholder={formData.placeholderText || 'Enter your email'}
                disabled
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-sm text-champagne placeholder-champagne/50"
              />
              <button
                disabled
                className="px-6 py-3 bg-jade text-midnight rounded-lg text-sm font-semibold shadow-lg"
              >
                {formData.buttonText || 'Subscribe'}
              </button>
            </div>
            <p className="mt-3 text-xs text-champagne/60">
              By subscribing, you agree to our Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
