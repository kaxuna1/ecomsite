// Visual Editor for Text + Image Block
import { useState, useEffect } from 'react';
import FormField from './FormField';

interface TextImageContent {
  title: string;
  content: string;
  image?: string;
  imagePosition?: 'left' | 'right';
  imageAlt?: string;
}

interface TextImageBlockEditorProps {
  content: TextImageContent;
  onChange: (content: TextImageContent) => void;
}

export default function TextImageBlockEditor({ content, onChange }: TextImageBlockEditorProps) {
  const [formData, setFormData] = useState<TextImageContent>(content);

  useEffect(() => {
    setFormData(content);
  }, [content]);

  const handleChange = (field: keyof TextImageContent, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-white/10">
        <div className="p-2 bg-jade/20 rounded-lg">
          <svg className="h-6 w-6 text-jade" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="font-display text-lg text-champagne">Text + Image Block</h3>
          <p className="text-sm text-champagne/60">Combine text content with an image</p>
        </div>
      </div>

      <FormField label="Title" required>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="e.g., Our Mission"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
        />
      </FormField>

      <FormField label="Content" helpText="Use **text** for bold. Line breaks supported." required>
        <textarea
          value={formData.content}
          onChange={(e) => handleChange('content', e.target.value)}
          placeholder="Enter your content here. Use **text** to make it bold."
          rows={6}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors resize-none"
        />
      </FormField>

      <FormField label="Image URL" helpText="Optional image to display alongside text">
        <input
          type="url"
          value={formData.image || ''}
          onChange={(e) => handleChange('image', e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors font-mono text-sm"
        />
      </FormField>

      {formData.image && (
        <FormField label="Image Alt Text" helpText="Accessibility description">
          <input
            type="text"
            value={formData.imageAlt || ''}
            onChange={(e) => handleChange('imageAlt', e.target.value)}
            placeholder="e.g., Team working together"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
          />
        </FormField>
      )}

      <FormField label="Image Position">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleChange('imagePosition', 'left')}
            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
              formData.imagePosition === 'left'
                ? 'border-jade bg-jade/20 text-jade'
                : 'border-white/10 bg-white/5 text-champagne/70 hover:border-white/20'
            }`}
          >
            Left
          </button>
          <button
            type="button"
            onClick={() => handleChange('imagePosition', 'right')}
            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
              formData.imagePosition === 'right' || !formData.imagePosition
                ? 'border-jade bg-jade/20 text-jade'
                : 'border-white/10 bg-white/5 text-champagne/70 hover:border-white/20'
            }`}
          >
            Right
          </button>
        </div>
      </FormField>

      {formData.image && (
        <div className="p-4 bg-jade/5 border border-jade/20 rounded-xl">
          <p className="text-xs text-jade mb-2">Image Preview</p>
          <div className="relative rounded-lg overflow-hidden border border-white/10">
            <img
              src={formData.image}
              alt={formData.imageAlt || 'Preview'}
              className="w-full h-48 object-cover"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23374151" width="400" height="300"/%3E%3Ctext fill="%239CA3AF" font-family="sans-serif" font-size="18" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EImage not found%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
