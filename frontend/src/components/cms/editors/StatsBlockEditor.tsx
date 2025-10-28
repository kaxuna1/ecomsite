// Visual Editor for Stats Block
import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import FormField from './FormField';

interface Stat {
  id: string;
  value: string;
  label: string;
  icon?: string;
}

interface StatsContent {
  title?: string;
  subtitle?: string;
  stats: Stat[];
  columns?: 2 | 3 | 4;
}

interface StatsBlockEditorProps {
  content: StatsContent;
  onChange: (content: StatsContent) => void;
}

export default function StatsBlockEditor({ content, onChange }: StatsBlockEditorProps) {
  const [formData, setFormData] = useState<StatsContent>(content);

  useEffect(() => {
    setFormData(content);
  }, [content]);

  const handleChange = (field: keyof StatsContent, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
  };

  const addStat = () => {
    const newStat: Stat = {
      id: `stat-${Date.now()}`,
      value: '',
      label: '',
      icon: ''
    };
    handleChange('stats', [...formData.stats, newStat]);
  };

  const updateStat = (index: number, field: keyof Stat, value: string) => {
    const updated = [...formData.stats];
    updated[index] = { ...updated[index], [field]: value };
    handleChange('stats', updated);
  };

  const removeStat = (index: number) => {
    const updated = formData.stats.filter((_, i) => i !== index);
    handleChange('stats', updated);
  };

  const moveStat = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === formData.stats.length - 1)
    ) {
      return;
    }

    const updated = [...formData.stats];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
    handleChange('stats', updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-white/10">
        <div className="p-2 bg-jade/20 rounded-lg">
          <svg className="h-6 w-6 text-jade" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h3 className="font-display text-lg text-champagne">Stats Block</h3>
          <p className="text-sm text-champagne/60">Display impressive numbers and metrics</p>
        </div>
      </div>

      <FormField label="Section Title" helpText="Optional main heading">
        <input
          type="text"
          value={formData.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="e.g., Our Impact"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
        />
      </FormField>

      <FormField label="Subtitle" helpText="Optional description">
        <input
          type="text"
          value={formData.subtitle || ''}
          onChange={(e) => handleChange('subtitle', e.target.value)}
          placeholder="e.g., Results that speak for themselves"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
        />
      </FormField>

      <FormField label="Columns">
        <div className="flex gap-2">
          {[2, 3, 4].map((col) => (
            <button
              key={col}
              type="button"
              onClick={() => handleChange('columns', col as 2 | 3 | 4)}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                formData.columns === col
                  ? 'border-jade bg-jade/20 text-jade'
                  : 'border-white/10 bg-white/5 text-champagne/70 hover:border-white/20'
              }`}
            >
              {col} cols
            </button>
          ))}
        </div>
      </FormField>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-champagne">Stats ({formData.stats.length})</h4>
          <button
            type="button"
            onClick={addStat}
            className="flex items-center gap-2 px-4 py-2 bg-jade/20 hover:bg-jade/30 border border-jade/40 text-jade rounded-lg transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add Stat
          </button>
        </div>

        {formData.stats.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-xl border-2 border-dashed border-white/10">
            <svg className="h-12 w-12 mx-auto text-champagne/30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-champagne/50 text-sm">No stats yet. Click "Add Stat" to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {formData.stats.map((stat, index) => (
              <div
                key={stat.id}
                className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-champagne/70">Stat #{index + 1}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveStat(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-champagne/50 hover:text-champagne disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronUpIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStat(index, 'down')}
                      disabled={index === formData.stats.length - 1}
                      className="p-1 text-champagne/50 hover:text-champagne disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronDownIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeStat(index)}
                      className="p-1.5 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-champagne/60 mb-1 block">Value</label>
                    <input
                      type="text"
                      value={stat.value}
                      onChange={(e) => updateStat(index, 'value', e.target.value)}
                      placeholder="e.g., 50K+"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-champagne/60 mb-1 block">Icon (emoji)</label>
                    <input
                      type="text"
                      value={stat.icon || ''}
                      onChange={(e) => updateStat(index, 'icon', e.target.value)}
                      placeholder="e.g., ❤️"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-champagne/60 mb-1 block">Label</label>
                  <input
                    type="text"
                    value={stat.label}
                    onChange={(e) => updateStat(index, 'label', e.target.value)}
                    placeholder="e.g., Happy Customers"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
