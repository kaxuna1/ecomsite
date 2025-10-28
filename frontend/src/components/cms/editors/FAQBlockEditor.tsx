// Visual Editor for FAQ Block - World-Class Builder
import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon, TagIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import FormField from './FormField';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

interface FAQContent {
  title?: string;
  subtitle?: string;
  faqs: FAQ[];
  categories?: string[];
  enableSearch?: boolean;
  enableCategories?: boolean;
}

interface FAQBlockEditorProps {
  content: FAQContent;
  onChange: (content: FAQContent) => void;
}

export default function FAQBlockEditor({ content, onChange }: FAQBlockEditorProps) {
  const [formData, setFormData] = useState<FAQContent>(content);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    setFormData(content);
  }, [content]);

  const handleChange = (field: keyof FAQContent, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
  };

  // FAQ Management
  const addFAQ = () => {
    const newFAQ: FAQ = {
      id: `faq-${Date.now()}`,
      question: '',
      answer: '',
      category: formData.categories && formData.categories.length > 0 ? formData.categories[0] : undefined
    };
    handleChange('faqs', [...formData.faqs, newFAQ]);
  };

  const updateFAQ = (index: number, field: keyof FAQ, value: string) => {
    const updated = [...formData.faqs];
    updated[index] = { ...updated[index], [field]: value };
    handleChange('faqs', updated);
  };

  const removeFAQ = (index: number) => {
    const updated = formData.faqs.filter((_, i) => i !== index);
    handleChange('faqs', updated);
  };

  const moveFAQ = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === formData.faqs.length - 1)
    ) {
      return;
    }

    const updated = [...formData.faqs];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
    handleChange('faqs', updated);
  };

  // Category Management
  const addCategory = () => {
    if (!newCategory.trim()) return;

    const categories = formData.categories || [];
    if (categories.includes(newCategory.trim())) {
      alert('Category already exists');
      return;
    }

    handleChange('categories', [...categories, newCategory.trim()]);
    setNewCategory('');
  };

  const removeCategory = (category: string) => {
    const updated = (formData.categories || []).filter(c => c !== category);
    handleChange('categories', updated);

    // Remove category from FAQs
    const updatedFAQs = formData.faqs.map(faq => ({
      ...faq,
      category: faq.category === category ? undefined : faq.category
    }));
    handleChange('faqs', updatedFAQs);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-white/10">
        <div className="p-2 bg-jade/20 rounded-lg">
          <svg className="h-6 w-6 text-jade" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="font-display text-lg text-champagne">FAQ Block</h3>
          <p className="text-sm text-champagne/60">World-class FAQ with search & categories</p>
        </div>
      </div>

      {/* Section Settings */}
      <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-xl">
        <h4 className="font-semibold text-champagne flex items-center gap-2">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Section Settings
        </h4>

        <FormField label="Section Title" helpText="Optional main heading">
          <input
            type="text"
            value={formData.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="e.g., Frequently Asked Questions"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
          />
        </FormField>

        <FormField label="Subtitle" helpText="Optional description">
          <input
            type="text"
            value={formData.subtitle || ''}
            onChange={(e) => handleChange('subtitle', e.target.value)}
            placeholder="e.g., Everything you need to know"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Enable Search">
            <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
              <input
                type="checkbox"
                checked={formData.enableSearch !== false}
                onChange={(e) => handleChange('enableSearch', e.target.checked)}
                className="w-5 h-5 text-jade bg-white/10 border-white/20 rounded focus:ring-jade focus:ring-2"
              />
              <div className="flex items-center gap-2 text-champagne">
                <MagnifyingGlassIcon className="h-4 w-4" />
                <span className="text-sm">Search bar</span>
              </div>
            </label>
          </FormField>

          <FormField label="Enable Categories">
            <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
              <input
                type="checkbox"
                checked={formData.enableCategories !== false}
                onChange={(e) => handleChange('enableCategories', e.target.checked)}
                className="w-5 h-5 text-jade bg-white/10 border-white/20 rounded focus:ring-jade focus:ring-2"
              />
              <div className="flex items-center gap-2 text-champagne">
                <TagIcon className="h-4 w-4" />
                <span className="text-sm">Category filters</span>
              </div>
            </label>
          </FormField>
        </div>
      </div>

      {/* Category Management */}
      {formData.enableCategories !== false && (
        <div className="space-y-4 p-4 bg-jade/5 border border-jade/20 rounded-xl">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-jade flex items-center gap-2">
              <TagIcon className="h-5 w-5" />
              Categories ({(formData.categories || []).length})
            </h4>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCategory()}
              placeholder="Add category (e.g., Shipping)"
              className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors text-sm"
            />
            <button
              type="button"
              onClick={addCategory}
              className="px-4 py-2 bg-jade/20 hover:bg-jade/30 border border-jade/40 text-jade rounded-lg transition-colors text-sm font-medium"
            >
              Add
            </button>
          </div>

          {formData.categories && formData.categories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {formData.categories.map((category) => (
                <div
                  key={category}
                  className="flex items-center gap-2 px-3 py-1.5 bg-jade/10 border border-jade/30 rounded-lg text-jade text-sm"
                >
                  <span>{category}</span>
                  <button
                    type="button"
                    onClick={() => removeCategory(category)}
                    className="hover:text-red-400 transition-colors"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-champagne/50 italic">No categories added yet</p>
          )}
        </div>
      )}

      {/* FAQ List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-champagne">FAQ Items ({formData.faqs.length})</h4>
          <button
            type="button"
            onClick={addFAQ}
            className="flex items-center gap-2 px-4 py-2 bg-jade/20 hover:bg-jade/30 border border-jade/40 text-jade rounded-lg transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add FAQ
          </button>
        </div>

        {formData.faqs.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-xl border-2 border-dashed border-white/10">
            <svg className="h-12 w-12 mx-auto text-champagne/30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-champagne/50 text-sm">No FAQs yet. Click "Add FAQ" to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {formData.faqs.map((faq, index) => (
              <div
                key={faq.id}
                className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-champagne/70">FAQ #{index + 1}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveFAQ(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-champagne/50 hover:text-champagne disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      aria-label="Move up"
                    >
                      <ChevronUpIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveFAQ(index, 'down')}
                      disabled={index === formData.faqs.length - 1}
                      className="p-1 text-champagne/50 hover:text-champagne disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      aria-label="Move down"
                    >
                      <ChevronDownIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFAQ(index)}
                      className="p-1.5 text-red-400 hover:text-red-300 transition-colors"
                      aria-label="Remove FAQ"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {formData.enableCategories !== false && formData.categories && formData.categories.length > 0 && (
                  <div>
                    <label className="text-xs text-champagne/60 mb-1 block">Category</label>
                    <select
                      value={faq.category || ''}
                      onChange={(e) => updateFAQ(index, 'category', e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade transition-colors text-sm"
                    >
                      <option value="" className="bg-midnight">No category</option>
                      {formData.categories.map((cat) => (
                        <option key={cat} value={cat} className="bg-midnight">{cat}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-xs text-champagne/60 mb-1 block">Question</label>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => updateFAQ(index, 'question', e.target.value)}
                    placeholder="e.g., How long does shipping take?"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-champagne/60 mb-1 block">Answer</label>
                  <textarea
                    value={faq.answer}
                    onChange={(e) => updateFAQ(index, 'answer', e.target.value)}
                    placeholder="Enter the detailed answer here..."
                    rows={3}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors text-sm resize-none"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="p-4 bg-jade/5 border border-jade/20 rounded-xl">
        <p className="text-sm text-jade/80 leading-relaxed">
          <strong>2025 Best Practices:</strong> This FAQ block follows industry-leading UX patterns including:
          accordion with 300ms animations, search functionality, category filtering, keyboard navigation (Enter/Space),
          ARIA attributes for accessibility, and 44px+ touch targets for mobile.
        </p>
      </div>
    </div>
  );
}
