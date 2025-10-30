// Block Translation Editor - Visual UI for translating block content
import { useState, useEffect } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import FormField from '../cms/editors/FormField';
import toast from 'react-hot-toast';

// Import AI translation if needed for individual blocks
// import { translateBlockContent } from '../../api/ai';

interface BlockTranslationEditorProps {
  blockType: string;
  sourceContent: any;
  translationContent: any;
  sourceLanguage: string;
  targetLanguage: string;
  onChange: (content: any) => void;
  onAITranslate?: () => void;
  isTranslating?: boolean;
}

export default function BlockTranslationEditor({
  blockType,
  sourceContent,
  translationContent,
  sourceLanguage,
  targetLanguage,
  onChange,
  onAITranslate,
  isTranslating = false
}: BlockTranslationEditorProps) {
  const [formData, setFormData] = useState<any>(translationContent || {});

  useEffect(() => {
    setFormData(translationContent || {});
  }, [translationContent]);

  const handleChange = (path: string, value: any) => {
    const keys = path.split('.');
    const updated = { ...formData };

    let current = updated;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;

    setFormData(updated);
    onChange(updated);
  };

  const handleArrayChange = (arrayPath: string, index: number, field: string, value: any) => {
    const updated = { ...formData };
    const keys = arrayPath.split('.');

    let current = updated;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    const arrayKey = keys[keys.length - 1];
    if (!current[arrayKey]) {
      current[arrayKey] = [];
    }
    if (!current[arrayKey][index]) {
      current[arrayKey][index] = {};
    }
    current[arrayKey][index][field] = value;

    setFormData(updated);
    onChange(updated);
  };

  const getSourceValue = (path: string): any => {
    const keys = path.split('.');
    let current = sourceContent;
    for (const key of keys) {
      if (current && typeof current === 'object') {
        current = current[key];
      } else {
        return undefined;
      }
    }
    return current;
  };

  const renderHeroEditor = () => {
    const sourceHeadline = sourceContent?.headline || '';
    const sourceSubheadline = sourceContent?.subheadline || '';
    const sourceDescription = sourceContent?.description || '';
    const sourceCta = sourceContent?.ctaText || '';

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <div className="p-2 bg-blush/20 rounded-lg">
            <svg className="h-6 w-6 text-blush" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <div>
            <h3 className="font-display text-lg text-champagne">Hero Block Translation</h3>
            <p className="text-sm text-champagne/60">Translate hero section content</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Source Column */}
          <div className="space-y-4">
            <h4 className="font-semibold text-champagne/70 text-sm uppercase tracking-wider">
              Source ({sourceLanguage.toUpperCase()})
            </h4>

            <div>
              <label className="block text-xs text-champagne/50 mb-2">Headline</label>
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-champagne text-sm">
                {sourceHeadline}
              </div>
            </div>

            <div>
              <label className="block text-xs text-champagne/50 mb-2">Subheadline</label>
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-champagne text-sm">
                {sourceSubheadline}
              </div>
            </div>

            {sourceDescription && (
              <div>
                <label className="block text-xs text-champagne/50 mb-2">Description</label>
                <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-champagne text-sm">
                  {sourceDescription}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-champagne/50 mb-2">CTA Button Text</label>
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-champagne text-sm">
                {sourceCta}
              </div>
            </div>
          </div>

          {/* Translation Column */}
          <div className="space-y-4">
            <h4 className="font-semibold text-champagne/70 text-sm uppercase tracking-wider">
              Translation ({targetLanguage.toUpperCase()})
            </h4>

            <FormField label="Headline">
              <input
                type="text"
                value={formData.headline || ''}
                onChange={(e) => handleChange('headline', e.target.value)}
                placeholder={sourceHeadline}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-blush transition-colors"
              />
            </FormField>

            <FormField label="Subheadline">
              <input
                type="text"
                value={formData.subheadline || ''}
                onChange={(e) => handleChange('subheadline', e.target.value)}
                placeholder={sourceSubheadline}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-blush transition-colors"
              />
            </FormField>

            {sourceDescription && (
              <FormField label="Description">
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder={sourceDescription}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-blush transition-colors resize-none"
                />
              </FormField>
            )}

            <FormField label="CTA Button Text">
              <input
                type="text"
                value={formData.ctaText || ''}
                onChange={(e) => handleChange('ctaText', e.target.value)}
                placeholder={sourceCta}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-blush transition-colors"
              />
            </FormField>
          </div>
        </div>
      </div>
    );
  };

  const renderTextImageEditor = () => {
    const sourceTitle = sourceContent?.title || '';
    const sourceContentText = sourceContent?.content || '';
    const sourceImageAlt = sourceContent?.imageAlt || '';

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <div className="p-2 bg-jade/20 rounded-lg">
            <svg className="h-6 w-6 text-jade" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-display text-lg text-champagne">Text + Image Block Translation</h3>
            <p className="text-sm text-champagne/60">Translate content and image descriptions</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Source Column */}
          <div className="space-y-4">
            <h4 className="font-semibold text-champagne/70 text-sm uppercase tracking-wider">
              Source ({sourceLanguage.toUpperCase()})
            </h4>

            <div>
              <label className="block text-xs text-champagne/50 mb-2">Title</label>
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-champagne text-sm">
                {sourceTitle}
              </div>
            </div>

            <div>
              <label className="block text-xs text-champagne/50 mb-2">Content</label>
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-champagne text-sm whitespace-pre-wrap">
                {sourceContentText}
              </div>
            </div>

            {sourceImageAlt && (
              <div>
                <label className="block text-xs text-champagne/50 mb-2">Image Alt Text</label>
                <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-champagne text-sm">
                  {sourceImageAlt}
                </div>
              </div>
            )}
          </div>

          {/* Translation Column */}
          <div className="space-y-4">
            <h4 className="font-semibold text-champagne/70 text-sm uppercase tracking-wider">
              Translation ({targetLanguage.toUpperCase()})
            </h4>

            <FormField label="Title">
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder={sourceTitle}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-blush transition-colors"
              />
            </FormField>

            <FormField label="Content">
              <textarea
                value={formData.content || ''}
                onChange={(e) => handleChange('content', e.target.value)}
                placeholder={sourceContentText}
                rows={6}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-blush transition-colors resize-none"
              />
            </FormField>

            {sourceImageAlt && (
              <FormField label="Image Alt Text">
                <input
                  type="text"
                  value={formData.imageAlt || ''}
                  onChange={(e) => handleChange('imageAlt', e.target.value)}
                  placeholder={sourceImageAlt}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-blush transition-colors"
                />
              </FormField>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderFeaturesEditor = () => {
    const sourceTitle = sourceContent?.title || '';
    const sourceSubtitle = sourceContent?.subtitle || '';
    const sourceFeatures = sourceContent?.features || [];

    // Ensure formData has features array
    if (!formData.features) {
      formData.features = sourceFeatures.map(() => ({}));
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <div className="p-2 bg-coral/20 rounded-lg">
            <svg className="h-6 w-6 text-coral" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <div>
            <h3 className="font-display text-lg text-champagne">Features Block Translation</h3>
            <p className="text-sm text-champagne/60">Translate feature titles and descriptions</p>
          </div>
        </div>

        {/* Header Fields */}
        <div className="grid grid-cols-2 gap-6 pb-6 border-b border-white/10">
          <div className="space-y-4">
            <h4 className="font-semibold text-champagne/70 text-sm uppercase tracking-wider">
              Source ({sourceLanguage.toUpperCase()})
            </h4>

            <div>
              <label className="block text-xs text-champagne/50 mb-2">Title</label>
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-champagne text-sm">
                {sourceTitle}
              </div>
            </div>

            {sourceSubtitle && (
              <div>
                <label className="block text-xs text-champagne/50 mb-2">Subtitle</label>
                <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-champagne text-sm">
                  {sourceSubtitle}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-champagne/70 text-sm uppercase tracking-wider">
              Translation ({targetLanguage.toUpperCase()})
            </h4>

            <FormField label="Title">
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder={sourceTitle}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-blush transition-colors"
              />
            </FormField>

            {sourceSubtitle && (
              <FormField label="Subtitle">
                <input
                  type="text"
                  value={formData.subtitle || ''}
                  onChange={(e) => handleChange('subtitle', e.target.value)}
                  placeholder={sourceSubtitle}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-blush transition-colors"
                />
              </FormField>
            )}
          </div>
        </div>

        {/* Features List */}
        <div className="space-y-4">
          <h4 className="font-semibold text-champagne text-sm">Features ({sourceFeatures.length})</h4>

          {sourceFeatures.map((feature: any, index: number) => (
            <div key={feature.id || index} className="grid grid-cols-2 gap-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-champagne/50">Feature #{index + 1}</span>
                  <span className="text-lg">{feature.icon}</span>
                </div>

                <div>
                  <label className="block text-xs text-champagne/50 mb-1">Title</label>
                  <div className="p-2 bg-white/5 border border-white/10 rounded text-champagne text-sm">
                    {feature.title}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-champagne/50 mb-1">Description</label>
                  <div className="p-2 bg-white/5 border border-white/10 rounded text-champagne text-sm">
                    {feature.description}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="h-6 mb-2" /> {/* Spacer */}

                <div>
                  <label className="block text-xs text-champagne/50 mb-1">Translated Title</label>
                  <input
                    type="text"
                    value={formData.features?.[index]?.title || ''}
                    onChange={(e) => handleArrayChange('features', index, 'title', e.target.value)}
                    placeholder={feature.title}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-champagne placeholder-champagne/30 focus:outline-none focus:border-blush transition-colors text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-champagne/50 mb-1">Translated Description</label>
                  <textarea
                    value={formData.features?.[index]?.description || ''}
                    onChange={(e) => handleArrayChange('features', index, 'description', e.target.value)}
                    placeholder={feature.description}
                    rows={2}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-champagne placeholder-champagne/30 focus:outline-none focus:border-blush transition-colors resize-none text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFAQEditor = () => {
    const sourceTitle = sourceContent?.title || '';
    const sourceSubtitle = sourceContent?.subtitle || '';
    const sourceFAQs = sourceContent?.faqs || [];

    // Ensure formData has faqs array
    if (!formData.faqs) {
      formData.faqs = sourceFAQs.map(() => ({}));
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-display text-lg text-champagne">FAQ Block Translation</h3>
            <p className="text-sm text-champagne/60">Translate questions and answers</p>
          </div>
        </div>

        {/* Header Fields */}
        {(sourceTitle || sourceSubtitle) && (
          <div className="grid grid-cols-2 gap-6 pb-6 border-b border-white/10">
            <div className="space-y-4">
              <h4 className="font-semibold text-champagne/70 text-sm uppercase tracking-wider">
                Source ({sourceLanguage.toUpperCase()})
              </h4>

              {sourceTitle && (
                <div>
                  <label className="block text-xs text-champagne/50 mb-2">Title</label>
                  <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-champagne text-sm">
                    {sourceTitle}
                  </div>
                </div>
              )}

              {sourceSubtitle && (
                <div>
                  <label className="block text-xs text-champagne/50 mb-2">Subtitle</label>
                  <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-champagne text-sm">
                    {sourceSubtitle}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-champagne/70 text-sm uppercase tracking-wider">
                Translation ({targetLanguage.toUpperCase()})
              </h4>

              {sourceTitle && (
                <FormField label="Title">
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder={sourceTitle}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-blush transition-colors"
                  />
                </FormField>
              )}

              {sourceSubtitle && (
                <FormField label="Subtitle">
                  <input
                    type="text"
                    value={formData.subtitle || ''}
                    onChange={(e) => handleChange('subtitle', e.target.value)}
                    placeholder={sourceSubtitle}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-blush transition-colors"
                  />
                </FormField>
              )}
            </div>
          </div>
        )}

        {/* FAQs List */}
        <div className="space-y-4">
          <h4 className="font-semibold text-champagne text-sm">Questions & Answers ({sourceFAQs.length})</h4>

          {sourceFAQs.map((faq: any, index: number) => (
            <div key={faq.id || index} className="grid grid-cols-2 gap-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-champagne/50">FAQ #{index + 1}</span>
                  {faq.category && (
                    <span className="px-2 py-0.5 bg-blush/20 text-blush text-xs rounded-full">{faq.category}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-champagne/50 mb-1">Question</label>
                  <div className="p-2 bg-white/5 border border-white/10 rounded text-champagne text-sm">
                    {faq.question}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-champagne/50 mb-1">Answer</label>
                  <div className="p-2 bg-white/5 border border-white/10 rounded text-champagne text-sm whitespace-pre-wrap">
                    {faq.answer}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="h-6 mb-2" /> {/* Spacer */}

                <div>
                  <label className="block text-xs text-champagne/50 mb-1">Translated Question</label>
                  <input
                    type="text"
                    value={formData.faqs?.[index]?.question || ''}
                    onChange={(e) => handleArrayChange('faqs', index, 'question', e.target.value)}
                    placeholder={faq.question}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-champagne placeholder-champagne/30 focus:outline-none focus:border-blush transition-colors text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-champagne/50 mb-1">Translated Answer</label>
                  <textarea
                    value={formData.faqs?.[index]?.answer || ''}
                    onChange={(e) => handleArrayChange('faqs', index, 'answer', e.target.value)}
                    placeholder={faq.answer}
                    rows={3}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-champagne placeholder-champagne/30 focus:outline-none focus:border-blush transition-colors resize-none text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTestimonialsEditor = () => {
    const sourceTitle = sourceContent?.title || '';
    const sourceSubtitle = sourceContent?.subtitle || '';
    const sourceTestimonials = sourceContent?.testimonials || [];

    // Ensure formData has testimonials array
    if (!formData.testimonials) {
      formData.testimonials = sourceTestimonials.map(() => ({}));
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <div className="p-2 bg-yellow-500/20 rounded-lg">
            <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
          <div>
            <h3 className="font-display text-lg text-champagne">Testimonials Block Translation</h3>
            <p className="text-sm text-champagne/60">Translate customer testimonials</p>
          </div>
        </div>

        {/* Header Fields */}
        {(sourceTitle || sourceSubtitle) && (
          <div className="grid grid-cols-2 gap-6 pb-6 border-b border-white/10">
            <div className="space-y-4">
              <h4 className="font-semibold text-champagne/70 text-sm uppercase tracking-wider">
                Source ({sourceLanguage.toUpperCase()})
              </h4>

              {sourceTitle && (
                <div>
                  <label className="block text-xs text-champagne/50 mb-2">Title</label>
                  <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-champagne text-sm">
                    {sourceTitle}
                  </div>
                </div>
              )}

              {sourceSubtitle && (
                <div>
                  <label className="block text-xs text-champagne/50 mb-2">Subtitle</label>
                  <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-champagne text-sm">
                    {sourceSubtitle}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-champagne/70 text-sm uppercase tracking-wider">
                Translation ({targetLanguage.toUpperCase()})
              </h4>

              {sourceTitle && (
                <FormField label="Title">
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder={sourceTitle}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-blush transition-colors"
                  />
                </FormField>
              )}

              {sourceSubtitle && (
                <FormField label="Subtitle">
                  <input
                    type="text"
                    value={formData.subtitle || ''}
                    onChange={(e) => handleChange('subtitle', e.target.value)}
                    placeholder={sourceSubtitle}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-blush transition-colors"
                  />
                </FormField>
              )}
            </div>
          </div>
        )}

        {/* Testimonials List */}
        <div className="space-y-4">
          <h4 className="font-semibold text-champagne text-sm">Testimonials ({sourceTestimonials.length})</h4>

          {sourceTestimonials.map((testimonial: any, index: number) => (
            <div key={testimonial.id || index} className="grid grid-cols-2 gap-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-champagne/50">Testimonial #{index + 1}</span>
                </div>

                <div>
                  <label className="block text-xs text-champagne/50 mb-1">Author</label>
                  <div className="p-2 bg-white/5 border border-white/10 rounded text-champagne text-sm">
                    {testimonial.name}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-champagne/50 mb-1">Title/Company</label>
                  <div className="p-2 bg-white/5 border border-white/10 rounded text-champagne text-sm">
                    {testimonial.title || testimonial.company || 'N/A'}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-champagne/50 mb-1">Testimonial Text</label>
                  <div className="p-2 bg-white/5 border border-white/10 rounded text-champagne text-sm whitespace-pre-wrap">
                    {testimonial.text || testimonial.testimonial}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="h-6 mb-2" /> {/* Spacer */}

                <div>
                  <label className="block text-xs text-champagne/50 mb-1">Translated Author Name</label>
                  <input
                    type="text"
                    value={formData.testimonials?.[index]?.name || ''}
                    onChange={(e) => handleArrayChange('testimonials', index, 'name', e.target.value)}
                    placeholder={testimonial.name}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-champagne placeholder-champagne/30 focus:outline-none focus:border-blush transition-colors text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-champagne/50 mb-1">Translated Title/Company</label>
                  <input
                    type="text"
                    value={formData.testimonials?.[index]?.title || formData.testimonials?.[index]?.company || ''}
                    onChange={(e) => handleArrayChange('testimonials', index, testimonial.title ? 'title' : 'company', e.target.value)}
                    placeholder={testimonial.title || testimonial.company}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-champagne placeholder-champagne/30 focus:outline-none focus:border-blush transition-colors text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-champagne/50 mb-1">Translated Testimonial</label>
                  <textarea
                    value={formData.testimonials?.[index]?.text || formData.testimonials?.[index]?.testimonial || ''}
                    onChange={(e) => handleArrayChange('testimonials', index, testimonial.text ? 'text' : 'testimonial', e.target.value)}
                    placeholder={testimonial.text || testimonial.testimonial}
                    rows={3}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-champagne placeholder-champagne/30 focus:outline-none focus:border-blush transition-colors resize-none text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCTAEditor = () => {
    const sourceTitle = sourceContent?.title || '';
    const sourceDescription = sourceContent?.description || '';
    const sourceButtonText = sourceContent?.buttonText || sourceContent?.ctaText || '';

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <svg className="h-6 w-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-display text-lg text-champagne">CTA Block Translation</h3>
            <p className="text-sm text-champagne/60">Translate call-to-action content</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-champagne/70 text-sm uppercase tracking-wider">
              Source ({sourceLanguage.toUpperCase()})
            </h4>

            <div>
              <label className="block text-xs text-champagne/50 mb-2">Title</label>
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-champagne text-sm">
                {sourceTitle}
              </div>
            </div>

            {sourceDescription && (
              <div>
                <label className="block text-xs text-champagne/50 mb-2">Description</label>
                <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-champagne text-sm">
                  {sourceDescription}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-champagne/50 mb-2">Button Text</label>
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-champagne text-sm">
                {sourceButtonText}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-champagne/70 text-sm uppercase tracking-wider">
              Translation ({targetLanguage.toUpperCase()})
            </h4>

            <FormField label="Title">
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder={sourceTitle}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-blush transition-colors"
              />
            </FormField>

            {sourceDescription && (
              <FormField label="Description">
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder={sourceDescription}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-blush transition-colors resize-none"
                />
              </FormField>
            )}

            <FormField label="Button Text">
              <input
                type="text"
                value={formData.buttonText || formData.ctaText || ''}
                onChange={(e) => {
                  const key = sourceContent?.buttonText ? 'buttonText' : 'ctaText';
                  handleChange(key, e.target.value);
                }}
                placeholder={sourceButtonText}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-blush transition-colors"
              />
            </FormField>
          </div>
        </div>
      </div>
    );
  };

  const renderNewsletterEditor = () => {
    const sourceTitle = sourceContent?.title || '';
    const sourceDescription = sourceContent?.description || '';
    const sourcePlaceholder = sourceContent?.placeholder || '';
    const sourceButtonText = sourceContent?.buttonText || '';

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-display text-lg text-champagne">Newsletter Block Translation</h3>
            <p className="text-sm text-champagne/60">Translate newsletter signup content</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-champagne/70 text-sm uppercase tracking-wider">
              Source ({sourceLanguage.toUpperCase()})
            </h4>

            <div>
              <label className="block text-xs text-champagne/50 mb-2">Title</label>
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-champagne text-sm">
                {sourceTitle}
              </div>
            </div>

            {sourceDescription && (
              <div>
                <label className="block text-xs text-champagne/50 mb-2">Description</label>
                <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-champagne text-sm">
                  {sourceDescription}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-champagne/50 mb-2">Input Placeholder</label>
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-champagne text-sm">
                {sourcePlaceholder}
              </div>
            </div>

            <div>
              <label className="block text-xs text-champagne/50 mb-2">Button Text</label>
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-champagne text-sm">
                {sourceButtonText}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-champagne/70 text-sm uppercase tracking-wider">
              Translation ({targetLanguage.toUpperCase()})
            </h4>

            <FormField label="Title">
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder={sourceTitle}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-blush transition-colors"
              />
            </FormField>

            {sourceDescription && (
              <FormField label="Description">
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder={sourceDescription}
                  rows={2}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-blush transition-colors resize-none"
                />
              </FormField>
            )}

            <FormField label="Input Placeholder">
              <input
                type="text"
                value={formData.placeholder || ''}
                onChange={(e) => handleChange('placeholder', e.target.value)}
                placeholder={sourcePlaceholder}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-blush transition-colors"
              />
            </FormField>

            <FormField label="Button Text">
              <input
                type="text"
                value={formData.buttonText || ''}
                onChange={(e) => handleChange('buttonText', e.target.value)}
                placeholder={sourceButtonText}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-blush transition-colors"
              />
            </FormField>
          </div>
        </div>
      </div>
    );
  };

  const renderStatsEditor = () => {
    const sourceTitle = sourceContent?.title || '';
    const sourceStats = sourceContent?.stats || [];

    // Ensure formData has stats array
    if (!formData.stats) {
      formData.stats = sourceStats.map(() => ({}));
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-display text-lg text-champagne">Stats Block Translation</h3>
            <p className="text-sm text-champagne/60">Translate statistics labels</p>
          </div>
        </div>

        {/* Title */}
        {sourceTitle && (
          <div className="grid grid-cols-2 gap-6 pb-6 border-b border-white/10">
            <div>
              <label className="block text-xs text-champagne/50 mb-2">Title</label>
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-champagne text-sm">
                {sourceTitle}
              </div>
            </div>

            <FormField label="Translated Title">
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder={sourceTitle}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-blush transition-colors"
              />
            </FormField>
          </div>
        )}

        {/* Stats List */}
        <div className="space-y-4">
          <h4 className="font-semibold text-champagne text-sm">Statistics ({sourceStats.length})</h4>

          {sourceStats.map((stat: any, index: number) => (
            <div key={stat.id || index} className="grid grid-cols-2 gap-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-champagne/50">Stat #{index + 1}</span>
                  <span className="text-2xl font-bold text-blush">{stat.value}</span>
                </div>

                <div>
                  <label className="block text-xs text-champagne/50 mb-1">Label</label>
                  <div className="p-2 bg-white/5 border border-white/10 rounded text-champagne text-sm">
                    {stat.label}
                  </div>
                </div>

                {stat.description && (
                  <div>
                    <label className="block text-xs text-champagne/50 mb-1">Description</label>
                    <div className="p-2 bg-white/5 border border-white/10 rounded text-champagne text-sm">
                      {stat.description}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="h-6 mb-2" /> {/* Spacer */}

                <div>
                  <label className="block text-xs text-champagne/50 mb-1">Translated Label</label>
                  <input
                    type="text"
                    value={formData.stats?.[index]?.label || ''}
                    onChange={(e) => handleArrayChange('stats', index, 'label', e.target.value)}
                    placeholder={stat.label}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-champagne placeholder-champagne/30 focus:outline-none focus:border-blush transition-colors text-sm"
                  />
                </div>

                {stat.description && (
                  <div>
                    <label className="block text-xs text-champagne/50 mb-1">Translated Description</label>
                    <input
                      type="text"
                      value={formData.stats?.[index]?.description || ''}
                      onChange={(e) => handleArrayChange('stats', index, 'description', e.target.value)}
                      placeholder={stat.description}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-champagne placeholder-champagne/30 focus:outline-none focus:border-blush transition-colors text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDefaultEditor = () => {
    return (
      <div className="space-y-6">
        <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-semibold text-champagne mb-1">Block Type: {blockType}</h4>
              <p className="text-sm text-champagne/60">
                Visual editor not available for this block type. Please use JSON editor below.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-champagne/70 mb-2 uppercase tracking-wider">
              Source Content ({sourceLanguage.toUpperCase()})
            </label>
            <pre className="p-4 bg-white/5 border border-white/10 rounded-lg text-champagne text-xs overflow-auto max-h-96">
              {JSON.stringify(sourceContent, null, 2)}
            </pre>
          </div>

          <div>
            <label className="block text-xs font-semibold text-champagne/70 mb-2 uppercase tracking-wider">
              Translation Content ({targetLanguage.toUpperCase()})
            </label>
            <textarea
              value={JSON.stringify(formData, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setFormData(parsed);
                  onChange(parsed);
                } catch (err) {
                  // Invalid JSON, just update the text
                }
              }}
              className="w-full p-4 bg-white/10 border border-white/20 rounded-lg text-champagne text-xs font-mono focus:outline-none focus:border-blush transition-colors resize-none"
              rows={20}
            />
          </div>
        </div>
      </div>
    );
  };

  // Render appropriate editor based on block type
  const renderEditor = () => {
    switch (blockType) {
      case 'hero':
        return renderHeroEditor();
      case 'text-image':
        return renderTextImageEditor();
      case 'features':
        return renderFeaturesEditor();
      case 'faq':
        return renderFAQEditor();
      case 'testimonials':
        return renderTestimonialsEditor();
      case 'cta':
        return renderCTAEditor();
      case 'newsletter':
        return renderNewsletterEditor();
      case 'stats':
        return renderStatsEditor();
      default:
        return renderDefaultEditor();
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Translate Button */}
      {onAITranslate && (
        <div className="flex justify-end">
          <button
            onClick={onAITranslate}
            disabled={isTranslating}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            <SparklesIcon className={`h-5 w-5 ${isTranslating ? 'animate-spin' : ''}`} />
            {isTranslating ? 'Translating...' : 'Translate with AI'}
          </button>
        </div>
      )}

      {/* Block Type Specific Editor */}
      {renderEditor()}
    </div>
  );
}
