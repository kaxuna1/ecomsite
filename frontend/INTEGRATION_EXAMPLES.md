# AI Components Integration Examples

## SEOGenerator Component

### Usage in ProductEditor

```tsx
import { useState } from 'react';
import SEOGenerator from '../components/admin/SEOGenerator';
import { GenerateSEOResponse } from '../api/ai';

function ProductEditor() {
  const [showSEOGenerator, setShowSEOGenerator] = useState(false);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [focusKeyword, setFocusKeyword] = useState('');

  const handleApplySEO = (seo: GenerateSEOResponse) => {
    setMetaTitle(seo.metaTitle);
    setMetaDescription(seo.metaDescription);
    setFocusKeyword(seo.focusKeyword);
    // Optionally save to product form
  };

  return (
    <div>
      {/* SEO Section in Product Form */}
      <button
        type="button"
        onClick={() => setShowSEOGenerator(true)}
        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-white"
      >
        <SparklesIcon className="h-5 w-5" />
        Generate SEO with AI
      </button>

      {/* SEO Generator Modal */}
      {showSEOGenerator && (
        <SEOGenerator
          productName={productName}
          shortDescription={shortDescription}
          description={description}
          categories={categories}
          onApply={handleApplySEO}
          onClose={() => setShowSEOGenerator(false)}
        />
      )}
    </div>
  );
}
```

### Features

✅ **Beautiful Modal Dialog** with Headless UI transitions
✅ **Target Keyword Input** (optional, AI chooses if empty)
✅ **Character Count Indicators** with color-coded validation:
  - Meta Title: 50-60 chars (optimal)
  - Meta Description: 150-160 chars (optimal)
  - Green ✓ when within range
  - Amber ⚡ when approaching limit
  - Red ⚠️ when exceeding limit

✅ **Preview Cards** showing:
  - Meta Title
  - Meta Description
  - Focus Keyword (highlighted with gradient background)
  - Secondary Keywords (as chips)
  - Open Graph Title & Description
  - Estimated CTR (click-through rate)

✅ **Actions**:
  - Generate SEO Meta
  - Regenerate (try again with new results)
  - Apply to Product
  - Cancel

✅ **Toast Notifications** for success/error feedback
✅ **Mobile Responsive** design
✅ **Loading States** with spinner animation

---

## AltTextGenerator Component

### Usage in Media Library

```tsx
import { useState } from 'react';
import AltTextGenerator from '../components/admin/AltTextGenerator';
import { GenerateAltTextResponse } from '../api/ai';

function MediaLibrary() {
  const [showAltTextGenerator, setShowAltTextGenerator] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageTitle, setImageTitle] = useState('');

  const handleGenerateAltText = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowAltTextGenerator(true);
  };

  const handleApplyAltText = (altText: GenerateAltTextResponse) => {
    setImageAlt(altText.altText);
    setImageTitle(altText.title);
    // Save to database
    updateImageMetadata({
      altText: altText.altText,
      title: altText.title,
      caption: altText.caption,
    });
  };

  return (
    <div>
      {/* Image Grid */}
      <div className="grid grid-cols-4 gap-4">
        {images.map((image) => (
          <div key={image.id}>
            <img src={image.url} alt={image.alt} />
            <button onClick={() => handleGenerateAltText(image.url)}>
              Generate Alt Text
            </button>
          </div>
        ))}
      </div>

      {/* Alt Text Generator Modal */}
      {showAltTextGenerator && (
        <AltTextGenerator
          imageUrl={selectedImage}
          filename="product-image.jpg"
          productName={productName}
          productCategory={category}
          onApply={handleApplyAltText}
          onClose={() => setShowAltTextGenerator(false)}
        />
      )}
    </div>
  );
}
```

### Usage in Image Upload Flow

```tsx
function ProductImageUpload() {
  const [showAltTextGenerator, setShowAltTextGenerator] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');

  const handleImageUpload = async (file: File) => {
    // Upload image
    const response = await uploadProductImage(file);
    setUploadedImageUrl(response.url);

    // Automatically show alt text generator
    setShowAltTextGenerator(true);
  };

  const handleApplyAltText = (altText: GenerateAltTextResponse) => {
    // Apply alt text to form
    setFormData(prev => ({
      ...prev,
      imageAlt: altText.altText,
      imageTitle: altText.title,
    }));
  };

  return (
    <>
      <input type="file" onChange={(e) => handleImageUpload(e.target.files[0])} />

      {showAltTextGenerator && (
        <AltTextGenerator
          imageUrl={uploadedImageUrl}
          productName={productName}
          productCategory={category}
          onApply={handleApplyAltText}
          onClose={() => setShowAltTextGenerator(false)}
        />
      )}
    </>
  );
}
```

### Features

✅ **Beautiful Modal Dialog** with Headless UI transitions
✅ **Image Preview** at top of modal (128x128 thumbnail)
✅ **Editable Text Areas** - All fields can be manually adjusted before applying:
  - Alt Text (with character count)
  - Title Attribute
  - Caption (expandable section)

✅ **Read-Only Preview** sections:
  - Long Description (expandable)
  - SEO Keywords (as chips)

✅ **Character Count Indicator** for Alt Text:
  - Optimal: 100-125 characters (green with ✓)
  - Warning: 80-99 or 126+ characters (amber)
  - Exceeds: 125+ characters (red)

✅ **Copy to Clipboard** buttons for each field
✅ **Expandable Sections** for longer content (Caption, Description)
✅ **Actions**:
  - Generate Alt Text
  - Regenerate (try again)
  - Apply (saves edited values)
  - Cancel

✅ **Toast Notifications** for all actions
✅ **Mobile Responsive** with proper image scaling
✅ **Loading States** during generation

---

## Styling & Design

Both components follow the **Luxia Products luxury aesthetic**:

- **Dark Theme**: `bg-midnight` with `text-champagne`
- **Glass Morphism**: `bg-white/5`, `border-white/10`
- **Purple/Pink Gradients**: `from-purple-600 to-pink-600`
- **Smooth Animations**: Fade in/out, scale transitions
- **Rounded Corners**: `rounded-2xl`, `rounded-3xl`
- **Icons**: Heroicons (outline and solid variants)
- **Hover States**: Subtle transitions on all interactive elements
- **Success/Error States**: Green for success, Red for errors, Blue for info

### Color Palette

```css
/* Primary Colors (from tailwind.config.js) */
midnight: #0A0A0F     /* Dark background */
champagne: #F5F0E8    /* Light text */
blush: #E8B4A8        /* Accent pink */

/* Gradients */
from-purple-500 to-pink-500   /* Icon backgrounds */
from-purple-600 to-pink-600   /* Primary buttons */

/* State Colors */
green-400/green-500   /* Success */
rose-400/rose-500     /* Error */
blue-400/blue-500     /* Info */
amber-400             /* Warning */
```

---

## API Integration

Both components use **React Query** (`useMutation`) for API calls:

```tsx
const generateMutation = useMutation({
  mutationFn: (data: GenerateSEORequest) => generateSEOMeta(data),
  onSuccess: (data) => {
    setGeneratedData(data);
    toast.success('Generated successfully!');
  },
  onError: (error) => {
    toast.error(error.message);
  },
});
```

**Benefits**:
- Automatic loading states (`isPending`)
- Error handling with retry capability
- Type-safe API calls
- Toast notifications for UX feedback

---

## TypeScript Types

Both components are **fully typed** with TypeScript:

### SEOGenerator Props
```typescript
interface SEOGeneratorProps {
  productName: string;
  shortDescription?: string;
  description?: string;
  categories?: string[];
  onApply: (seo: GenerateSEOResponse) => void;
  onClose: () => void;
}
```

### AltTextGenerator Props
```typescript
interface AltTextGeneratorProps {
  imageUrl: string;
  filename?: string;
  productName?: string;
  productCategory?: string;
  onApply: (altText: GenerateAltTextResponse) => void;
  onClose: () => void;
}
```

All API types are imported from `/src/api/ai.ts` ensuring type safety across the entire application.

---

## Testing Checklist

Before deploying, test these scenarios:

### SEOGenerator
- [ ] Generate SEO with target keyword
- [ ] Generate SEO without target keyword
- [ ] Regenerate to get different results
- [ ] Apply to product and verify fields populate
- [ ] Cancel without applying
- [ ] Test error handling (API failure)
- [ ] Verify character count indicators change color correctly
- [ ] Test on mobile devices

### AltTextGenerator
- [ ] Generate alt text for product image
- [ ] Edit alt text before applying
- [ ] Copy alt text to clipboard
- [ ] Expand/collapse caption and description sections
- [ ] Regenerate to get different results
- [ ] Apply and verify fields populate
- [ ] Cancel without applying
- [ ] Test error handling (invalid image URL)
- [ ] Test on mobile devices

---

## Performance Considerations

- **Lazy Loading**: Consider lazy loading modals with React.lazy()
- **Image Optimization**: AltTextGenerator handles image load errors gracefully
- **API Caching**: React Query caches results (consider if needed)
- **Bundle Size**: Headless UI adds ~15KB, toast adds ~5KB

---

## Future Enhancements

### Possible additions:
1. **History/Undo**: Save previous AI generations
2. **Bulk Operations**: Generate for multiple products at once
3. **A/B Testing**: Compare multiple SEO variations
4. **Analytics**: Track which AI-generated content performs best
5. **Multilingual**: Generate in different languages
6. **Templates**: Save and reuse common patterns
7. **Preview**: Show Google search result preview
8. **Scoring**: SEO score based on best practices

---

## Support

For issues or questions:
- Check `/backend/src/routes/aiRoutes.ts` for API implementation
- Review `/frontend/src/api/ai.ts` for API client
- See `AIDescriptionGenerator.tsx` for similar patterns

**Backend API Endpoints:**
- `POST /api/admin/ai/generate-seo`
- `POST /api/admin/ai/generate-alt-text`
