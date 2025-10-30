# CMS Page Translation Feature

## Overview

The CMS Page Translation feature provides AI-powered translation for entire CMS pages, including page metadata (title, metaTitle, metaDescription) and all block content. The feature handles all block types (hero, features, text_image, testimonials, stats, newsletter, cta, products, social_proof) while preserving structure, formatting, and technical values.

## Architecture

### Components

1. **CMSPageTranslator** (`/src/ai/features/CMSPageTranslator.ts`)
   - Implements `IAIFeature` interface
   - Handles prompt building for CMS content
   - Parses and validates translated responses
   - Preserves JSON structure and technical values

2. **API Endpoint** (`/src/routes/aiRoutes.ts`)
   - `POST /api/admin/ai/translate-cms-page`
   - Admin-only endpoint (requires JWT authentication)
   - Comprehensive validation of input
   - Returns translated fields and blocks with cost tracking

### Integration

The feature is registered with the AI Service Manager alongside other AI features:
- Product Description Generator
- SEO Meta Generator
- Image Alt Text Generator
- Product Translator
- Email Campaign Generator
- FAQ Generator
- Hero Block Generator
- Testimonials Generator
- Features Generator
- **CMS Page Translator** (NEW)

## API Endpoint

### Request

**Endpoint:** `POST /api/admin/ai/translate-cms-page`

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json
```

**Request Body:**
```typescript
{
  fields: {
    title?: string;
    metaTitle?: string;
    metaDescription?: string;
  };
  blocks: Array<{
    id: number;
    type: BlockType; // 'hero' | 'features' | 'text_image' | etc.
    content: BlockContent; // Block-specific content structure
  }>;
  sourceLanguage?: string; // Default: 'en'
  targetLanguage: string; // Required (e.g., 'ka', 'ru', 'es')
  preserveTerms?: string[]; // Brand names/terms to not translate
  tone?: 'luxury' | 'professional' | 'casual' | 'friendly'; // Default: 'professional'
}
```

### Response

**Success Response (200):**
```typescript
{
  success: true;
  data: {
    translatedFields: {
      title?: string;
      metaTitle?: string; // Max 60 characters
      metaDescription?: string; // Max 160 characters
    };
    translatedBlocks: Array<{
      id: number; // Original block ID
      content: BlockContent; // Translated block content (same structure)
    }>;
    cost: number; // Estimated cost in USD
    tokensUsed: number; // Total tokens consumed
    provider: string; // AI provider used (e.g., 'anthropic', 'openai')
  }
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "error": "Error message description"
}
```

## Block Type Handling

The translator handles each block type appropriately:

### Hero Block
**Translates:**
- headline
- subheadline
- description
- ctaText

**Preserves:**
- ctaLink
- backgroundImage
- backgroundImageAlt (if provided)
- overlayOpacity
- textAlignment

### Features Block
**Translates:**
- title
- subtitle
- features[].title
- features[].description

**Preserves:**
- features[].id
- features[].icon
- columns

### Text + Image Block
**Translates:**
- title
- content (HTML/markdown)
- ctaText

**Preserves:**
- image
- imageAlt
- imagePosition
- ctaLink

### Testimonials Block
**Translates:**
- title
- subtitle
- testimonials[].text

**Preserves:**
- testimonials[].id
- testimonials[].name
- testimonials[].role
- testimonials[].avatar
- testimonials[].rating
- displayStyle

### Stats Block
**Translates:**
- title
- stats[].label

**Preserves:**
- stats[].id
- stats[].value (e.g., "50K+", "99%")
- stats[].icon
- columns

### Newsletter Block
**Translates:**
- title
- description
- buttonText
- placeholderText
- successMessage

**Preserves:**
- backgroundImage

### CTA Block
**Translates:**
- title
- description
- primaryButtonText
- secondaryButtonText

**Preserves:**
- primaryButtonLink
- secondaryButtonLink
- backgroundColor
- backgroundImage

### Products Block
**Translates:**
- title
- subtitle
- ctaText

**Preserves:**
- All technical fields (selectionMethod, productIds, rules, displayStyle, etc.)
- Configuration options
- Sorting and filtering settings

### Social Proof Block
**Translates:**
- title
- items[].name

**Preserves:**
- items[].id
- items[].image
- items[].link
- displayStyle

## Translation Features

### Intelligent Translation
- Context-aware translation based on block type
- Maintains brand voice and tone
- Cultural adaptation for target language
- Preserves marketing message and persuasive elements

### Structure Preservation
- Exact JSON structure maintained
- All IDs, URLs, and technical values unchanged
- Array lengths and object nesting preserved
- Formatting and whitespace maintained where appropriate

### SEO Optimization
- Meta title kept under 60 characters
- Meta description kept under 160 characters
- Natural keyword integration (no keyword stuffing)
- Search intent preserved in target language

### Brand Safety
- Configurable terms to preserve (brand names, trademarks)
- Technical terminology handling
- Consistent brand voice across translations

## Usage Examples

### Example 1: Simple Page Translation

```bash
curl -X POST http://localhost:4000/api/admin/ai/translate-cms-page \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "title": "About Us",
      "metaTitle": "About Luxia Hair Care",
      "metaDescription": "Learn about our luxury hair care products and commitment to quality."
    },
    "blocks": [],
    "sourceLanguage": "en",
    "targetLanguage": "ka",
    "tone": "professional"
  }'
```

### Example 2: Hero Block Translation

```javascript
const response = await fetch('/api/admin/ai/translate-cms-page', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fields: {
      title: 'Home Page',
      metaTitle: 'Premium Hair Care | Luxia',
      metaDescription: 'Transform your hair with luxury products.'
    },
    blocks: [
      {
        id: 1,
        type: 'hero',
        content: {
          type: 'hero',
          headline: 'Beautiful Hair Starts Here',
          subheadline: 'Luxury Products for Every Hair Type',
          description: 'Discover our premium collection...',
          ctaText: 'Shop Now',
          ctaLink: '/products',
          backgroundImage: '/images/hero.jpg',
          textAlignment: 'center'
        }
      }
    ],
    sourceLanguage: 'en',
    targetLanguage: 'ka',
    preserveTerms: ['Luxia'],
    tone: 'luxury'
  })
});

const result = await response.json();
console.log('Translation cost:', result.data.cost);
console.log('Translated title:', result.data.translatedFields.title);
console.log('Translated blocks:', result.data.translatedBlocks);
```

### Example 3: Complete Page with Multiple Blocks

```typescript
import { translateCMSPage } from '@/api/ai';

const translationResult = await translateCMSPage({
  fields: {
    title: 'Our Story',
    metaTitle: 'The Luxia Story | Premium Hair Care',
    metaDescription: 'Learn how Luxia became a leader in luxury hair care products.'
  },
  blocks: [
    {
      id: 1,
      type: 'hero',
      content: { /* hero content */ }
    },
    {
      id: 2,
      type: 'features',
      content: { /* features content */ }
    },
    {
      id: 3,
      type: 'testimonials',
      content: { /* testimonials content */ }
    },
    {
      id: 4,
      type: 'cta',
      content: { /* cta content */ }
    }
  ],
  sourceLanguage: 'en',
  targetLanguage: 'es',
  preserveTerms: ['Luxia'],
  tone: 'luxury'
});

// Save translations to database
await saveCMSPageTranslation(pageId, 'es', {
  title: translationResult.translatedFields.title,
  metaTitle: translationResult.translatedFields.metaTitle,
  metaDescription: translationResult.translatedFields.metaDescription
});

for (const block of translationResult.translatedBlocks) {
  await saveCMSBlockTranslation(block.id, 'es', block.content);
}
```

## Integration with Existing Systems

### Database Schema

The translation results can be saved to existing CMS translation tables:

- `cms_page_translations` - Page-level translations
- `cms_block_translations` - Block-level translations

### Frontend Integration

```typescript
// Example: Translate button in CMS editor
const handleTranslate = async (targetLanguage: string) => {
  setTranslating(true);

  try {
    const result = await api.post('/admin/ai/translate-cms-page', {
      fields: {
        title: currentPage.title,
        metaTitle: currentPage.metaTitle,
        metaDescription: currentPage.metaDescription
      },
      blocks: currentPage.blocks.map(block => ({
        id: block.id,
        type: block.blockType,
        content: block.content
      })),
      sourceLanguage: 'en',
      targetLanguage,
      preserveTerms: ['Luxia'], // Your brand name
      tone: 'luxury'
    });

    // Apply translations
    setTranslatedFields(result.data.translatedFields);
    setTranslatedBlocks(result.data.translatedBlocks);

    toast.success(`Translated to ${targetLanguage.toUpperCase()}! Cost: $${result.data.cost.toFixed(4)}`);
  } catch (error) {
    toast.error('Translation failed: ' + error.message);
  } finally {
    setTranslating(false);
  }
};
```

## Cost Tracking

The feature tracks AI usage costs:

- Token usage recorded per request
- Cost calculated based on provider pricing
- Saved to `ai_usage_logs` table with metadata
- Accessible via `/api/admin/ai/usage-stats` endpoint

### Example Cost Tracking Query

```typescript
// Get translation costs for last 30 days
const stats = await fetch('/api/admin/ai/usage-stats?feature=cms_page_translator');
const { totalCost, totalTokens, requestCount } = await stats.json();

console.log(`CMS translations cost: $${totalCost}`);
console.log(`Average cost per page: $${(totalCost / requestCount).toFixed(4)}`);
```

## Error Handling

The feature includes comprehensive error handling:

1. **Input Validation**
   - Required fields checked
   - Block structure validated
   - Language codes verified

2. **Translation Errors**
   - JSON parsing failures handled gracefully
   - Fallback to empty results with error message
   - Detailed logging for debugging

3. **API Errors**
   - Provider failures caught and reported
   - Timeout handling (configurable)
   - Retry logic (via AI Service Manager)

## Performance Considerations

### Token Estimation

The feature estimates tokens based on content size:
- Page fields: ~4 characters per token
- Block content: JSON stringified size / 4
- Prompt overhead: ~1200 tokens
- Response overhead: content tokens * 1.3

### Optimization Tips

1. **Batch Related Pages**: Translate similar pages together for context
2. **Cache Translations**: Use the built-in cache for repeated requests
3. **Partial Updates**: Only translate changed blocks
4. **Provider Selection**: Use faster/cheaper providers for simple content

## Testing

### Test Script

Use the provided test script:

```bash
cd backend
./test-cms-translation.sh
```

Make sure to:
1. Update `JWT_TOKEN` with valid admin token
2. Ensure backend is running on port 4000
3. Have AI provider credentials configured

### Manual Testing

1. Log in to admin panel
2. Get JWT token from localStorage/cookies
3. Use curl or Postman with examples above
4. Verify translations in database tables

## Future Enhancements

Potential improvements for future versions:

1. **Batch Translation**: Translate multiple pages in one request
2. **Translation Memory**: Reuse previous translations for consistency
3. **Quality Scoring**: AI-assessed translation quality (0-100)
4. **Glossary Support**: Custom terminology dictionaries per brand
5. **Version Control**: Track translation versions with rollback
6. **A/B Testing**: Generate multiple translation variants
7. **Vision Support**: Translate alt text using image analysis
8. **Real-time Streaming**: Stream translations as they're generated

## Support

For issues or questions:
- Check logs: `docker logs backend` or console output
- Review AI usage logs: `/api/admin/ai/recent-logs`
- Verify API keys: Admin Settings > API Keys
- Test provider availability: `/api/admin/ai/providers`

## Related Documentation

- Product Translation: `PRODUCT_TRANSLATION_ANALYSIS.md`
- AI Features: `AI_FEATURES_EXPANSION_SUMMARY.md`
- API Keys Management: `CLAUDE.md` (API Keys section)
- CMS Types: `/src/types/cms.ts`
