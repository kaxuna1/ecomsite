// Visual Editor for Newsletter Block
import { useState, useEffect } from 'react';
import FormField from './FormField';

interface NewsletterContent {
  title: string;
  description: string;
  buttonText: string;
  placeholderText?: string;
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
          <p className="text-sm text-champagne/60">Email subscription form</p>
        </div>
      </div>

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

      <FormField label="Button Text" required>
        <input
          type="text"
          value={formData.buttonText}
          onChange={(e) => handleChange('buttonText', e.target.value)}
          placeholder="e.g., Subscribe"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
        />
      </FormField>

      <FormField label="Input Placeholder Text" helpText="Text shown in email input field">
        <input
          type="text"
          value={formData.placeholderText || ''}
          onChange={(e) => handleChange('placeholderText', e.target.value)}
          placeholder="e.g., Enter your email"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
        />
      </FormField>

      <div className="p-4 bg-jade/10 border border-jade/30 rounded-lg space-y-2">
        <h4 className="font-semibold text-champagne text-sm">Preview</h4>
        <div className="p-6 bg-gradient-to-br from-jade/20 to-midnight/20 rounded-lg">
          <div className="text-center">
            <h3 className="font-display text-xl text-champagne">{formData.title || 'Your Title'}</h3>
            <p className="mt-2 text-sm text-champagne/70">{formData.description || 'Your description'}</p>
            <div className="flex gap-2 mt-4">
              <input
                type="email"
                placeholder={formData.placeholderText || 'Enter your email'}
                disabled
                className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-champagne placeholder-champagne/50"
              />
              <button
                disabled
                className="px-6 py-2 bg-jade text-midnight rounded-lg text-sm font-semibold"
              >
                {formData.buttonText || 'Subscribe'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
