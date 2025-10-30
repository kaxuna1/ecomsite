// Visual Editor for Hero Block
import { useState, useEffect } from 'react';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, SparklesIcon, PhotoIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import FormField from './FormField';
import ColorPicker, { ColorSchemePicker } from './ColorPicker';
import { generateHero, type GenerateHeroRequest } from '../../../api/ai';
import { toast } from 'react-hot-toast';
import MediaSelector from '../../admin/MediaManager/MediaSelector';
import MediaUploader from '../../admin/MediaManager/MediaUploader';
import type { CMSMedia } from '../../../api/media';

interface HeroContent {
  headline: string;
  subheadline: string;
  description?: string;
  ctaText: string;
  ctaLink: string;
  textAlignment?: 'left' | 'center' | 'right';
  template?: string;
  backgroundImage?: string;
  backgroundImageAlt?: string;
  overlayOpacity?: number;
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
  const [showAIModal, setShowAIModal] = useState(false);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiFormData, setAIFormData] = useState<GenerateHeroRequest>({
    brandName: '',
    productOrService: '',
    targetAudience: '',
    tone: 'professional',
    template: formData.template as any || 'split-screen',
    goal: 'convert',
    language: 'en'
  });

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

  // Media Selection
  const handleSelectImageFromLibrary = (media: CMSMedia | CMSMedia[]) => {
    const selectedMedia = Array.isArray(media) ? media[0] : media;

    // Update both fields at once
    const updated = {
      ...formData,
      backgroundImage: selectedMedia.url,
      backgroundImageAlt: selectedMedia.altText || selectedMedia.title || ''
    };

    setFormData(updated);
    onChange(updated);

    toast.success('Hero image selected successfully!');
    setShowMediaSelector(false);
  };

  // Media Upload Complete
  const handleUploadComplete = () => {
    setShowUploader(false);
    toast.success('Image uploaded! Now select it from the library.');
    // Open media selector after upload
    setTimeout(() => setShowMediaSelector(true), 500);
  };

  // AI Generation
  const handleGenerateWithAI = async () => {
    if (!aiFormData.brandName.trim()) {
      toast.error('Please enter a brand name');
      return;
    }

    setIsGenerating(true);
    const loadingToast = toast.loading('Generating hero content with AI...');

    try {
      const response = await generateHero(aiFormData);

      // Update form data with generated content
      const updated = {
        ...formData,
        headline: response.headline,
        subheadline: response.subheadline,
        description: response.description,
        ctaText: response.ctaText
      };

      setFormData(updated);
      onChange(updated);

      toast.dismiss(loadingToast);
      toast.success(`Hero content generated! Cost: $${response.cost.toFixed(4)}`);
      setShowAIModal(false);

      // Reset AI form
      setAIFormData({
        brandName: '',
        productOrService: '',
        targetAudience: '',
        tone: 'professional',
        template: formData.template as any || 'split-screen',
        goal: 'convert',
        language: 'en'
      });
    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error('Hero generation error:', error);
      toast.error(error.response?.data?.message || 'Failed to generate hero content');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
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
        <button
          type="button"
          onClick={() => setShowAIModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-400/40 text-purple-300 rounded-lg transition-all"
        >
          <SparklesIcon className="h-4 w-4" />
          Generate with AI
        </button>
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

      {/* Hero Image Settings */}
      <div className="space-y-4 p-4 bg-jade/5 border border-jade/20 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-jade" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h4 className="font-semibold text-champagne">Hero Image</h4>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMediaSelector(true)}
              className="flex items-center gap-2 px-4 py-2 bg-jade/20 hover:bg-jade/30 border border-jade/40 text-jade rounded-lg transition-colors text-sm"
              title="Select from media library"
            >
              <PhotoIcon className="h-4 w-4" />
              Library
            </button>
            <button
              type="button"
              onClick={() => setShowUploader(!showUploader)}
              className="flex items-center gap-2 px-4 py-2 bg-jade/20 hover:bg-jade/30 border border-jade/40 text-jade rounded-lg transition-colors text-sm"
              title="Upload new image"
            >
              <CloudArrowUpIcon className="h-4 w-4" />
              Upload
            </button>
          </div>
        </div>

        {/* Upload Section */}
        {showUploader && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <MediaUploader onUploadComplete={handleUploadComplete} />
          </div>
        )}

        {formData.backgroundImage ? (
          <>
            <FormField label="Image Alt Text" helpText="Accessibility description">
              <input
                type="text"
                value={formData.backgroundImageAlt || ''}
                onChange={(e) => handleChange('backgroundImageAlt', e.target.value)}
                placeholder="e.g., Luxury scalp care products"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
              />
            </FormField>
          </>
        ) : (
          !showUploader && (
            <div className="text-center py-8 bg-white/5 rounded-xl border-2 border-dashed border-white/10">
              <PhotoIcon className="h-12 w-12 mx-auto text-champagne/30 mb-3" />
              <p className="text-champagne/50 text-sm">No image selected</p>
              <p className="text-champagne/30 text-xs mt-1">Select from library or upload a new image</p>
            </div>
          )
        )}

        {formData.backgroundImage && (
          <div className="relative rounded-lg overflow-hidden border border-white/10">
            <img
              src={formData.backgroundImage}
              alt={formData.backgroundImageAlt || 'Hero image preview'}
              className="w-full h-48 object-cover"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23374151" width="400" height="300"/%3E%3Ctext fill="%239CA3AF" font-family="sans-serif" font-size="18" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EImage not found%3C/text%3E%3C/svg%3E';
              }}
            />
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-midnight/80 backdrop-blur-sm rounded text-xs text-champagne/80">
              Preview
            </div>
          </div>
        )}

        {(formData.template === 'full-width-overlay' || formData.template === 'gradient-modern') && (
          <FormField label="Overlay Opacity" helpText="Darkness of text overlay (0-100)">
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="100"
                value={formData.overlayOpacity || 50}
                onChange={(e) => handleChange('overlayOpacity', parseInt(e.target.value))}
                className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-jade"
              />
              <span className="text-champagne font-mono text-sm w-12 text-right">
                {formData.overlayOpacity || 50}%
              </span>
            </div>
          </FormField>
        )}
      </div>

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

      {/* AI Generation Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <div className="bg-midnight border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-white/10 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
                  <SparklesIcon className="h-6 w-6 text-purple-300" />
                </div>
                <div>
                  <h3 className="font-display text-lg text-champagne">Generate Hero Content with AI</h3>
                  <p className="text-sm text-champagne/60">Create conversion-optimized headlines and copy</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAIModal(false)}
                className="text-champagne/50 hover:text-champagne transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <FormField label="Brand Name" helpText="Your brand or company name" required>
                <input
                  type="text"
                  value={aiFormData.brandName}
                  onChange={(e) => setAIFormData({ ...aiFormData, brandName: e.target.value })}
                  placeholder="e.g., Luxia Products"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-purple-400 transition-colors"
                />
              </FormField>

              <FormField label="Product/Service" helpText="What are you promoting?">
                <input
                  type="text"
                  value={aiFormData.productOrService || ''}
                  onChange={(e) => setAIFormData({ ...aiFormData, productOrService: e.target.value })}
                  placeholder="e.g., Premium Scalp Care Collection"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-purple-400 transition-colors"
                />
              </FormField>

              <FormField label="Target Audience" helpText="Who is this for?">
                <input
                  type="text"
                  value={aiFormData.targetAudience || ''}
                  onChange={(e) => setAIFormData({ ...aiFormData, targetAudience: e.target.value })}
                  placeholder="e.g., Health-conscious professionals seeking premium self-care"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-purple-400 transition-colors"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Tone" helpText="Brand voice">
                  <select
                    value={aiFormData.tone || 'professional'}
                    onChange={(e) => setAIFormData({ ...aiFormData, tone: e.target.value as any })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-purple-400 transition-colors"
                  >
                    <option value="professional" className="bg-midnight">Professional</option>
                    <option value="luxury" className="bg-midnight">Luxury</option>
                    <option value="friendly" className="bg-midnight">Friendly</option>
                    <option value="bold" className="bg-midnight">Bold</option>
                    <option value="minimal" className="bg-midnight">Minimal</option>
                  </select>
                </FormField>

                <FormField label="Goal" helpText="Primary objective">
                  <select
                    value={aiFormData.goal || 'convert'}
                    onChange={(e) => setAIFormData({ ...aiFormData, goal: e.target.value as any })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-purple-400 transition-colors"
                  >
                    <option value="sell" className="bg-midnight">Sell</option>
                    <option value="inform" className="bg-midnight">Inform</option>
                    <option value="engage" className="bg-midnight">Engage</option>
                    <option value="convert" className="bg-midnight">Convert</option>
                    <option value="inspire" className="bg-midnight">Inspire</option>
                  </select>
                </FormField>
              </div>

              <FormField label="Template" helpText="Match your selected design">
                <select
                  value={aiFormData.template || formData.template || 'split-screen'}
                  onChange={(e) => setAIFormData({ ...aiFormData, template: e.target.value as any })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-purple-400 transition-colors"
                >
                  <option value="split-screen" className="bg-midnight">Split Screen</option>
                  <option value="centered-minimal" className="bg-midnight">Centered Minimal</option>
                  <option value="full-width-overlay" className="bg-midnight">Full-Width Overlay</option>
                  <option value="asymmetric-bold" className="bg-midnight">Asymmetric Bold</option>
                  <option value="luxury-minimal" className="bg-midnight">Luxury Minimal</option>
                  <option value="gradient-modern" className="bg-midnight">Gradient Modern</option>
                </select>
              </FormField>

              {/* Info Box */}
              <div className="p-4 bg-purple-500/10 border border-purple-400/20 rounded-lg">
                <p className="text-sm text-purple-300 leading-relaxed">
                  <strong>AI-Powered:</strong> Creates attention-grabbing headlines, persuasive subheadlines,
                  benefit-focused descriptions, and action-driven CTAs optimized for your selected template and brand voice.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-midnight/95 backdrop-blur-sm border-t border-white/10 px-6 py-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowAIModal(false)}
                disabled={isGenerating}
                className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-champagne rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateWithAI}
                disabled={isGenerating || !aiFormData.brandName.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-4 w-4" />
                    Generate Content
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Selector Modal */}
      {showMediaSelector && (
        <MediaSelector
          isOpen={showMediaSelector}
          onClose={() => setShowMediaSelector(false)}
          onSelect={handleSelectImageFromLibrary}
          multiple={false}
          title="Select Hero Image"
          description="Choose an image from your media library for the hero background"
        />
      )}
    </div>
  );
}
