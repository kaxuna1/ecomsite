import api from './client';

// ============================================================================
// Product Description Generator
// ============================================================================

export interface GenerateDescriptionRequest {
  productName: string;
  shortDescription?: string;
  categories?: string[];
  tone?: 'professional' | 'luxury' | 'casual' | 'friendly' | 'technical';
  length?: 'short' | 'medium' | 'long';
}

export interface GenerateDescriptionResponse {
  description: string;
  highlights: string[];
  usage?: string;
  metaDescription?: string;
  cost: number;
  tokensUsed: number;
  provider: string;
}

export async function generateProductDescription(
  data: GenerateDescriptionRequest
): Promise<GenerateDescriptionResponse> {
  const response = await api.post<{ success: boolean; data: GenerateDescriptionResponse }>(
    '/admin/ai/generate-description',
    data
  );
  return response.data.data;
}

// ============================================================================
// SEO Meta Generator
// ============================================================================

export interface GenerateSEORequest {
  productName: string;
  shortDescription?: string;
  description?: string;
  categories?: string[];
  targetKeyword?: string;
  existingKeywords?: string[];
  language?: string;
}

export interface GenerateSEOResponse {
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  openGraphTitle?: string;
  openGraphDescription?: string;
  estimatedCTR?: string;
}

export async function generateSEOMeta(
  data: GenerateSEORequest
): Promise<GenerateSEOResponse> {
  const response = await api.post<{ success: boolean; data: GenerateSEOResponse }>(
    '/admin/ai/generate-seo',
    data
  );
  return response.data.data;
}

// ============================================================================
// Image Alt Text Generator
// ============================================================================

export interface GenerateAltTextRequest {
  imageUrl: string;
  filename?: string;
  productName?: string;
  productCategory?: string;
  productDescription?: string;
  existingAltText?: string;
  language?: string;
}

export interface GenerateAltTextResponse {
  altText: string;
  title: string;
  caption?: string;
  imageDescription?: string;
  seoKeywords?: string[];
}

export async function generateImageAltText(
  data: GenerateAltTextRequest
): Promise<GenerateAltTextResponse> {
  const response = await api.post<{ success: boolean; data: GenerateAltTextResponse }>(
    '/admin/ai/generate-alt-text',
    data
  );
  return response.data.data;
}

// ============================================================================
// Product Translation
// ============================================================================

export interface TranslateProductRequest {
  productName: string;
  shortDescription: string;
  description: string;
  highlights: string[];
  usage?: string;
  targetLanguage: string;
  sourceLanguage?: string;
}

export interface TranslateProductResponse {
  translatedFields: {
    name?: string;
    shortDescription?: string;
    description?: string;
    highlights?: string[];
    usage?: string;
  };
  preservedTerms: string[];
  languagePair: string;
  qualityScore: number;
  cost: number;
  tokensUsed: number;
  provider: string;
}

export async function translateProduct(
  data: TranslateProductRequest
): Promise<TranslateProductResponse> {
  const response = await api.post<{ success: boolean; data: TranslateProductResponse }>(
    '/admin/ai/translate-product',
    {
      fields: {
        name: data.productName,
        shortDescription: data.shortDescription,
        description: data.description,
        highlights: data.highlights,
        usage: data.usage
      },
      sourceLanguage: data.sourceLanguage || 'en',
      targetLanguage: data.targetLanguage,
      tone: 'luxury'
    }
  );
  return response.data.data;
}

// ============================================================================
// CMS Page Translation
// ============================================================================

export interface TranslateCMSPageRequest {
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  blocks: Array<{
    id: number;
    type: string;
    content: any;
  }>;
  targetLanguage: string;
  sourceLanguage?: string;
}

export interface TranslateCMSPageResponse {
  translatedFields: {
    title: string;
    metaTitle?: string;
    metaDescription?: string;
  };
  translatedBlocks: Array<{
    id: number;
    content: any;
  }>;
  cost: number;
  tokensUsed: number;
  provider: string;
}

export async function translateCMSPage(
  data: TranslateCMSPageRequest
): Promise<TranslateCMSPageResponse> {
  const response = await api.post<{ success: boolean; data: TranslateCMSPageResponse }>(
    '/admin/ai/translate-cms-page',
    {
      fields: {
        title: data.title,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription
      },
      blocks: data.blocks,
      sourceLanguage: data.sourceLanguage || 'en',
      targetLanguage: data.targetLanguage
    }
  );
  return response.data.data;
}

// ============================================================================
// FAQ Generator
// ============================================================================

export interface FAQItem {
  question: string;
  answer: string;
  category?: 'usage' | 'benefits' | 'ingredients' | 'suitability' | 'results' | 'general';
}

export interface GenerateFAQRequest {
  productName: string;
  productDescription?: string;
  productCategory?: string;
  benefits?: string[];
  ingredients?: string[];
  price?: number;
  targetAudience?: string;
  commonConcerns?: string[];
  language?: string;
  numberOfFAQs?: number;
}

export interface GenerateFAQResponse {
  faqs: FAQItem[];
  faqSchemaMarkup: string;
  cost: number;
  tokensUsed: number;
  provider: string;
}

export async function generateFAQ(
  data: GenerateFAQRequest
): Promise<GenerateFAQResponse> {
  const response = await api.post<{ success: boolean; data: GenerateFAQResponse }>(
    '/admin/ai/generate-faq',
    data
  );
  return response.data.data;
}

// ============================================================================
// Hero Block Generator
// ============================================================================

export interface GenerateHeroRequest {
  brandName: string;
  productOrService?: string;
  targetAudience?: string;
  keyBenefits?: string[];
  tone?: 'professional' | 'luxury' | 'friendly' | 'bold' | 'minimal';
  template?: 'split-screen' | 'centered-minimal' | 'full-width-overlay' | 'asymmetric-bold' | 'luxury-minimal' | 'gradient-modern';
  goal?: 'sell' | 'inform' | 'engage' | 'convert' | 'inspire';
  language?: string;
  existingContent?: {
    headline?: string;
    subheadline?: string;
    description?: string;
  };
}

export interface GenerateHeroResponse {
  headline: string;
  subheadline: string;
  description: string;
  ctaText: string;
  alternativeHeadlines?: string[];
  alternativeCTAs?: string[];
  cost: number;
  tokensUsed: number;
  provider: string;
}

export async function generateHero(
  data: GenerateHeroRequest
): Promise<GenerateHeroResponse> {
  const response = await api.post<{ success: boolean; data: GenerateHeroResponse }>(
    '/admin/ai/generate-hero',
    data
  );
  return response.data.data;
}

// ============================================================================
// Testimonial Generator
// ============================================================================

export interface GenerateTestimonialsRequest {
  productName: string;
  productType?: string;
  industry?: string;
  targetAudience?: string;
  numberOfTestimonials: number; // 3-10
  tone?: 'professional' | 'casual' | 'enthusiastic' | 'technical';
  includeSpecificBenefits?: string[];
  diverseProfiles?: boolean;
  language?: string;
}

export interface GeneratedTestimonial {
  name: string;
  jobTitle?: string;
  company?: string;
  text: string;
  rating: number;
  verified: boolean;
  location?: string;
}

export interface GenerateTestimonialsResponse {
  testimonials: GeneratedTestimonial[];
  cost: number;
  tokensUsed: number;
  provider: string;
}

export async function generateTestimonials(
  data: GenerateTestimonialsRequest
): Promise<GenerateTestimonialsResponse> {
  const response = await api.post<{ success: boolean; data: GenerateTestimonialsResponse }>(
    '/admin/ai/generate-testimonials',
    data
  );
  return response.data.data;
}

// ============================================================================
// Features Generator
// ============================================================================

export interface GenerateFeaturesRequest {
  productOrService: string;
  industry?: string;
  targetAudience?: string;
  numberOfFeatures: number; // 3-8
  focusArea?: 'benefits' | 'technical' | 'competitive' | 'user-experience' | 'mixed';
  tone?: 'professional' | 'friendly' | 'technical' | 'persuasive';
  includeSpecificFeatures?: string[];
  language?: string;
}

export interface GeneratedFeature {
  icon: string;
  title: string;
  description: string;
}

export interface GenerateFeaturesResponse {
  features: GeneratedFeature[];
  cost: number;
  tokensUsed: number;
  provider: string;
}

export async function generateFeatures(
  data: GenerateFeaturesRequest
): Promise<GenerateFeaturesResponse> {
  const response = await api.post<{ success: boolean; data: GenerateFeaturesResponse }>(
    '/admin/ai/generate-features',
    data
  );
  return response.data.data;
}

// ============================================================================
// Bulk Operations
// ============================================================================

export interface BulkOperationRequest {
  operation: 'seo' | 'alt-text' | 'description';
  productIds: number[];
  options?: Record<string, any>;
}

export interface BulkOperationResponse {
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    productId: number;
    success: boolean;
    data?: any;
    error?: string;
  }>;
}

export async function performBulkOperation(
  data: BulkOperationRequest
): Promise<BulkOperationResponse> {
  const response = await api.post<{ success: boolean; data: BulkOperationResponse }>(
    '/admin/ai/bulk-operation',
    data
  );
  return response.data.data;
}

// ============================================================================
// Footer Content Generator
// ============================================================================

export interface GenerateFooterRequest {
  brandName: string;
  brandDescription?: string;
  industry?: string;
  targetAudience?: string;
  businessType?: 'ecommerce' | 'saas' | 'agency' | 'blog' | 'other';
  includeNewsletter?: boolean;
  includeSocial?: boolean;
  availablePages?: Array<{
    label: string;
    url: string;
    type: 'static' | 'cms' | 'legal';
  }>;
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  existingFooter?: any;
  columnsCount?: number;
  style?: 'minimal' | 'comprehensive' | 'balanced';
  tone?: 'professional' | 'friendly' | 'luxury' | 'casual';
  language?: string;
}

export interface GenerateFooterResponse {
  brandName: string;
  brandTagline: string;
  footerColumns: Array<{
    title: string;
    links: Array<{
      label: string;
      url: string;
      openInNewTab: boolean;
    }>;
    displayOrder: number;
  }>;
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
    businessHours?: string;
  };
  socialLinks: Array<{
    platform: string;
    url: string;
    icon: string;
    displayOrder: number;
  }>;
  newsletter: {
    enabled: boolean;
    title: string;
    description: string;
    placeholder: string;
    buttonText: string;
  };
  copyrightText: string;
  bottomLinks: Array<{
    label: string;
    url: string;
    displayOrder: number;
  }>;
  reasoning: string;
  cost: number;
  tokensUsed: number;
  provider: string;
}

export async function generateFooterContent(
  data: GenerateFooterRequest
): Promise<GenerateFooterResponse> {
  const response = await api.post<{ success: boolean; data: GenerateFooterResponse }>(
    '/admin/ai/generate-footer',
    data
  );
  return response.data.data;
}

// ============================================================================
// Footer Translator
// ============================================================================

export interface TranslateFooterRequest {
  fields: {
    brandName?: string;
    brandTagline?: string;
    footerColumns?: Array<{
      title: string;
      links: Array<{
        label: string;
        url: string;
        is_external?: boolean;
      }>;
    }>;
    contactInfo?: {
      address?: {
        label: string;
        street: string;
        city: string;
        country: string;
      };
      email?: string;
      phone?: string;
    };
    newsletterTitle?: string;
    newsletterDescription?: string;
    newsletterPlaceholder?: string;
    newsletterButtonText?: string;
    copyrightText?: string;
    bottomLinks?: Array<{ label: string; url: string }>;
  };
  sourceLanguage: string;
  targetLanguage: string;
  preserveTerms?: string[];
  tone?: 'luxury' | 'professional' | 'casual' | 'friendly';
}

export interface TranslateFooterResponse {
  translatedFields: {
    brandName?: string;
    brandTagline?: string;
    footerColumns?: Array<{
      title: string;
      links: Array<{
        label: string;
        url: string;
        is_external?: boolean;
      }>;
    }>;
    contactInfo?: {
      address?: {
        label: string;
        street: string;
        city: string;
        country: string;
      };
      email?: string;
      phone?: string;
    };
    newsletterTitle?: string;
    newsletterDescription?: string;
    newsletterPlaceholder?: string;
    newsletterButtonText?: string;
    copyrightText?: string;
    bottomLinks?: Array<{ label: string; url: string }>;
  };
  preservedTerms: string[];
  languagePair: string;
  cost: number;
  tokensUsed: number;
  provider: string;
}

export async function translateFooterContent(
  data: TranslateFooterRequest
): Promise<TranslateFooterResponse> {
  const response = await api.post<{ success: boolean; data: TranslateFooterResponse }>(
    '/admin/ai/translate-footer',
    data
  );
  return response.data.data;
}

// ============================================================================
// Attribute Generator
// ============================================================================

export interface GenerateAttributesRequest {
  productCategory: string; // e.g., "Hair Care", "Skin Care", "Makeup"
  productType?: string; // e.g., "Serum", "Shampoo", "Moisturizer"
  brandFocus?: string; // e.g., "Natural", "Luxury", "Professional"
  numberOfAttributes?: number; // Default: 10, Range: 3-20
  existingAttributes?: string[]; // Already defined attribute keys to avoid
}

export interface GeneratedAttribute {
  attributeKey: string;
  attributeLabel: string;
  dataType: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'date';
  isSearchable: boolean;
  isFilterable: boolean;
  isRequired: boolean;
  options?: Array<{ value: string; label: string }>;
  description: string;
  reasoning: string;
}

export interface GenerateAttributesResponse {
  attributes: GeneratedAttribute[];
  industryStandards: {
    category: string;
    recommendedCount: number;
    essentialAttributes: string[];
  };
  reasoning: string;
  cost: number;
  tokensUsed: number;
  provider: string;
}

export async function generateAttributes(
  data: GenerateAttributesRequest
): Promise<GenerateAttributesResponse> {
  const response = await api.post<{ success: boolean; data: GenerateAttributesResponse }>(
    '/admin/ai/generate-attributes',
    data
  );
  return response.data.data;
}

// ============================================================================
// Variant Option Types Generator
// ============================================================================

export interface GenerateVariantOptionsRequest {
  productCategory?: string; // e.g., "Clothing", "Electronics", "Beauty"
  productType?: string; // e.g., "T-Shirt", "Laptop", "Shampoo"
  numberOfOptions?: number; // Default: 5
  existingOptions?: string[]; // Already defined option names to avoid
}

export interface GeneratedVariantOptionType {
  name: string;
  displayOrder: number;
  description: string;
  reasoning: string;
  commonValues: string[];
}

export interface GenerateVariantOptionsResponse {
  options: GeneratedVariantOptionType[];
  categoryGuidelines: {
    category: string;
    recommendedCount: number;
    essentialOptions: string[];
  };
  reasoning: string;
  cost: number;
  tokensUsed: number;
  provider: string;
}

export async function generateVariantOptions(
  data: GenerateVariantOptionsRequest
): Promise<GenerateVariantOptionsResponse> {
  const response = await api.post<{ success: boolean; data: GenerateVariantOptionsResponse }>(
    '/admin/ai/generate-variant-options',
    data
  );
  return response.data.data;
}

// ============================================================================
// Variant Options Values Generator
// ============================================================================

export interface GenerateVariantValuesRequest {
  optionName: string; // e.g., "Size", "Color", "Material", "Scent"
  productCategory?: string; // e.g., "Hair Care", "Clothing", "Electronics"
  productType?: string; // e.g., "Shampoo", "T-Shirt", "Laptop"
  numberOfValues?: number; // Default: 8
  existingValues?: string[]; // Already defined values to avoid
}

export interface GeneratedVariantValue {
  value: string;
  displayName: string;
  sortOrder: number;
  description?: string;
  reasoning: string;
}

export interface GenerateVariantValuesResponse {
  values: GeneratedVariantValue[];
  optionGuidelines: {
    optionName: string;
    recommendedCount: number;
    bestPractices: string[];
  };
  reasoning: string;
  cost: number;
  tokensUsed: number;
  provider: string;
}

export async function generateVariantValues(
  data: GenerateVariantValuesRequest
): Promise<GenerateVariantValuesResponse> {
  const response = await api.post<{ success: boolean; data: GenerateVariantValuesResponse }>(
    '/admin/ai/generate-variant-values',
    data
  );
  return response.data.data;
}
