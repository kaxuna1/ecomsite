/**
 * Translation Synchronization Utility
 *
 * Handles intelligent merging of base block content with translations.
 * Only translatable text fields are kept from translations,
 * while structure, media, and styles come from the base block.
 */

interface FieldClassification {
  translatable: Set<string>;
  structural: Set<string>;
  media: Set<string>;
  style: Set<string>;
}

/**
 * Define which fields are translatable vs structural/media/style
 * These are the fields that should be preserved in translations
 */
const FIELD_CLASSIFICATIONS: FieldClassification = {
  // Text fields that should be translated
  translatable: new Set([
    'text',
    'title',
    'headline',
    'subheadline',
    'description',
    'subtitle',
    'label',
    'buttonText',
    'ctaText',
    'primaryButtonText',
    'secondaryButtonText',
    'placeholderText',
    'successMessage',
    'errorMessage',
    'name',
    'jobTitle',
    'company',
    'location',
    'content', // For text blocks
  ]),

  // Structural fields that should be synced from base
  structural: new Set([
    'type',
    'template',
    'layout',
    'columns',
    'displayStyle',
    'displayOrder',
    'maxProducts',
    'showCta',
    'openInNewTab',
    'verified',
    'rating',
    'carouselSettings',
    'rules',
    'selectionMethod',
    'categoryFilter',
    'attributeFilters',
    'showElements',
    'sortBy',
  ]),

  // Media fields that should be synced from base
  media: new Set([
    'backgroundImage',
    'backgroundImageAlt',
    'image',
    'imageUrl',
    'imageAlt',
    'icon',
    'avatar',
    'logo',
    'productIds',
  ]),

  // Style fields that should be synced from base
  style: new Set([
    'style',
    'textColor',
    'backgroundColor',
    'accentColor',
    'secondaryColor',
    'textAlignment',
    'overlayOpacity',
    'padding',
    'gap',
    'cardStyle',
    'hoverEffect',
    'borderRadius',
    'imageAspectRatio',
    'enableAnimations',
    'iconStyle',
    'primaryButton',
    'secondaryButton',
  ]),
};

/**
 * Check if a field should be translated
 */
function isTranslatableField(key: string): boolean {
  return FIELD_CLASSIFICATIONS.translatable.has(key);
}

/**
 * Recursively extract only translatable fields from an object
 */
function extractTranslatableFields(obj: any, result: any = {}): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => extractTranslatableFields(item));
  }

  for (const [key, value] of Object.entries(obj)) {
    if (isTranslatableField(key)) {
      // This is a translatable field, keep it
      result[key] = value;
    } else if (typeof value === 'object' && value !== null) {
      // Recursively check nested objects
      const nested = extractTranslatableFields(value);
      if (Object.keys(nested).length > 0) {
        result[key] = nested;
      }
    }
  }

  return result;
}

/**
 * Deep merge two objects, with translation overrides taking precedence
 * for translatable fields only
 */
function deepMerge(base: any, translation: any): any {
  if (typeof base !== 'object' || base === null) {
    return base;
  }

  if (Array.isArray(base)) {
    // For arrays, check if translation has the same structure
    if (Array.isArray(translation) && translation.length === base.length) {
      return base.map((item, index) => deepMerge(item, translation[index]));
    }
    // If structures don't match, use base
    return base;
  }

  const result: any = { ...base };

  if (typeof translation === 'object' && translation !== null && !Array.isArray(translation)) {
    for (const [key, value] of Object.entries(translation)) {
      if (isTranslatableField(key)) {
        // Override translatable field with translation
        result[key] = value;
      } else if (typeof value === 'object' && value !== null && result[key]) {
        // Recursively merge nested objects
        result[key] = deepMerge(result[key], value);
      }
      // Ignore non-translatable fields from translation
    }
  }

  return result;
}

/**
 * Sync block translation with base block content
 * Preserves translatable text fields, syncs everything else from base
 *
 * @param baseContent - The base block content (usually English)
 * @param translationContent - The translated block content
 * @returns Synced content with base structure and translated text
 */
export function syncBlockTranslation(
  baseContent: any,
  translationContent: any
): any {
  // If translation is empty or null, return base content
  if (!translationContent || Object.keys(translationContent).length === 0) {
    return baseContent;
  }

  // Extract only translatable fields from translation
  const translatableFields = extractTranslatableFields(translationContent);

  // Merge base with translatable fields
  return deepMerge(baseContent, translatableFields);
}

/**
 * Extract only translatable fields to store in translation table
 * This reduces data duplication and makes structure sync automatic
 *
 * @param content - Full block content
 * @returns Only the translatable text fields
 */
export function extractTranslatableContent(content: any): any {
  return extractTranslatableFields(content);
}

/**
 * Validate that translation has same structure as base
 * Returns list of structural differences
 */
export function validateTranslationStructure(
  baseContent: any,
  translationContent: any
): string[] {
  const issues: string[] = [];

  // Check type match
  if (baseContent.type !== translationContent.type) {
    issues.push(`Block type mismatch: base="${baseContent.type}" vs translation="${translationContent.type}"`);
  }

  // Check template match
  if (baseContent.template && translationContent.template &&
      baseContent.template !== translationContent.template) {
    issues.push(`Template mismatch: base="${baseContent.template}" vs translation="${translationContent.template}"`);
  }

  // Check array lengths for features, testimonials, etc.
  if (Array.isArray(baseContent.features) && Array.isArray(translationContent.features)) {
    if (baseContent.features.length !== translationContent.features.length) {
      issues.push(`Features count mismatch: base=${baseContent.features.length} vs translation=${translationContent.features.length}`);
    }
  }

  if (Array.isArray(baseContent.testimonials) && Array.isArray(translationContent.testimonials)) {
    if (baseContent.testimonials.length !== translationContent.testimonials.length) {
      issues.push(`Testimonials count mismatch: base=${baseContent.testimonials.length} vs translation=${translationContent.testimonials.length}`);
    }
  }

  return issues;
}
