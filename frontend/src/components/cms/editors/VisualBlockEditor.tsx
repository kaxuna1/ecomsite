// Main Visual Block Editor Component - Routes to specific block editors
import { useState } from 'react';
import HeroBlockEditor from './HeroBlockEditor';
import FeaturesBlockEditor from './FeaturesBlockEditor';
import ProductsBlockEditor from './ProductsBlockEditor';
import TestimonialsBlockEditor from './TestimonialsBlockEditor';
import NewsletterBlockEditor from './NewsletterBlockEditor';
import TextImageBlockEditor from './TextImageBlockEditor';
import StatsBlockEditor from './StatsBlockEditor';
import CTABlockEditor from './CTABlockEditor';
import FAQBlockEditor from './FAQBlockEditor';
import AnnouncementBlockEditor from './AnnouncementBlockEditor';

interface VisualBlockEditorProps {
  blockType: string;
  content: any;
  onSave: (content: any) => void;
  onCancel: () => void;
}

export default function VisualBlockEditor({
  blockType,
  content,
  onSave,
  onCancel
}: VisualBlockEditorProps) {
  const [editedContent, setEditedContent] = useState(content);
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [jsonText, setJsonText] = useState(JSON.stringify(content, null, 2));
  const [jsonError, setJsonError] = useState('');

  const handleContentChange = (newContent: any) => {
    setEditedContent(newContent);
    setJsonText(JSON.stringify(newContent, null, 2));
    setJsonError('');
  };

  const handleJsonChange = (text: string) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      setEditedContent(parsed);
      setJsonError('');
    } catch (error) {
      setJsonError('Invalid JSON format');
    }
  };

  const handleSave = () => {
    if (jsonError) {
      alert('Please fix JSON errors before saving');
      return;
    }
    onSave(editedContent);
  };

  const renderEditor = () => {
    switch (blockType) {
      case 'hero':
        return <HeroBlockEditor content={editedContent} onChange={handleContentChange} />;
      case 'features':
        return <FeaturesBlockEditor content={editedContent} onChange={handleContentChange} />;
      case 'products':
        return <ProductsBlockEditor content={editedContent} onChange={handleContentChange} />;
      case 'testimonials':
        return <TestimonialsBlockEditor content={editedContent} onChange={handleContentChange} />;
      case 'newsletter':
        return <NewsletterBlockEditor content={editedContent} onChange={handleContentChange} />;
      case 'text_image':
        return <TextImageBlockEditor content={editedContent} onChange={handleContentChange} />;
      case 'stats':
        return <StatsBlockEditor content={editedContent} onChange={handleContentChange} />;
      case 'cta':
        return <CTABlockEditor content={editedContent} onChange={handleContentChange} />;
      case 'faq':
        return <FAQBlockEditor content={editedContent} onChange={handleContentChange} />;
      case 'announcement':
        return <AnnouncementBlockEditor content={editedContent} onChange={handleContentChange} />;
      default:
        return (
          <div className="p-8 text-center text-text-tertiary">
            <p>No visual editor available for block type: {blockType}</p>
            <p className="mt-2 text-sm">Use the JSON editor below.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Editor Mode Toggle */}
      <div className="flex gap-2 p-1 bg-bg-secondary rounded-lg border border-border-default">
        <button
          type="button"
          onClick={() => setShowJsonEditor(false)}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
            !showJsonEditor
              ? 'bg-interactive-default text-on-interactive shadow-lg'
              : 'text-text-secondary hover:bg-bg-elevated'
          }`}
        >
          Visual Editor
        </button>
        <button
          type="button"
          onClick={() => setShowJsonEditor(true)}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
            showJsonEditor
              ? 'bg-interactive-default text-on-interactive shadow-lg'
              : 'text-text-secondary hover:bg-bg-elevated'
          }`}
        >
          JSON Editor
        </button>
      </div>

      {/* Editor Content */}
      <div className="bg-bg-elevated border border-border-default rounded-lg p-6">
        {showJsonEditor ? (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-text-primary">
              Block Content (JSON)
            </label>
            <textarea
              value={jsonText}
              onChange={(e) => handleJsonChange(e.target.value)}
              rows={20}
              className={`w-full px-4 py-3 bg-bg-primary border rounded-lg text-text-primary font-mono text-sm focus:outline-none focus:border-primary transition-colors ${
                jsonError ? 'border-error' : 'border-border-default'
              }`}
              spellCheck={false}
            />
            {jsonError && (
              <p className="text-sm text-error">{jsonError}</p>
            )}
          </div>
        ) : (
          renderEditor()
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 bg-bg-secondary text-text-primary rounded-lg hover:bg-bg-elevated transition-colors font-medium border border-border-default"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!!jsonError}
          className="px-6 py-3 bg-interactive-default text-on-interactive rounded-lg hover:bg-interactive-hover transition-colors font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
