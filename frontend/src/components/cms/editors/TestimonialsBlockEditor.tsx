// Visual Editor for Testimonials Block
import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, StarIcon as StarIconOutline } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import FormField from './FormField';

interface Testimonial {
  id: string;
  name: string;
  text: string;
  rating?: number;
  verified?: boolean;
}

interface TestimonialsContent {
  title: string;
  subtitle?: string;
  testimonials: Testimonial[];
}

interface TestimonialsBlockEditorProps {
  content: TestimonialsContent;
  onChange: (content: TestimonialsContent) => void;
}

export default function TestimonialsBlockEditor({ content, onChange }: TestimonialsBlockEditorProps) {
  const [formData, setFormData] = useState<TestimonialsContent>(content);

  useEffect(() => {
    setFormData(content);
  }, [content]);

  const handleChange = (field: keyof TestimonialsContent, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
  };

  const addTestimonial = () => {
    const newTestimonial: Testimonial = {
      id: `testimonial-${Date.now()}`,
      name: '',
      text: '',
      rating: 5,
      verified: true
    };
    handleChange('testimonials', [...formData.testimonials, newTestimonial]);
  };

  const updateTestimonial = (index: number, field: keyof Testimonial, value: any) => {
    const updated = [...formData.testimonials];
    updated[index] = { ...updated[index], [field]: value };
    handleChange('testimonials', updated);
  };

  const removeTestimonial = (index: number) => {
    const updated = formData.testimonials.filter((_, i) => i !== index);
    handleChange('testimonials', updated);
  };

  const moveTestimonial = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === formData.testimonials.length - 1)
    ) {
      return;
    }

    const updated = [...formData.testimonials];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
    handleChange('testimonials', updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-white/10">
        <div className="p-2 bg-jade/20 rounded-lg">
          <svg className="h-6 w-6 text-jade" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div>
          <h3 className="font-display text-lg text-champagne">Testimonials Block</h3>
          <p className="text-sm text-champagne/60">Customer reviews and feedback</p>
        </div>
      </div>

      <FormField label="Section Title" required>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="e.g., What Our Customers Say"
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

      <div className="pt-4 border-t border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-champagne">Testimonials ({formData.testimonials.length})</h4>
          <button
            type="button"
            onClick={addTestimonial}
            className="flex items-center gap-2 px-4 py-2 bg-jade text-midnight rounded-lg hover:bg-jade/90 transition-colors font-medium"
          >
            <PlusIcon className="h-4 w-4" />
            Add Testimonial
          </button>
        </div>

        <div className="space-y-4">
          {formData.testimonials.map((testimonial, index) => (
            <div key={testimonial.id} className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-champagne/70">Testimonial {index + 1}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => moveTestimonial(index, 'up')}
                    disabled={index === 0}
                    className="px-2 py-1 bg-white/10 text-champagne rounded hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveTestimonial(index, 'down')}
                    disabled={index === formData.testimonials.length - 1}
                    className="px-2 py-1 bg-white/10 text-champagne rounded hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeTestimonial(index)}
                    className="px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors text-xs"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <FormField label="Customer Name">
                <input
                  type="text"
                  value={testimonial.name}
                  onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
                />
              </FormField>

              <FormField label="Review Text">
                <textarea
                  value={testimonial.text}
                  onChange={(e) => updateTestimonial(index, 'text', e.target.value)}
                  placeholder="Customer's review..."
                  rows={3}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors resize-none"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Rating">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => updateTestimonial(index, 'rating', star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        {star <= (testimonial.rating || 0) ? (
                          <StarIconSolid className="h-6 w-6 text-yellow-400" />
                        ) : (
                          <StarIconOutline className="h-6 w-6 text-champagne/30" />
                        )}
                      </button>
                    ))}
                  </div>
                </FormField>

                <FormField label="Verified Buyer">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={testimonial.verified}
                      onChange={(e) => updateTestimonial(index, 'verified', e.target.checked)}
                      className="w-5 h-5 rounded bg-white/5 border-white/10 text-jade focus:ring-jade focus:ring-offset-0"
                    />
                    <span className="text-sm text-champagne">Show verified badge</span>
                  </label>
                </FormField>
              </div>
            </div>
          ))}

          {formData.testimonials.length === 0 && (
            <div className="text-center py-8 text-champagne/50">
              No testimonials yet. Click "Add Testimonial" to create one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
