// Main Visual Block Editor Component - Routes to specific block editors
import { useState } from 'react';
import HeroBlockEditor from './HeroBlockEditor';
import FeaturesBlockEditor from './FeaturesBlockEditor';
import ProductsBlockEditor from './ProductsBlockEditor';
import TestimonialsBlockEditor from './TestimonialsBlockEditor';
import NewsletterBlockEditor from './NewsletterBlockEditor';

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
      default:
        return (
          <div className="p-8 text-center text-champagne/50">
            <p>No visual editor available for block type: {blockType}</p>
            <p className="mt-2 text-sm">Use the JSON editor below.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Editor Mode Toggle */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-lg border border-white/10">
        <button
          type="button"
          onClick={() => setShowJsonEditor(false)}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
            !showJsonEditor
              ? 'bg-jade text-midnight shadow-lg'
              : 'text-champagne hover:bg-white/5'
          }`}
        >
          Visual Editor
        </button>
        <button
          type="button"
          onClick={() => setShowJsonEditor(true)}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
            showJsonEditor
              ? 'bg-jade text-midnight shadow-lg'
              : 'text-champagne hover:bg-white/5'
          }`}
        >
          JSON Editor
        </button>
      </div>

      {/* Editor Content */}
      <div className="bg-midnight/30 border border-white/10 rounded-lg p-6">
        {showJsonEditor ? (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-champagne">
              Block Content (JSON)
            </label>
            <textarea
              value={jsonText}
              onChange={(e) => handleJsonChange(e.target.value)}
              rows={20}
              className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-champagne font-mono text-sm focus:outline-none focus:border-jade transition-colors ${
                jsonError ? 'border-red-500' : 'border-white/10'
              }`}
              spellCheck={false}
            />
            {jsonError && (
              <p className="text-sm text-red-400">{jsonError}</p>
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
          className="px-6 py-3 bg-white/10 text-champagne rounded-lg hover:bg-white/20 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!!jsonError}
          className="px-6 py-3 bg-jade text-midnight rounded-lg hover:bg-jade/90 transition-colors font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
