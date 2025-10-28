// Visual Editor for Footer Settings
import { useState, useEffect } from 'react';
import {
  PlusIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import FormField from './FormField';
import ColorPicker, { ColorSchemePicker } from './ColorPicker';
import type {
  FooterSettings,
  FooterColumn,
  FooterContactInfo,
  FooterSocialLink
} from '../../../api/cmsAdmin';

const LAYOUT_TYPES = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and simple footer',
    preview: '▬',
    bestFor: 'Startups, Modern brands'
  },
  {
    id: 'multi-column',
    name: 'Multi-Column',
    description: 'Traditional footer with columns',
    preview: '▦',
    bestFor: 'E-commerce, Content sites'
  },
  {
    id: 'centered',
    name: 'Centered',
    description: 'Symmetric centered layout',
    preview: '◈',
    bestFor: 'Portfolios, Agencies'
  },
  {
    id: 'mega',
    name: 'Mega Footer',
    description: 'Large footer with all info',
    preview: '▩',
    bestFor: 'Enterprise, Large sites'
  }
];

const SOCIAL_PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: '📷' },
  { id: 'facebook', name: 'Facebook', icon: '📘' },
  { id: 'twitter', name: 'Twitter', icon: '🐦' },
  { id: 'youtube', name: 'YouTube', icon: '📹' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
  { id: 'pinterest', name: 'Pinterest', icon: '📌' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵' }
];

interface FooterEditorProps {
  footer: FooterSettings;
  onChange: (footer: Partial<FooterSettings>) => void;
  onSave: () => void;
  isSaving?: boolean;
}

export default function FooterEditor({ footer, onChange, onSave, isSaving }: FooterEditorProps) {
  const [formData, setFormData] = useState<FooterSettings>(footer);
  const [showStyleControls, setShowStyleControls] = useState(false);

  useEffect(() => {
    setFormData(footer);
  }, [footer]);

  const handleChange = (field: keyof FooterSettings, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange({ [field]: value });
  };

  const handleColorScheme = (colors: { primary: string; secondary: string; accent: string; text: string }) => {
    const updates = {
      backgroundColor: colors.primary,
      accentColor: colors.accent,
      textColor: colors.text
    };
    setFormData({ ...formData, ...updates });
    onChange(updates);
  };

  // Column Management
  const addColumn = () => {
    const newColumn: FooterColumn = {
      title: 'New Section',
      links: []
    };
    const updated = [...formData.footerColumns, newColumn];
    handleChange('footerColumns', updated);
  };

  const removeColumn = (index: number) => {
    const updated = formData.footerColumns.filter((_, i) => i !== index);
    handleChange('footerColumns', updated);
  };

  const updateColumn = (index: number, field: keyof FooterColumn, value: any) => {
    const updated = [...formData.footerColumns];
    updated[index] = { ...updated[index], [field]: value };
    handleChange('footerColumns', updated);
  };

  const addLinkToColumn = (columnIndex: number) => {
    const updated = [...formData.footerColumns];
    updated[columnIndex].links.push({
      label: 'New Link',
      url: '/',
      is_external: false
    });
    handleChange('footerColumns', updated);
  };

  const removeLinkFromColumn = (columnIndex: number, linkIndex: number) => {
    const updated = [...formData.footerColumns];
    updated[columnIndex].links = updated[columnIndex].links.filter((_, i) => i !== linkIndex);
    handleChange('footerColumns', updated);
  };

  const updateLink = (columnIndex: number, linkIndex: number, field: string, value: any) => {
    const updated = [...formData.footerColumns];
    updated[columnIndex].links[linkIndex] = {
      ...updated[columnIndex].links[linkIndex],
      [field]: value
    };
    handleChange('footerColumns', updated);
  };

  // Social Links Management
  const updateSocialLink = (index: number, field: keyof FooterSocialLink, value: any) => {
    const updated = [...formData.socialLinks];
    updated[index] = { ...updated[index], [field]: value };
    handleChange('socialLinks', updated);
  };

  const addSocialLink = () => {
    const newLink: FooterSocialLink = {
      platform: 'instagram',
      url: '',
      icon: 'instagram',
      is_enabled: true
    };
    handleChange('socialLinks', [...formData.socialLinks, newLink]);
  };

  const removeSocialLink = (index: number) => {
    const updated = formData.socialLinks.filter((_, i) => i !== index);
    handleChange('socialLinks', updated);
  };

  // Contact Info Management
  const updateContactInfo = (path: string, value: any) => {
    const updated = { ...formData.contactInfo };
    const keys = path.split('.');

    if (keys.length === 1) {
      updated[keys[0] as keyof FooterContactInfo] = value;
    } else if (keys.length === 2 && keys[0] === 'address' && updated.address) {
      updated.address = { ...updated.address, [keys[1]]: value };
    }

    handleChange('contactInfo', updated);
  };

  // Bottom Links Management
  const addBottomLink = () => {
    const updated = [...(formData.bottomLinks || []), { label: 'New Link', url: '/' }];
    handleChange('bottomLinks', updated);
  };

  const removeBottomLink = (index: number) => {
    const updated = formData.bottomLinks.filter((_, i) => i !== index);
    handleChange('bottomLinks', updated);
  };

  const updateBottomLink = (index: number, field: string, value: string) => {
    const updated = [...formData.bottomLinks];
    updated[index] = { ...updated[index], [field]: value };
    handleChange('bottomLinks', updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-jade/20 rounded-lg">
            <svg className="h-6 w-6 text-jade" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <div>
            <h3 className="font-display text-lg text-champagne">Footer Settings</h3>
            <p className="text-sm text-champagne/60">Customize your site footer</p>
          </div>
        </div>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-6 py-3 bg-jade text-midnight rounded-lg hover:bg-jade/90 transition-colors font-semibold disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Layout Type Selector */}
      <div className="space-y-3">
        <FormField label="Footer Layout" helpText="Choose a layout style for your footer">
          <div className="grid grid-cols-2 gap-3">
            {LAYOUT_TYPES.map((layout) => (
              <button
                key={layout.id}
                type="button"
                onClick={() => handleChange('layoutType', layout.id)}
                className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                  formData.layoutType === layout.id
                    ? 'border-jade bg-jade/10 shadow-lg'
                    : 'border-white/10 bg-white/5 hover:border-jade/50 hover:bg-white/10'
                }`}
              >
                {formData.layoutType === layout.id && (
                  <div className="absolute top-2 right-2 p-1 bg-jade rounded-full">
                    <CheckIcon className="h-3 w-3 text-midnight" />
                  </div>
                )}
                <div className="text-3xl mb-2">{layout.preview}</div>
                <h4 className="font-semibold text-champagne text-sm">{layout.name}</h4>
                <p className="text-xs text-champagne/60 mt-1">{layout.description}</p>
                <div className="mt-2 px-2 py-1 bg-jade/20 text-jade rounded text-xs">
                  {layout.bestFor}
                </div>
              </button>
            ))}
          </div>
        </FormField>
      </div>

      {/* Brand Settings */}
      <div className="space-y-4 p-6 bg-white/5 rounded-xl border border-white/10">
        <h4 className="font-display text-champagne flex items-center gap-2">
          <span className="text-jade">●</span> Brand Information
        </h4>

        <FormField label="Brand Name" required>
          <input
            type="text"
            value={formData.brandName}
            onChange={(e) => handleChange('brandName', e.target.value)}
            placeholder="Your Brand Name"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
          />
        </FormField>

        <FormField label="Brand Tagline" helpText="Optional tagline or description">
          <input
            type="text"
            value={formData.brandTagline || ''}
            onChange={(e) => handleChange('brandTagline', e.target.value)}
            placeholder="Luxury products crafted with care"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
          />
        </FormField>
      </div>

      {/* Footer Columns */}
      <div className="space-y-4 p-6 bg-white/5 rounded-xl border border-white/10">
        <div className="flex items-center justify-between">
          <h4 className="font-display text-champagne flex items-center gap-2">
            <span className="text-jade">●</span> Footer Columns
          </h4>
          <button
            onClick={addColumn}
            className="px-3 py-2 bg-jade/20 text-jade rounded-lg hover:bg-jade/30 transition-colors text-sm font-semibold flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            Add Column
          </button>
        </div>

        <div className="space-y-4">
          {formData.footerColumns.map((column, columnIndex) => (
            <div key={columnIndex} className="p-4 bg-midnight/50 rounded-lg border border-white/10">
              <div className="flex items-start justify-between mb-3">
                <input
                  type="text"
                  value={column.title}
                  onChange={(e) => updateColumn(columnIndex, 'title', e.target.value)}
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne font-semibold focus:outline-none focus:border-jade"
                  placeholder="Column Title"
                />
                <button
                  onClick={() => removeColumn(columnIndex)}
                  className="ml-2 p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2 mb-3">
                {column.links.map((link, linkIndex) => (
                  <div key={linkIndex} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => updateLink(columnIndex, linkIndex, 'label', e.target.value)}
                      placeholder="Link Label"
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne text-sm focus:outline-none focus:border-jade"
                    />
                    <input
                      type="text"
                      value={link.url}
                      onChange={(e) => updateLink(columnIndex, linkIndex, 'url', e.target.value)}
                      placeholder="/url"
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne text-sm focus:outline-none focus:border-jade"
                    />
                    <button
                      onClick={() => removeLinkFromColumn(columnIndex, linkIndex)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => addLinkToColumn(columnIndex)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 border-dashed rounded-lg text-champagne/60 hover:text-champagne hover:border-jade/50 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Add Link
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4 p-6 bg-white/5 rounded-xl border border-white/10">
        <h4 className="font-display text-champagne flex items-center gap-2">
          <span className="text-jade">●</span> Contact Information
        </h4>

        <div className="space-y-3">
          <FormField label="Address Label">
            <input
              type="text"
              value={formData.contactInfo?.address?.label || ''}
              onChange={(e) => updateContactInfo('address.label', e.target.value)}
              placeholder="Visit Us"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade"
            />
          </FormField>

          <FormField label="Street Address">
            <input
              type="text"
              value={formData.contactInfo?.address?.street || ''}
              onChange={(e) => updateContactInfo('address.street', e.target.value)}
              placeholder="88 Crown Street"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="City">
              <input
                type="text"
                value={formData.contactInfo?.address?.city || ''}
                onChange={(e) => updateContactInfo('address.city', e.target.value)}
                placeholder="New York, NY 10013"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade"
              />
            </FormField>

            <FormField label="Country">
              <input
                type="text"
                value={formData.contactInfo?.address?.country || ''}
                onChange={(e) => updateContactInfo('address.country', e.target.value)}
                placeholder="United States"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Email">
              <input
                type="email"
                value={formData.contactInfo?.email || ''}
                onChange={(e) => updateContactInfo('email', e.target.value)}
                placeholder="hello@example.com"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade"
              />
            </FormField>

            <FormField label="Phone">
              <input
                type="tel"
                value={formData.contactInfo?.phone || ''}
                onChange={(e) => updateContactInfo('phone', e.target.value)}
                placeholder="(212) 555-0199"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade"
              />
            </FormField>
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="space-y-4 p-6 bg-white/5 rounded-xl border border-white/10">
        <div className="flex items-center justify-between">
          <h4 className="font-display text-champagne flex items-center gap-2">
            <span className="text-jade">●</span> Social Media Links
          </h4>
          <button
            onClick={addSocialLink}
            className="px-3 py-2 bg-jade/20 text-jade rounded-lg hover:bg-jade/30 transition-colors text-sm font-semibold flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            Add Social
          </button>
        </div>

        <div className="space-y-3">
          {formData.socialLinks.map((social, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-midnight/50 rounded-lg border border-white/10">
              <select
                value={social.platform}
                onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade"
              >
                {SOCIAL_PLATFORMS.map((platform) => (
                  <option key={platform.id} value={platform.id} className="bg-midnight">
                    {platform.icon} {platform.name}
                  </option>
                ))}
              </select>
              <input
                type="url"
                value={social.url}
                onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade"
              />
              <button
                onClick={() => updateSocialLink(index, 'is_enabled', !social.is_enabled)}
                className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                  social.is_enabled
                    ? 'bg-jade text-midnight'
                    : 'bg-white/5 text-champagne/50'
                }`}
              >
                {social.is_enabled ? 'Enabled' : 'Disabled'}
              </button>
              <button
                onClick={() => removeSocialLink(index)}
                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter Settings */}
      <div className="space-y-4 p-6 bg-white/5 rounded-xl border border-white/10">
        <div className="flex items-center justify-between">
          <h4 className="font-display text-champagne flex items-center gap-2">
            <span className="text-jade">●</span> Newsletter Section
          </h4>
          <button
            onClick={() => handleChange('newsletterEnabled', !formData.newsletterEnabled)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              formData.newsletterEnabled
                ? 'bg-jade text-midnight'
                : 'bg-white/5 text-champagne/50'
            }`}
          >
            {formData.newsletterEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {formData.newsletterEnabled && (
          <div className="space-y-3">
            <FormField label="Newsletter Title">
              <input
                type="text"
                value={formData.newsletterTitle}
                onChange={(e) => handleChange('newsletterTitle', e.target.value)}
                placeholder="Stay Connected"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade"
              />
            </FormField>

            <FormField label="Newsletter Description">
              <textarea
                value={formData.newsletterDescription}
                onChange={(e) => handleChange('newsletterDescription', e.target.value)}
                placeholder="Subscribe to receive exclusive offers..."
                rows={2}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade resize-none"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Input Placeholder">
                <input
                  type="text"
                  value={formData.newsletterPlaceholder}
                  onChange={(e) => handleChange('newsletterPlaceholder', e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade"
                />
              </FormField>

              <FormField label="Button Text">
                <input
                  type="text"
                  value={formData.newsletterButtonText}
                  onChange={(e) => handleChange('newsletterButtonText', e.target.value)}
                  placeholder="Subscribe"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade"
                />
              </FormField>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div className="space-y-4 p-6 bg-white/5 rounded-xl border border-white/10">
        <h4 className="font-display text-champagne flex items-center gap-2">
          <span className="text-jade">●</span> Bottom Section
        </h4>

        <FormField label="Copyright Text">
          <input
            type="text"
            value={formData.copyrightText || ''}
            onChange={(e) => handleChange('copyrightText', e.target.value)}
            placeholder="Crafted with care"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade"
          />
        </FormField>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-champagne">Legal Links</label>
            <button
              onClick={addBottomLink}
              className="px-3 py-1 bg-jade/20 text-jade rounded-lg hover:bg-jade/30 transition-colors text-xs font-semibold flex items-center gap-1"
            >
              <PlusIcon className="h-3 w-3" />
              Add Link
            </button>
          </div>

          <div className="space-y-2">
            {formData.bottomLinks.map((link, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => updateBottomLink(index, 'label', e.target.value)}
                  placeholder="Link Label"
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne text-sm focus:outline-none focus:border-jade"
                />
                <input
                  type="text"
                  value={link.url}
                  onChange={(e) => updateBottomLink(index, 'url', e.target.value)}
                  placeholder="/url"
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne text-sm focus:outline-none focus:border-jade"
                />
                <button
                  onClick={() => removeBottomLink(index)}
                  className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

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
              <p className="text-xs text-champagne/60">Customize colors and layout options</p>
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
            <div className="grid grid-cols-3 gap-4">
              <ColorPicker
                label="Background Color"
                value={formData.backgroundColor}
                onChange={(color) => handleChange('backgroundColor', color)}
              />
              <ColorPicker
                label="Text Color"
                value={formData.textColor}
                onChange={(color) => handleChange('textColor', color)}
              />
              <ColorPicker
                label="Accent Color"
                value={formData.accentColor}
                onChange={(color) => handleChange('accentColor', color)}
              />
            </div>

            {/* Layout Options */}
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Columns Count">
                <select
                  value={formData.columnsCount}
                  onChange={(e) => handleChange('columnsCount', parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade"
                >
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num} className="bg-midnight">
                      {num} {num === 1 ? 'Column' : 'Columns'}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Show Dividers">
                <button
                  type="button"
                  onClick={() => handleChange('showDividers', !formData.showDividers)}
                  className={`w-full px-4 py-3 rounded-lg font-medium transition-all ${
                    formData.showDividers
                      ? 'bg-jade text-midnight'
                      : 'bg-white/5 text-champagne hover:bg-white/10'
                  }`}
                >
                  {formData.showDividers ? 'Enabled' : 'Disabled'}
                </button>
              </FormField>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
