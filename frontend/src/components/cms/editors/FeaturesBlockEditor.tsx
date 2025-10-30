// Enhanced Visual Editor for Features Block with AI Generation and Full Customization
import { useState, useEffect, Fragment } from 'react';
import { PlusIcon, TrashIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import toast from 'react-hot-toast';
import FormField from './FormField';
import IconPicker from './IconPicker';
import { generateFeatures, GenerateFeaturesRequest } from '../../../api/ai';

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
  style?: {
    backgroundColor?: string;
    cardBackgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    iconBackgroundColor?: string;
    layout?: 'classic' | 'modern' | 'minimal' | 'cards';
    iconStyle?: 'circle' | 'square' | 'rounded' | 'none';
    cardHover?: boolean;
    centerAlign?: boolean;
  };
}

interface FeaturesBlockEditorProps {
  content: FeaturesContent;
  onChange: (content: FeaturesContent) => void;
}

export default function FeaturesBlockEditor({ content, onChange }: FeaturesBlockEditorProps) {
  const [formData, setFormData] = useState<FeaturesContent>(content);
  const [showAIModal, setShowAIModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiFormData, setAiFormData] = useState<GenerateFeaturesRequest>({
    productOrService: '',
    industry: '',
    targetAudience: '',
    numberOfFeatures: 4,
    focusArea: 'mixed',
    tone: 'professional',
    includeSpecificFeatures: [],
    language: 'en'
  });

  useEffect(() => {
    setFormData(content);
  }, [content]);

  const handleChange = (field: keyof FeaturesContent, value: any) => {
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

  const handleGenerateWithAI = async () => {
    if (!aiFormData.productOrService.trim()) {
      toast.error('Please enter a product or service name');
      return;
    }

    setIsGenerating(true);
    const loadingToast = toast.loading('Generating features with AI...');

    try {
      const response = await generateFeatures(aiFormData);

      // Convert AI features to editor format
      const generatedFeatures: Feature[] = response.features.map((f, index) => ({
        id: `feature-${Date.now()}-${index}`,
        icon: f.icon,
        title: f.title,
        description: f.description
      }));

      // Merge with existing features
      handleChange('features', [...formData.features, ...generatedFeatures]);

      toast.dismiss(loadingToast);
      toast.success(`Generated ${response.features.length} features! Cost: $${response.cost.toFixed(6)}`);
      setShowAIModal(false);

      // Reset AI form
      setAiFormData({
        productOrService: '',
        industry: '',
        targetAudience: '',
        numberOfFeatures: 4,
        focusArea: 'mixed',
        tone: 'professional',
        includeSpecificFeatures: [],
        language: 'en'
      });
    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error('Features generation error:', error);
      toast.error(error.response?.data?.error || 'Failed to generate features');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-white/10">
        <div className="p-2 bg-jade/20 rounded-lg">
          <svg className="h-6 w-6 text-jade" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg text-champagne">Features Block</h3>
          <p className="text-sm text-champagne/60">Showcase key features with icons</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAIModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          <SparklesIcon className="h-5 w-5" />
          Generate with AI
        </button>
      </div>

      {/* Basic Settings */}
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

      {/* Style Customization */}
      <div className="pt-6 border-t border-white/10">
        <h4 className="font-semibold text-purple-400 mb-4">Style Customization</h4>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <FormField label="Background Color">
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.style?.backgroundColor || '#fef9f3'}
                onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                className="h-10 w-20 rounded border border-white/10 bg-white/5 cursor-pointer"
              />
              <input
                type="text"
                value={formData.style?.backgroundColor || '#fef9f3'}
                onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                placeholder="#fef9f3"
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-champagne text-sm"
              />
            </div>
          </FormField>

          <FormField label="Card Background">
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.style?.cardBackgroundColor || '#ffffff'}
                onChange={(e) => handleStyleChange('cardBackgroundColor', e.target.value)}
                className="h-10 w-20 rounded border border-white/10 bg-white/5 cursor-pointer"
              />
              <input
                type="text"
                value={formData.style?.cardBackgroundColor || '#ffffff'}
                onChange={(e) => handleStyleChange('cardBackgroundColor', e.target.value)}
                placeholder="#ffffff"
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-champagne text-sm"
              />
            </div>
          </FormField>

          <FormField label="Text Color">
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.style?.textColor || '#1e293b'}
                onChange={(e) => handleStyleChange('textColor', e.target.value)}
                className="h-10 w-20 rounded border border-white/10 bg-white/5 cursor-pointer"
              />
              <input
                type="text"
                value={formData.style?.textColor || '#1e293b'}
                onChange={(e) => handleStyleChange('textColor', e.target.value)}
                placeholder="#1e293b"
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-champagne text-sm"
              />
            </div>
          </FormField>

          <FormField label="Accent Color (Icons)">
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.style?.accentColor || '#10b981'}
                onChange={(e) => handleStyleChange('accentColor', e.target.value)}
                className="h-10 w-20 rounded border border-white/10 bg-white/5 cursor-pointer"
              />
              <input
                type="text"
                value={formData.style?.accentColor || '#10b981'}
                onChange={(e) => handleStyleChange('accentColor', e.target.value)}
                placeholder="#10b981"
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-champagne text-sm"
              />
            </div>
          </FormField>

          <FormField label="Icon Background">
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.style?.iconBackgroundColor || 'rgba(16, 185, 129, 0.1)'}
                onChange={(e) => handleStyleChange('iconBackgroundColor', e.target.value)}
                className="h-10 w-20 rounded border border-white/10 bg-white/5 cursor-pointer"
              />
              <input
                type="text"
                value={formData.style?.iconBackgroundColor || 'rgba(16, 185, 129, 0.1)'}
                onChange={(e) => handleStyleChange('iconBackgroundColor', e.target.value)}
                placeholder="rgba(16, 185, 129, 0.1)"
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-champagne text-sm"
              />
            </div>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <FormField label="Card Layout">
            <select
              value={formData.style?.layout || 'classic'}
              onChange={(e) => handleStyleChange('layout', e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="classic">Classic - Icons top, shadow</option>
              <option value="modern">Modern - Side icons, gradient</option>
              <option value="minimal">Minimal - Simple, no border</option>
              <option value="cards">Cards - Elevated, strong shadow</option>
            </select>
          </FormField>

          <FormField label="Icon Style">
            <select
              value={formData.style?.iconStyle || 'circle'}
              onChange={(e) => handleStyleChange('iconStyle', e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="circle">Circle Background</option>
              <option value="square">Square Background</option>
              <option value="rounded">Rounded Background</option>
              <option value="none">No Background</option>
            </select>
          </FormField>
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-champagne/80 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.style?.cardHover !== false}
              onChange={(e) => handleStyleChange('cardHover', e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm">Enable hover effects</span>
          </label>

          <label className="flex items-center gap-2 text-champagne/80 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.style?.centerAlign === true}
              onChange={(e) => handleStyleChange('centerAlign', e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm">Center-align content</span>
          </label>
        </div>
      </div>

      {/* Features List */}
      <div className="pt-6 border-t border-white/10">
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
              No features yet. Click "Add Feature" or "Generate with AI" to create features.
            </div>
          )}
        </div>
      </div>

      {/* AI Generation Modal */}
      <Transition appear show={showAIModal} as={Fragment}>
        <Dialog as="div" className="relative z-[100]" onClose={() => setShowAIModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-midnight border border-purple-500/20 p-6 shadow-2xl transition-all">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-600/20 rounded-xl">
                      <SparklesIcon className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <Dialog.Title className="text-xl font-display text-champagne">
                        Generate Features with AI
                      </Dialog.Title>
                      <p className="text-sm text-champagne/60 mt-1">
                        Create compelling feature descriptions automatically
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <FormField label="Product or Service Name" required>
                      <input
                        type="text"
                        value={aiFormData.productOrService}
                        onChange={(e) => setAiFormData({ ...aiFormData, productOrService: e.target.value })}
                        placeholder="e.g., Luxia Scalp Care Products"
                        className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </FormField>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="Industry">
                        <input
                          type="text"
                          value={aiFormData.industry}
                          onChange={(e) => setAiFormData({ ...aiFormData, industry: e.target.value })}
                          placeholder="e.g., E-commerce, Beauty"
                          className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-purple-500 transition-colors"
                        />
                      </FormField>

                      <FormField label="Target Audience">
                        <input
                          type="text"
                          value={aiFormData.targetAudience}
                          onChange={(e) => setAiFormData({ ...aiFormData, targetAudience: e.target.value })}
                          placeholder="e.g., Health-conscious women"
                          className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-purple-500 transition-colors"
                        />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="Number of Features">
                        <select
                          value={aiFormData.numberOfFeatures}
                          onChange={(e) => setAiFormData({ ...aiFormData, numberOfFeatures: parseInt(e.target.value) })}
                          className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-lg text-champagne focus:outline-none focus:border-purple-500 transition-colors"
                        >
                          <option value={3}>3 Features</option>
                          <option value={4}>4 Features</option>
                          <option value={5}>5 Features</option>
                          <option value={6}>6 Features</option>
                          <option value={8}>8 Features</option>
                        </select>
                      </FormField>

                      <FormField label="Focus Area">
                        <select
                          value={aiFormData.focusArea}
                          onChange={(e) => setAiFormData({ ...aiFormData, focusArea: e.target.value as any })}
                          className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-lg text-champagne focus:outline-none focus:border-purple-500 transition-colors"
                        >
                          <option value="mixed">Mixed (Balanced)</option>
                          <option value="benefits">Customer Benefits</option>
                          <option value="technical">Technical Capabilities</option>
                          <option value="competitive">Competitive Advantages</option>
                          <option value="user-experience">User Experience</option>
                        </select>
                      </FormField>
                    </div>

                    <FormField label="Tone">
                      <div className="grid grid-cols-4 gap-2">
                        {(['professional', 'friendly', 'technical', 'persuasive'] as const).map((tone) => (
                          <button
                            key={tone}
                            type="button"
                            onClick={() => setAiFormData({ ...aiFormData, tone })}
                            className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                              aiFormData.tone === tone
                                ? 'bg-purple-600 text-white'
                                : 'bg-white/5 text-champagne/70 hover:bg-white/10'
                            }`}
                          >
                            {tone.charAt(0).toUpperCase() + tone.slice(1)}
                          </button>
                        ))}
                      </div>
                    </FormField>
                  </div>

                  <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setShowAIModal(false)}
                      disabled={isGenerating}
                      className="flex-1 px-4 py-3 bg-white/5 text-champagne rounded-lg hover:bg-white/10 transition-colors font-medium disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateWithAI}
                      disabled={isGenerating || !aiFormData.productOrService.trim()}
                      className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <SparklesIcon className="h-5 w-5" />
                      {isGenerating ? 'Generating...' : 'Generate Features'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
