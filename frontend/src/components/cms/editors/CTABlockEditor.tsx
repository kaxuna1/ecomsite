// Visual Editor for CTA (Call-to-Action) Block
import { useState, useEffect } from 'react';
import { PhotoIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import FormField from './FormField';
import MediaSelector from '../../admin/MediaManager/MediaSelector';
import MediaUploader from '../../admin/MediaManager/MediaUploader';
import type { CMSMedia } from '../../../api/media';

interface CTAContent {
  title: string;
  description?: string;
  primaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  backgroundImage?: string;
  backgroundImageAlt?: string;
  style?: {
    backgroundColor?: string;
    textColor?: string;
    overlayOpacity?: number;
    textAlignment?: 'left' | 'center' | 'right';
    padding?: 'small' | 'medium' | 'large' | 'extra-large';
    primaryButton?: {
      backgroundColor?: string;
      textColor?: string;
      hoverBackgroundColor?: string;
      hoverTextColor?: string;
      size?: 'small' | 'medium' | 'large';
      style?: 'solid' | 'outline' | 'ghost';
      borderRadius?: 'none' | 'small' | 'medium' | 'large' | 'full';
    };
    secondaryButton?: {
      backgroundColor?: string;
      textColor?: string;
      hoverBackgroundColor?: string;
      hoverTextColor?: string;
      size?: 'small' | 'medium' | 'large';
      style?: 'solid' | 'outline' | 'ghost';
      borderRadius?: 'none' | 'small' | 'medium' | 'large' | 'full';
    };
  };
}

interface CTABlockEditorProps {
  content: CTAContent;
  onChange: (content: CTAContent) => void;
}

export default function CTABlockEditor({ content, onChange }: CTABlockEditorProps) {
  const [formData, setFormData] = useState<CTAContent>({
    ...content,
    style: {
      backgroundColor: '#10b981',
      textColor: '#ffffff',
      overlayOpacity: 80,
      textAlignment: 'center',
      padding: 'large',
      primaryButton: {
        backgroundColor: '#ffffff',
        textColor: '#0f172a',
        hoverBackgroundColor: '#f5f3e7',
        hoverTextColor: '#0f172a',
        size: 'medium',
        style: 'solid',
        borderRadius: 'full'
      },
      secondaryButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        textColor: '#ffffff',
        hoverBackgroundColor: 'rgba(255, 255, 255, 0.2)',
        hoverTextColor: '#ffffff',
        size: 'medium',
        style: 'outline',
        borderRadius: 'full'
      },
      ...content.style
    }
  });

  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [showUploader, setShowUploader] = useState(false);

  useEffect(() => {
    setFormData({
      ...content,
      style: {
        backgroundColor: '#10b981',
        textColor: '#ffffff',
        overlayOpacity: 80,
        textAlignment: 'center',
        padding: 'large',
        primaryButton: {
          backgroundColor: '#ffffff',
          textColor: '#0f172a',
          hoverBackgroundColor: '#f5f3e7',
          hoverTextColor: '#0f172a',
          size: 'medium',
          style: 'solid',
          borderRadius: 'full'
        },
        secondaryButton: {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          textColor: '#ffffff',
          hoverBackgroundColor: 'rgba(255, 255, 255, 0.2)',
          hoverTextColor: '#ffffff',
          size: 'medium',
          style: 'outline',
          borderRadius: 'full'
        },
        ...content.style
      }
    });
  }, [content]);

  const handleChange = (field: keyof CTAContent, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
  };

  const handleStyleChange = (path: string[], value: any) => {
    const updated = { ...formData };
    let current: any = updated;

    // Navigate to the nested property
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) {
        current[path[i]] = {};
      }
      current = current[path[i]];
    }

    // Set the value
    current[path[path.length - 1]] = value;

    setFormData(updated);
    onChange(updated);
  };

  const handleSelectImageFromLibrary = (media: CMSMedia | CMSMedia[]) => {
    const selectedMedia = Array.isArray(media) ? media[0] : media;

    // Update both fields at once
    const updated = {
      ...formData,
      backgroundImage: selectedMedia.url,
      backgroundImageAlt: selectedMedia.altText || ''
    };

    setFormData(updated);
    onChange(updated);

    toast.success('Background image selected successfully!');
    setShowMediaSelector(false);
  };

  const handleUploadComplete = () => {
    setShowUploader(false);
    toast.success('Image uploaded! Now select it from the library.');
    // Open media selector after upload
    setTimeout(() => setShowMediaSelector(true), 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-white/10">
        <div className="p-2 bg-jade/20 rounded-lg">
          <svg className="h-6 w-6 text-jade" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h3 className="font-display text-lg text-champagne">CTA Block</h3>
          <p className="text-sm text-champagne/60">Powerful call-to-action section</p>
        </div>
      </div>

      <FormField label="Title" required>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="e.g., Ready to Get Started?"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
        />
      </FormField>

      <FormField label="Description" helpText="Optional supporting text">
        <textarea
          value={formData.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Add a compelling description"
          rows={3}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors resize-none"
        />
      </FormField>

      {/* Primary Button */}
      <div className="space-y-4 p-4 bg-jade/5 border border-jade/20 rounded-xl">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-jade" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
          <h4 className="font-semibold text-jade">Primary Button</h4>
        </div>

        <FormField label="Button Text">
          <input
            type="text"
            value={formData.primaryButtonText || ''}
            onChange={(e) => handleChange('primaryButtonText', e.target.value)}
            placeholder="e.g., Shop Now"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
          />
        </FormField>

        <FormField label="Button Link">
          <input
            type="text"
            value={formData.primaryButtonLink || ''}
            onChange={(e) => handleChange('primaryButtonLink', e.target.value)}
            placeholder="e.g., /products"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors font-mono text-sm"
          />
        </FormField>
      </div>

      {/* Secondary Button */}
      <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-xl">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-champagne/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <h4 className="font-semibold text-champagne/70">Secondary Button (Optional)</h4>
        </div>

        <FormField label="Button Text" helpText="Leave empty to hide">
          <input
            type="text"
            value={formData.secondaryButtonText || ''}
            onChange={(e) => handleChange('secondaryButtonText', e.target.value)}
            placeholder="e.g., Learn More"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
          />
        </FormField>

        <FormField label="Button Link">
          <input
            type="text"
            value={formData.secondaryButtonLink || ''}
            onChange={(e) => handleChange('secondaryButtonLink', e.target.value)}
            placeholder="e.g., /about"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors font-mono text-sm"
          />
        </FormField>
      </div>

      {/* General Styling */}
      <div className="space-y-4 p-4 bg-purple-900/20 border border-purple-500/30 rounded-xl">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          <h4 className="font-semibold text-purple-300">General Styling</h4>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Background Color">
            <input
              type="color"
              value={formData.style?.backgroundColor || '#10b981'}
              onChange={(e) => handleStyleChange(['style', 'backgroundColor'], e.target.value)}
              className="w-full h-12 rounded-lg border border-white/10 bg-white/5 cursor-pointer"
            />
          </FormField>

          <FormField label="Text Color">
            <input
              type="color"
              value={formData.style?.textColor || '#ffffff'}
              onChange={(e) => handleStyleChange(['style', 'textColor'], e.target.value)}
              className="w-full h-12 rounded-lg border border-white/10 bg-white/5 cursor-pointer"
            />
          </FormField>
        </div>

        <FormField label="Text Alignment">
          <div className="flex gap-2">
            {(['left', 'center', 'right'] as const).map((align) => (
              <button
                key={align}
                type="button"
                onClick={() => handleStyleChange(['style', 'textAlignment'], align)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  formData.style?.textAlignment === align
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/5 text-champagne hover:bg-white/10'
                }`}
              >
                {align.charAt(0).toUpperCase() + align.slice(1)}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Padding">
          <select
            value={formData.style?.padding || 'large'}
            onChange={(e) => handleStyleChange(['style', 'padding'], e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-purple-500"
          >
            <option value="small">Small (py-12)</option>
            <option value="medium">Medium (py-16)</option>
            <option value="large">Large (py-20)</option>
            <option value="extra-large">Extra Large (py-32)</option>
          </select>
        </FormField>

        <FormField label="Overlay Opacity (for background image)" helpText="0-100%">
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="100"
              value={formData.style?.overlayOpacity || 80}
              onChange={(e) => handleStyleChange(['style', 'overlayOpacity'], parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-champagne/60">
              <span>0%</span>
              <span className="text-champagne font-medium">{formData.style?.overlayOpacity || 80}%</span>
              <span>100%</span>
            </div>
          </div>
        </FormField>
      </div>

      {/* Primary Button Styling */}
      <div className="space-y-4 p-4 bg-jade/5 border border-jade/20 rounded-xl">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-jade" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
          <h4 className="font-semibold text-jade">Primary Button Styling</h4>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Background Color">
            <input
              type="color"
              value={formData.style?.primaryButton?.backgroundColor || '#ffffff'}
              onChange={(e) => handleStyleChange(['style', 'primaryButton', 'backgroundColor'], e.target.value)}
              className="w-full h-12 rounded-lg border border-white/10 bg-white/5 cursor-pointer"
            />
          </FormField>

          <FormField label="Text Color">
            <input
              type="color"
              value={formData.style?.primaryButton?.textColor || '#0f172a'}
              onChange={(e) => handleStyleChange(['style', 'primaryButton', 'textColor'], e.target.value)}
              className="w-full h-12 rounded-lg border border-white/10 bg-white/5 cursor-pointer"
            />
          </FormField>

          <FormField label="Hover Background">
            <input
              type="color"
              value={formData.style?.primaryButton?.hoverBackgroundColor || '#f5f3e7'}
              onChange={(e) => handleStyleChange(['style', 'primaryButton', 'hoverBackgroundColor'], e.target.value)}
              className="w-full h-12 rounded-lg border border-white/10 bg-white/5 cursor-pointer"
            />
          </FormField>

          <FormField label="Hover Text Color">
            <input
              type="color"
              value={formData.style?.primaryButton?.hoverTextColor || '#0f172a'}
              onChange={(e) => handleStyleChange(['style', 'primaryButton', 'hoverTextColor'], e.target.value)}
              className="w-full h-12 rounded-lg border border-white/10 bg-white/5 cursor-pointer"
            />
          </FormField>
        </div>

        <FormField label="Button Size">
          <select
            value={formData.style?.primaryButton?.size || 'medium'}
            onChange={(e) => handleStyleChange(['style', 'primaryButton', 'size'], e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade"
          >
            <option value="small">Small (px-6 py-2)</option>
            <option value="medium">Medium (px-8 py-4)</option>
            <option value="large">Large (px-10 py-5)</option>
          </select>
        </FormField>

        <FormField label="Button Style">
          <select
            value={formData.style?.primaryButton?.style || 'solid'}
            onChange={(e) => handleStyleChange(['style', 'primaryButton', 'style'], e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade"
          >
            <option value="solid">Solid</option>
            <option value="outline">Outline</option>
            <option value="ghost">Ghost</option>
          </select>
        </FormField>

        <FormField label="Border Radius">
          <select
            value={formData.style?.primaryButton?.borderRadius || 'full'}
            onChange={(e) => handleStyleChange(['style', 'primaryButton', 'borderRadius'], e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade"
          >
            <option value="none">None (0px)</option>
            <option value="small">Small (4px)</option>
            <option value="medium">Medium (8px)</option>
            <option value="large">Large (16px)</option>
            <option value="full">Full (9999px)</option>
          </select>
        </FormField>
      </div>

      {/* Secondary Button Styling */}
      <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-xl">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-champagne/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <h4 className="font-semibold text-champagne/70">Secondary Button Styling</h4>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Background Color">
            <input
              type="text"
              value={formData.style?.secondaryButton?.backgroundColor || 'rgba(255, 255, 255, 0.1)'}
              onChange={(e) => handleStyleChange(['style', 'secondaryButton', 'backgroundColor'], e.target.value)}
              placeholder="rgba(255, 255, 255, 0.1)"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade font-mono text-sm"
            />
          </FormField>

          <FormField label="Text Color">
            <input
              type="color"
              value={formData.style?.secondaryButton?.textColor || '#ffffff'}
              onChange={(e) => handleStyleChange(['style', 'secondaryButton', 'textColor'], e.target.value)}
              className="w-full h-12 rounded-lg border border-white/10 bg-white/5 cursor-pointer"
            />
          </FormField>

          <FormField label="Hover Background">
            <input
              type="text"
              value={formData.style?.secondaryButton?.hoverBackgroundColor || 'rgba(255, 255, 255, 0.2)'}
              onChange={(e) => handleStyleChange(['style', 'secondaryButton', 'hoverBackgroundColor'], e.target.value)}
              placeholder="rgba(255, 255, 255, 0.2)"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade font-mono text-sm"
            />
          </FormField>

          <FormField label="Hover Text Color">
            <input
              type="color"
              value={formData.style?.secondaryButton?.hoverTextColor || '#ffffff'}
              onChange={(e) => handleStyleChange(['style', 'secondaryButton', 'hoverTextColor'], e.target.value)}
              className="w-full h-12 rounded-lg border border-white/10 bg-white/5 cursor-pointer"
            />
          </FormField>
        </div>

        <FormField label="Button Size">
          <select
            value={formData.style?.secondaryButton?.size || 'medium'}
            onChange={(e) => handleStyleChange(['style', 'secondaryButton', 'size'], e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade"
          >
            <option value="small">Small (px-6 py-2)</option>
            <option value="medium">Medium (px-8 py-4)</option>
            <option value="large">Large (px-10 py-5)</option>
          </select>
        </FormField>

        <FormField label="Button Style">
          <select
            value={formData.style?.secondaryButton?.style || 'outline'}
            onChange={(e) => handleStyleChange(['style', 'secondaryButton', 'style'], e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade"
          >
            <option value="solid">Solid</option>
            <option value="outline">Outline</option>
            <option value="ghost">Ghost</option>
          </select>
        </FormField>

        <FormField label="Border Radius">
          <select
            value={formData.style?.secondaryButton?.borderRadius || 'full'}
            onChange={(e) => handleStyleChange(['style', 'secondaryButton', 'borderRadius'], e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade"
          >
            <option value="none">None (0px)</option>
            <option value="small">Small (4px)</option>
            <option value="medium">Medium (8px)</option>
            <option value="large">Large (16px)</option>
            <option value="full">Full (9999px)</option>
          </select>
        </FormField>
      </div>

      {/* Background Image */}
      <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PhotoIcon className="h-5 w-5 text-champagne/70" />
            <h4 className="font-semibold text-champagne/70">Background Image (Optional)</h4>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMediaSelector(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-champagne rounded-lg transition-colors text-sm"
              title="Select from media library"
            >
              <PhotoIcon className="h-4 w-4" />
              Library
            </button>
            <button
              type="button"
              onClick={() => setShowUploader(!showUploader)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-champagne rounded-lg transition-colors text-sm"
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
                placeholder="e.g., CTA background"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
              />
            </FormField>

            <div className="p-4 bg-jade/5 border border-jade/20 rounded-xl">
              <p className="text-xs text-jade mb-2">Image Preview</p>
              <div className="relative rounded-lg overflow-hidden border border-white/10">
                <img
                  src={formData.backgroundImage}
                  alt={formData.backgroundImageAlt || 'Preview'}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23374151" width="400" height="300"/%3E%3Ctext fill="%239CA3AF" font-family="sans-serif" font-size="18" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EImage not found%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          !showUploader && (
            <div className="text-center py-8 bg-white/5 rounded-xl border-2 border-dashed border-white/10">
              <PhotoIcon className="h-12 w-12 mx-auto text-champagne/30 mb-3" />
              <p className="text-champagne/50 text-sm">No background image selected</p>
              <p className="text-champagne/30 text-xs mt-1">Select from library or upload a new image</p>
            </div>
          )
        )}
      </div>

      {/* Media Selector Modal */}
      <MediaSelector
        isOpen={showMediaSelector}
        onClose={() => setShowMediaSelector(false)}
        onSelect={handleSelectImageFromLibrary}
        multiple={false}
        title="Select Background Image"
        description="Choose an image for the CTA background"
      />
    </div>
  );
}
