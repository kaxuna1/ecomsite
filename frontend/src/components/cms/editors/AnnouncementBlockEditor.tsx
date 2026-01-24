// Visual Editor for Announcement/Promotion Bar Block
import { useState, useEffect } from 'react';
import {
  MegaphoneIcon,
  TruckIcon,
  TagIcon,
  GiftIcon,
  SparklesIcon,
  StarIcon,
  FireIcon,
  BoltIcon,
  TicketIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import FormField from './FormField';
import type { AnnouncementContent, BlockTargeting, PageType } from '../../../types/cms';

interface AnnouncementBlockEditorProps {
  content: AnnouncementContent;
  onChange: (content: AnnouncementContent) => void;
  settings?: { targeting?: BlockTargeting };
  onSettingsChange?: (settings: { targeting?: BlockTargeting }) => void;
}

const ICONS = [
  { id: 'truck', name: 'Truck (Shipping)', Icon: TruckIcon },
  { id: 'tag', name: 'Tag (Sale)', Icon: TagIcon },
  { id: 'gift', name: 'Gift (Promo)', Icon: GiftIcon },
  { id: 'sparkles', name: 'Sparkles', Icon: SparklesIcon },
  { id: 'megaphone', name: 'Megaphone', Icon: MegaphoneIcon },
  { id: 'star', name: 'Star', Icon: StarIcon },
  { id: 'fire', name: 'Fire (Hot)', Icon: FireIcon },
  { id: 'bolt', name: 'Lightning', Icon: BoltIcon },
  { id: 'ticket', name: 'Ticket', Icon: TicketIcon },
];

const PAGE_TYPES: { id: PageType; label: string }[] = [
  { id: 'home', label: 'Homepage' },
  { id: 'products', label: 'Products List' },
  { id: 'productDetail', label: 'Product Detail' },
  { id: 'cms', label: 'CMS Pages' },
  { id: 'cart', label: 'Cart' },
  { id: 'checkout', label: 'Checkout' },
  { id: 'account', label: 'Account' },
];

export default function AnnouncementBlockEditor({
  content,
  onChange,
  settings,
  onSettingsChange
}: AnnouncementBlockEditorProps) {
  const [formData, setFormData] = useState<AnnouncementContent>({
    type: 'announcement',
    message: '',
    linkText: '',
    linkUrl: '',
    icon: 'truck',
    backgroundColor: '#1e293b',
    textColor: '#ffffff',
    dismissible: false,
    ...content,
  });

  const [targeting, setTargeting] = useState<BlockTargeting>({
    enabled: false,
    include: {
      pageTypes: [],
      routePrefixes: [],
      cmsSlugs: [],
    },
    ...settings?.targeting,
  });

  const [newRoutePrefix, setNewRoutePrefix] = useState('');
  const [newCmsSlug, setNewCmsSlug] = useState('');

  useEffect(() => {
    setFormData({
      type: 'announcement',
      message: '',
      linkText: '',
      linkUrl: '',
      icon: 'truck',
      backgroundColor: '#1e293b',
      textColor: '#ffffff',
      dismissible: false,
      ...content,
    });
    setTargeting({
      enabled: false,
      include: {
        pageTypes: [],
        routePrefixes: [],
        cmsSlugs: [],
      },
      ...settings?.targeting,
    });
  }, [content, settings]);

  const handleChange = (field: keyof AnnouncementContent, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
  };

  const handleTargetingChange = (newTargeting: BlockTargeting) => {
    setTargeting(newTargeting);
    onSettingsChange?.({ targeting: newTargeting });
  };

  const togglePageType = (pageType: PageType) => {
    const current = targeting.include?.pageTypes || [];
    const updated = current.includes(pageType)
      ? current.filter((pt) => pt !== pageType)
      : [...current, pageType];

    handleTargetingChange({
      ...targeting,
      include: {
        ...targeting.include,
        pageTypes: updated,
      },
    });
  };

  const addRoutePrefix = () => {
    if (!newRoutePrefix.trim()) return;
    const current = targeting.include?.routePrefixes || [];
    if (!current.includes(newRoutePrefix.trim())) {
      handleTargetingChange({
        ...targeting,
        include: {
          ...targeting.include,
          routePrefixes: [...current, newRoutePrefix.trim()],
        },
      });
    }
    setNewRoutePrefix('');
  };

  const removeRoutePrefix = (prefix: string) => {
    const current = targeting.include?.routePrefixes || [];
    handleTargetingChange({
      ...targeting,
      include: {
        ...targeting.include,
        routePrefixes: current.filter((p) => p !== prefix),
      },
    });
  };

  const addCmsSlug = () => {
    if (!newCmsSlug.trim()) return;
    const current = targeting.include?.cmsSlugs || [];
    if (!current.includes(newCmsSlug.trim())) {
      handleTargetingChange({
        ...targeting,
        include: {
          ...targeting.include,
          cmsSlugs: [...current, newCmsSlug.trim()],
        },
      });
    }
    setNewCmsSlug('');
  };

  const removeCmsSlug = (slug: string) => {
    const current = targeting.include?.cmsSlugs || [];
    handleTargetingChange({
      ...targeting,
      include: {
        ...targeting.include,
        cmsSlugs: current.filter((s) => s !== slug),
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-white/10">
        <div className="p-2 bg-amber-500/20 rounded-lg">
          <MegaphoneIcon className="h-6 w-6 text-amber-400" />
        </div>
        <div>
          <h3 className="font-display text-lg text-champagne">Announcement Bar</h3>
          <p className="text-sm text-champagne/60">Promotional banner for header</p>
        </div>
      </div>

      {/* Content Section */}
      <div className="space-y-4">
        <FormField label="Message" required>
          <input
            type="text"
            value={formData.message}
            onChange={(e) => handleChange('message', e.target.value)}
            placeholder="e.g., FREE SHIPPING OVER $50 | NEW CUSTOMER? GET 10% OFF"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Link Text" helpText="Optional CTA">
            <input
              type="text"
              value={formData.linkText || ''}
              onChange={(e) => handleChange('linkText', e.target.value)}
              placeholder="e.g., Shop Now"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors"
            />
          </FormField>

          <FormField label="Link URL">
            <input
              type="text"
              value={formData.linkUrl || ''}
              onChange={(e) => handleChange('linkUrl', e.target.value)}
              placeholder="e.g., /products"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade transition-colors font-mono text-sm"
            />
          </FormField>
        </div>
      </div>

      {/* Icon Selection */}
      <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-xl">
        <FormField label="Icon">
          <div className="grid grid-cols-5 gap-2">
            {ICONS.map(({ id, name, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleChange('icon', id)}
                title={name}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-all ${
                  formData.icon === id
                    ? 'bg-jade text-midnight ring-2 ring-jade'
                    : 'bg-white/5 text-champagne hover:bg-white/10'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs truncate">{name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </FormField>
      </div>

      {/* Styling */}
      <div className="space-y-4 p-4 bg-purple-900/20 border border-purple-500/30 rounded-xl">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          <h4 className="font-semibold text-purple-300">Styling</h4>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Background Color">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.backgroundColor || '#1e293b'}
                onChange={(e) => handleChange('backgroundColor', e.target.value)}
                className="h-12 w-16 rounded-lg border border-white/10 bg-white/5 cursor-pointer"
              />
              <input
                type="text"
                value={formData.backgroundColor || '#1e293b'}
                onChange={(e) => handleChange('backgroundColor', e.target.value)}
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne font-mono text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
          </FormField>

          <FormField label="Text Color">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.textColor || '#ffffff'}
                onChange={(e) => handleChange('textColor', e.target.value)}
                className="h-12 w-16 rounded-lg border border-white/10 bg-white/5 cursor-pointer"
              />
              <input
                type="text"
                value={formData.textColor || '#ffffff'}
                onChange={(e) => handleChange('textColor', e.target.value)}
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne font-mono text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
          </FormField>
        </div>

        {/* Preview */}
        <div className="mt-4">
          <p className="text-xs text-purple-400 mb-2">Preview</p>
          <div
            className="rounded-lg py-2 px-4 text-center text-sm font-medium"
            style={{
              backgroundColor: formData.backgroundColor || '#1e293b',
              color: formData.textColor || '#ffffff',
            }}
          >
            <div className="flex items-center justify-center gap-2">
              {(() => {
                const IconComponent = ICONS.find((i) => i.id === formData.icon)?.Icon || TruckIcon;
                return <IconComponent className="h-4 w-4" />;
              })()}
              <span>{formData.message || 'Your announcement message here'}</span>
              {formData.linkText && (
                <>
                  <span className="opacity-60">|</span>
                  <span className="underline">{formData.linkText}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Behavior */}
      <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-xl">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-champagne/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h4 className="font-semibold text-champagne/70">Behavior</h4>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.dismissible || false}
            onChange={(e) => handleChange('dismissible', e.target.checked)}
            className="h-5 w-5 rounded border-white/30 bg-white/10 text-jade focus:ring-jade cursor-pointer"
          />
          <div>
            <span className="text-champagne">Allow users to dismiss</span>
            <p className="text-xs text-champagne/50">Dismissal is stored in localStorage per block</p>
          </div>
        </label>
      </div>

      {/* Targeting Section */}
      <div className="space-y-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h4 className="font-semibold text-blue-300">Page Targeting</h4>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm text-champagne/70">Enable targeting</span>
            <input
              type="checkbox"
              checked={targeting.enabled}
              onChange={(e) =>
                handleTargetingChange({ ...targeting, enabled: e.target.checked })
              }
              className="h-5 w-5 rounded border-white/30 bg-white/10 text-blue-500 focus:ring-blue-500 cursor-pointer"
            />
          </label>
        </div>

        {!targeting.enabled && (
          <p className="text-sm text-champagne/50">
            When disabled, this announcement will show on all pages.
          </p>
        )}

        {targeting.enabled && (
          <div className="space-y-4">
            {/* Page Types */}
            <FormField label="Show on page types" helpText="Select which page types to show this on">
              <div className="flex flex-wrap gap-2">
                {PAGE_TYPES.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => togglePageType(id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      targeting.include?.pageTypes?.includes(id)
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/5 text-champagne hover:bg-white/10'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </FormField>

            {/* Route Prefixes */}
            <FormField label="Route prefixes" helpText="Match URLs starting with these paths">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRoutePrefix}
                    onChange={(e) => setNewRoutePrefix(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRoutePrefix())}
                    placeholder="/en/products"
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne font-mono text-sm placeholder-champagne/30 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addRoutePrefix}
                    className="px-3 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors"
                  >
                    <PlusIcon className="h-5 w-5" />
                  </button>
                </div>
                {(targeting.include?.routePrefixes?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {targeting.include?.routePrefixes?.map((prefix) => (
                      <span
                        key={prefix}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-sm font-mono"
                      >
                        {prefix}
                        <button
                          type="button"
                          onClick={() => removeRoutePrefix(prefix)}
                          className="hover:text-red-400 transition-colors"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </FormField>

            {/* CMS Slugs */}
            <FormField label="CMS page slugs" helpText="Show only on specific CMS pages">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCmsSlug}
                    onChange={(e) => setNewCmsSlug(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCmsSlug())}
                    placeholder="about-us"
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne font-mono text-sm placeholder-champagne/30 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addCmsSlug}
                    className="px-3 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors"
                  >
                    <PlusIcon className="h-5 w-5" />
                  </button>
                </div>
                {(targeting.include?.cmsSlugs?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {targeting.include?.cmsSlugs?.map((slug) => (
                      <span
                        key={slug}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-sm font-mono"
                      >
                        {slug}
                        <button
                          type="button"
                          onClick={() => removeCmsSlug(slug)}
                          className="hover:text-red-400 transition-colors"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </FormField>
          </div>
        )}
      </div>
    </div>
  );
}
