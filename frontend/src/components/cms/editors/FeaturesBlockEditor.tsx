// Visual Editor for Features Block with Drag & Drop
import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import FormField from './FormField';
import IconPicker from './IconPicker';

interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
}

interface FeaturesContent {
  title: string;
  subtitle?: string;
  features: Feature[];
  columns?: 2 | 3 | 4;
}

interface FeaturesBlockEditorProps {
  content: FeaturesContent;
  onChange: (content: FeaturesContent) => void;
}

export default function FeaturesBlockEditor({ content, onChange }: FeaturesBlockEditorProps) {
  const [formData, setFormData] = useState<FeaturesContent>(content);

  useEffect(() => {
    setFormData(content);
  }, [content]);

  const handleChange = (field: keyof FeaturesContent, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
  };

  const addFeature = () => {
    const newFeature: Feature = {
      id: `feature-${Date.now()}`,
      icon: 'sparkles',
      title: '',
      description: ''
    };
    handleChange('features', [...formData.features, newFeature]);
  };

  const updateFeature = (index: number, field: keyof Feature, value: string) => {
    const updated = [...formData.features];
    updated[index] = { ...updated[index], [field]: value };
    handleChange('features', updated);
  };

  const removeFeature = (index: number) => {
    const updated = formData.features.filter((_, i) => i !== index);
    handleChange('features', updated);
  };

  const moveFeature = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === formData.features.length - 1)
    ) {
      return;
    }

    const updated = [...formData.features];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
    handleChange('features', updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-white/10">
        <div className="p-2 bg-jade/20 rounded-lg">
          <svg className="h-6 w-6 text-jade" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
          </svg>
        </div>
        <div>
          <h3 className="font-display text-lg text-champagne">Features Block</h3>
          <p className="text-sm text-champagne/60">Showcase key features with icons</p>
        </div>
      </div>

      <FormField label="Section Title" required>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="e.g., Why Choose Us"
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

      <FormField label="Grid Columns">
        <div className="flex gap-2">
          {[2, 3, 4].map((cols) => (
            <button
              key={cols}
              type="button"
              onClick={() => handleChange('columns', cols as 2 | 3 | 4)}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                formData.columns === cols
                  ? 'bg-jade text-midnight'
                  : 'bg-white/5 text-champagne hover:bg-white/10'
              }`}
            >
              {cols} Columns
            </button>
          ))}
        </div>
      </FormField>

      <div className="pt-4 border-t border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-champagne">Features ({formData.features.length})</h4>
          <button
            type="button"
            onClick={addFeature}
            className="flex items-center gap-2 px-4 py-2 bg-jade text-midnight rounded-lg hover:bg-jade/90 transition-colors font-medium"
          >
            <PlusIcon className="h-4 w-4" />
            Add Feature
          </button>
        </div>

        <div className="space-y-4">
          {formData.features.map((feature, index) => (
            <div key={feature.id} className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-champagne/70">Feature {index + 1}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => moveFeature(index, 'up')}
                    disabled={index === 0}
                    className="px-2 py-1 bg-white/10 text-champagne rounded hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveFeature(index, 'down')}
                    disabled={index === formData.features.length - 1}
                    className="px-2 py-1 bg-white/10 text-champagne rounded hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors text-xs"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <FormField label="Icon">
                <IconPicker
                  value={feature.icon}
                  onChange={(icon) => updateFeature(index, 'icon', icon)}
                />
              </FormField>

              <FormField label="Title">
                <input
                  type="text"
                  value={feature.title}
                  onChange={(e) => updateFeature(index, 'title', e.target.value)}
                  placeholder="Feature title"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
                />
              </FormField>

              <FormField label="Description">
                <textarea
                  value={feature.description}
                  onChange={(e) => updateFeature(index, 'description', e.target.value)}
                  placeholder="Feature description"
                  rows={2}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors resize-none"
                />
              </FormField>
            </div>
          ))}

          {formData.features.length === 0 && (
            <div className="text-center py-8 text-champagne/50">
              No features yet. Click "Add Feature" to create one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
