// Visual Editor for Testimonials Block with AI Generation & Extended Customization
import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, StarIcon as StarIconOutline, SparklesIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import toast from 'react-hot-toast';
import FormField from './FormField';
import MediaSelector from '../../admin/MediaManager/MediaSelector';
import { generateTestimonials, type GenerateTestimonialsRequest } from '../../../api/ai';
import type { CMSMedia } from '../../../api/media';

interface Testimonial {
  id: string;
  name: string;
  text: string;
  rating?: number;
  verified?: boolean;
  // Extended fields
  jobTitle?: string;
  company?: string;
  location?: string;
  avatarUrl?: string;
}

interface TestimonialsContent {
  title: string;
  subtitle?: string;
  testimonials: Testimonial[];
  style?: {
    backgroundColor?: string;
    cardBackgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    columns?: 1 | 2 | 3 | 4;
    cardStyle?: 'elevated' | 'flat' | 'outlined' | 'minimal';
    showAvatars?: boolean;
    showCompany?: boolean;
    showLocation?: boolean;
  };
}

interface TestimonialsBlockEditorProps {
  content: TestimonialsContent;
  onChange: (content: TestimonialsContent) => void;
}

export default function TestimonialsBlockEditor({ content, onChange }: TestimonialsBlockEditorProps) {
  const [formData, setFormData] = useState<TestimonialsContent>({
    ...content,
    style: {
      backgroundColor: '#f5f3e7',
      cardBackgroundColor: '#ffffff',
      textColor: '#0f172a',
      accentColor: '#10b981',
      columns: 3,
      cardStyle: 'elevated',
      showAvatars: true,
      showCompany: true,
      showLocation: true,
      ...content.style
    }
  });

  const [showAIModal, setShowAIModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiFormData, setAIFormData] = useState<GenerateTestimonialsRequest>({
    productName: '',
    productType: '',
    industry: '',
    targetAudience: '',
    numberOfTestimonials: 5,
    tone: 'professional',
    includeSpecificBenefits: [],
    diverseProfiles: true,
    language: 'en'
  });

  const [editingAvatarIndex, setEditingAvatarIndex] = useState<number | null>(null);
  const [showMediaSelector, setShowMediaSelector] = useState(false);

  useEffect(() => {
    setFormData({
      ...content,
      style: {
        backgroundColor: '#f5f3e7',
        cardBackgroundColor: '#ffffff',
        textColor: '#0f172a',
        accentColor: '#10b981',
        columns: 3,
        cardStyle: 'elevated',
        showAvatars: true,
        showCompany: true,
        showLocation: true,
        ...content.style
      }
    });
  }, [content]);

  const handleChange = (field: keyof TestimonialsContent, value: any) => {
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

  const handleGenerateWithAI = async () => {
    if (!aiFormData.productName.trim()) {
      toast.error('Please enter a product name');
      return;
    }

    setIsGenerating(true);
    const loadingToast = toast.loading('Generating testimonials with AI...');

    try {
      const response = await generateTestimonials(aiFormData);

      // Convert AI testimonials to our format
      const generatedTestimonials: Testimonial[] = response.testimonials.map((t, index) => ({
        id: `testimonial-${Date.now()}-${index}`,
        name: t.name,
        text: t.text,
        rating: t.rating,
        verified: t.verified,
        jobTitle: t.jobTitle,
        company: t.company,
        location: t.location
      }));

      // Add to existing testimonials
      handleChange('testimonials', [...formData.testimonials, ...generatedTestimonials]);

      toast.dismiss(loadingToast);
      toast.success(`Generated ${response.testimonials.length} testimonials! Cost: $${response.cost.toFixed(6)}`);
      setShowAIModal(false);
    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error('Testimonial generation error:', error);
      toast.error(error.response?.data?.error || 'Failed to generate testimonials');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectAvatar = (media: CMSMedia | CMSMedia[]) => {
    if (editingAvatarIndex === null) return;

    const selectedMedia = Array.isArray(media) ? media[0] : media;
    updateTestimonial(editingAvatarIndex, 'avatarUrl', selectedMedia.url);

    toast.success('Avatar selected!');
    setShowMediaSelector(false);
    setEditingAvatarIndex(null);
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
          <p className="text-sm text-champagne/60">Customer reviews with AI generation</p>
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

      {/* Style Customization */}
      <div className="space-y-4 p-4 bg-purple-900/20 border border-purple-500/30 rounded-xl">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          <h4 className="font-semibold text-purple-300">Style Customization</h4>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Background Color">
            <input
              type="color"
              value={formData.style?.backgroundColor || '#f5f3e7'}
              onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
              className="w-full h-12 rounded-lg border border-white/10 bg-white/5 cursor-pointer"
            />
          </FormField>

          <FormField label="Card Background">
            <input
              type="color"
              value={formData.style?.cardBackgroundColor || '#ffffff'}
              onChange={(e) => handleStyleChange('cardBackgroundColor', e.target.value)}
              className="w-full h-12 rounded-lg border border-white/10 bg-white/5 cursor-pointer"
            />
          </FormField>

          <FormField label="Text Color">
            <input
              type="color"
              value={formData.style?.textColor || '#0f172a'}
              onChange={(e) => handleStyleChange('textColor', e.target.value)}
              className="w-full h-12 rounded-lg border border-white/10 bg-white/5 cursor-pointer"
            />
          </FormField>

          <FormField label="Accent Color">
            <input
              type="color"
              value={formData.style?.accentColor || '#10b981'}
              onChange={(e) => handleStyleChange('accentColor', e.target.value)}
              className="w-full h-12 rounded-lg border border-white/10 bg-white/5 cursor-pointer"
              title="For stars, badges, and highlights"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Columns">
            <select
              value={formData.style?.columns || 3}
              onChange={(e) => handleStyleChange('columns', parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-purple-500"
            >
              <option value="1">1 Column</option>
              <option value="2">2 Columns</option>
              <option value="3">3 Columns</option>
              <option value="4">4 Columns</option>
            </select>
          </FormField>

          <FormField label="Card Style">
            <select
              value={formData.style?.cardStyle || 'elevated'}
              onChange={(e) => handleStyleChange('cardStyle', e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-purple-500"
            >
              <option value="elevated">Elevated (shadow)</option>
              <option value="flat">Flat (no shadow)</option>
              <option value="outlined">Outlined (border)</option>
              <option value="minimal">Minimal</option>
            </select>
          </FormField>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-purple-300">Display Options</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.style?.showAvatars}
                onChange={(e) => handleStyleChange('showAvatars', e.target.checked)}
                className="w-4 h-4 rounded bg-white/5 border-white/10 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
              />
              <span className="text-sm text-champagne">Show avatars</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.style?.showCompany}
                onChange={(e) => handleStyleChange('showCompany', e.target.checked)}
                className="w-4 h-4 rounded bg-white/5 border-white/10 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
              />
              <span className="text-sm text-champagne">Show job title & company</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.style?.showLocation}
                onChange={(e) => handleStyleChange('showLocation', e.target.checked)}
                className="w-4 h-4 rounded bg-white/5 border-white/10 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
              />
              <span className="text-sm text-champagne">Show location</span>
            </label>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-champagne">Testimonials ({formData.testimonials.length})</h4>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowAIModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-lg hover:bg-purple-500/30 transition-colors font-medium"
            >
              <SparklesIcon className="h-4 w-4" />
              Generate with AI
            </button>
            <button
              type="button"
              onClick={addTestimonial}
              className="flex items-center gap-2 px-4 py-2 bg-jade text-midnight rounded-lg hover:bg-jade/90 transition-colors font-medium"
            >
              <PlusIcon className="h-4 w-4" />
              Add Testimonial
            </button>
          </div>
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

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Customer Name">
                  <input
                    type="text"
                    value={testimonial.name}
                    onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
                  />
                </FormField>

                <FormField label="Job Title" helpText="Optional">
                  <input
                    type="text"
                    value={testimonial.jobTitle || ''}
                    onChange={(e) => updateTestimonial(index, 'jobTitle', e.target.value)}
                    placeholder="Product Manager"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
                  />
                </FormField>

                <FormField label="Company" helpText="Optional">
                  <input
                    type="text"
                    value={testimonial.company || ''}
                    onChange={(e) => updateTestimonial(index, 'company', e.target.value)}
                    placeholder="Acme Inc."
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
                  />
                </FormField>

                <FormField label="Location" helpText="Optional">
                  <input
                    type="text"
                    value={testimonial.location || ''}
                    onChange={(e) => updateTestimonial(index, 'location', e.target.value)}
                    placeholder="San Francisco, CA"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
                  />
                </FormField>
              </div>

              <FormField label="Review Text">
                <textarea
                  value={testimonial.text}
                  onChange={(e) => updateTestimonial(index, 'text', e.target.value)}
                  placeholder="Customer's review..."
                  rows={3}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors resize-none"
                />
              </FormField>

              <div className="grid grid-cols-3 gap-4">
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
                    <span className="text-sm text-champagne">Verified</span>
                  </label>
                </FormField>

                <FormField label="Avatar" helpText="Optional">
                  <div className="flex items-center gap-2">
                    {testimonial.avatarUrl ? (
                      <img
                        src={testimonial.avatarUrl}
                        alt={testimonial.name}
                        className="w-10 h-10 rounded-full object-cover border border-jade/30"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                        <PhotoIcon className="h-5 w-5 text-champagne/50" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAvatarIndex(index);
                        setShowMediaSelector(true);
                      }}
                      className="px-3 py-1.5 bg-white/10 text-champagne rounded hover:bg-white/20 transition-colors text-xs"
                    >
                      Select
                    </button>
                  </div>
                </FormField>
              </div>
            </div>
          ))}

          {formData.testimonials.length === 0 && (
            <div className="text-center py-8 text-champagne/50">
              No testimonials yet. Click "Add Testimonial" or "Generate with AI" to create them.
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
            <div className="fixed inset-0 bg-midnight/80 backdrop-blur-sm" />
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
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl border border-white/10 bg-midnight p-6 shadow-2xl transition-all">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <SparklesIcon className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <Dialog.Title className="text-xl font-display text-champagne">
                        Generate Testimonials with AI
                      </Dialog.Title>
                      <p className="text-sm text-champagne/60">Create authentic customer reviews</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <FormField label="Product Name" required>
                      <input
                        type="text"
                        value={aiFormData.productName}
                        onChange={(e) => setAIFormData({ ...aiFormData, productName: e.target.value })}
                        placeholder="e.g., Scalp Revitalizing Serum"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-purple-500"
                      />
                    </FormField>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="Product Type">
                        <input
                          type="text"
                          value={aiFormData.productType}
                          onChange={(e) => setAIFormData({ ...aiFormData, productType: e.target.value })}
                          placeholder="e.g., Hair Care Serum"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-purple-500"
                        />
                      </FormField>

                      <FormField label="Industry">
                        <input
                          type="text"
                          value={aiFormData.industry}
                          onChange={(e) => setAIFormData({ ...aiFormData, industry: e.target.value })}
                          placeholder="e.g., Beauty & Personal Care"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-purple-500"
                        />
                      </FormField>
                    </div>

                    <FormField label="Target Audience">
                      <input
                        type="text"
                        value={aiFormData.targetAudience}
                        onChange={(e) => setAIFormData({ ...aiFormData, targetAudience: e.target.value })}
                        placeholder="e.g., Health-conscious professionals aged 25-45"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-purple-500"
                      />
                    </FormField>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="Number of Testimonials">
                        <input
                          type="number"
                          min="3"
                          max="10"
                          value={aiFormData.numberOfTestimonials}
                          onChange={(e) => setAIFormData({ ...aiFormData, numberOfTestimonials: parseInt(e.target.value) || 5 })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-purple-500"
                        />
                      </FormField>

                      <FormField label="Tone">
                        <select
                          value={aiFormData.tone}
                          onChange={(e) => setAIFormData({ ...aiFormData, tone: e.target.value as any })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-purple-500"
                        >
                          <option value="professional">Professional</option>
                          <option value="casual">Casual</option>
                          <option value="enthusiastic">Enthusiastic</option>
                          <option value="technical">Technical</option>
                        </select>
                      </FormField>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aiFormData.diverseProfiles}
                        onChange={(e) => setAIFormData({ ...aiFormData, diverseProfiles: e.target.checked })}
                        className="w-4 h-4 rounded bg-white/5 border-white/10 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
                      />
                      <span className="text-sm text-champagne">Generate diverse customer personas</span>
                    </label>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={handleGenerateWithAI}
                      disabled={isGenerating || !aiFormData.productName.trim()}
                      className="flex-1 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? 'Generating...' : 'Generate Testimonials'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAIModal(false)}
                      className="px-6 py-3 bg-white/10 text-champagne rounded-lg hover:bg-white/20 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Media Selector Modal for Avatars - Higher z-index than AI modal */}
      <MediaSelector
        isOpen={showMediaSelector}
        onClose={() => {
          setShowMediaSelector(false);
          setEditingAvatarIndex(null);
        }}
        onSelect={handleSelectAvatar}
        multiple={false}
        title="Select Avatar Image"
        description="Choose a customer avatar image"
      />
    </div>
  );
}
