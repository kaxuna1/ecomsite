// CMS Type Definitions
// Comprehensive types for the block-based CMS system

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export type BlockType =
  | 'hero'
  | 'features'
  | 'products'
  | 'testimonials'
  | 'newsletter'
  | 'cta'
  | 'text_image'
  | 'stats'
  | 'social_proof';

export type PageStatus = 'draft' | 'published';

// ============================================================================
// DATABASE ENTITIES
// ============================================================================

export interface CMSPage {
  id: number;
  slug: string;
  title: string;
  metaDescription: string | null;
  metaKeywords: string | null;
  isPublished: boolean;
  publishedAt: Date | null;
  createdBy: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CMSBlock {
  id: number;
  pageId: number;
  blockType: BlockType;
  blockKey: string;
  displayOrder: number;
  isEnabled: boolean;
  content: BlockContent;
  settings: BlockSettings | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CMSMedia {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  caption: string | null;
  filePath: string;
  uploadedBy: number | null;
  createdAt: Date;
}

export interface CMSBlockVersion {
  id: number;
  blockId: number;
  content: BlockContent;
  settings: BlockSettings | null;
  versionNumber: number;
  createdBy: number | null;
  createdAt: Date;
}

export interface CMSPageTranslation {
  id: number;
  pageId: number;
  languageCode: string;
  title: string;
  slug: string;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CMSBlockTranslation {
  id: number;
  blockId: number;
  languageCode: string;
  content: BlockContent;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// BLOCK CONTENT TYPES
// ============================================================================

// Base type for all block content
export type BlockContent =
  | HeroContent
  | FeaturesContent
  | ProductShowcaseContent
  | TestimonialsContent
  | NewsletterContent
  | CTAContent
  | TextImageContent
  | StatsContent
  | SocialProofContent;

// Hero Block - Large banner with image, headline, and CTA
export interface HeroContent {
  type: 'hero';
  headline: string;
  subheadline: string;
  description?: string;
  ctaText: string;
  ctaLink: string;
  backgroundImage: string;
  backgroundImageAlt?: string;
  overlayOpacity?: number; // 0-100
  textAlignment?: 'left' | 'center' | 'right';
}

// Features Block - Grid of features with icons
export interface FeaturesContent {
  type: 'features';
  title: string;
  subtitle?: string;
  features: Array<{
    id: string;
    icon: string; // Icon identifier or emoji
    title: string;
    description: string;
  }>;
  columns?: 2 | 3 | 4;
}

// Product Showcase Block - Featured products section
export interface ProductShowcaseContent {
  type: 'products';
  title: string;
  subtitle?: string;
  productIds: number[]; // References to products table
  displayStyle?: 'grid' | 'carousel' | 'featured';
  showPrices?: boolean;
  showAddToCart?: boolean;
  ctaText?: string;
  ctaLink?: string;
}

// Testimonials Block - Customer reviews
export interface TestimonialsContent {
  type: 'testimonials';
  title: string;
  subtitle?: string;
  testimonials: Array<{
    id: string;
    name: string;
    role?: string;
    avatar?: string;
    rating?: number; // 1-5
    text: string;
  }>;
  displayStyle?: 'grid' | 'carousel' | 'masonry';
}

// Newsletter Block - Email signup form
export interface NewsletterContent {
  type: 'newsletter';
  title: string;
  description: string;
  buttonText: string;
  placeholderText?: string;
  successMessage?: string;
  backgroundImage?: string;
}

// CTA Block - Call-to-action section
export interface CTAContent {
  type: 'cta';
  title: string;
  description: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  backgroundColor?: string;
  backgroundImage?: string;
}

// Text + Image Block - Two-column content
export interface TextImageContent {
  type: 'text_image';
  title: string;
  content: string; // HTML or markdown
  image: string;
  imageAlt?: string;
  imagePosition: 'left' | 'right';
  ctaText?: string;
  ctaLink?: string;
}

// Stats Block - Number highlights
export interface StatsContent {
  type: 'stats';
  title?: string;
  stats: Array<{
    id: string;
    value: string; // e.g., "10K+", "99%", "$2M"
    label: string;
    icon?: string;
  }>;
  columns?: 2 | 3 | 4;
}

// Social Proof Block - Logos, badges, certifications
export interface SocialProofContent {
  type: 'social_proof';
  title: string;
  items: Array<{
    id: string;
    image: string;
    name: string;
    link?: string;
  }>;
  displayStyle?: 'grid' | 'marquee';
}

// ============================================================================
// BLOCK SETTINGS
// ============================================================================

export interface BlockSettings {
  // Spacing
  marginTop?: 'none' | 'small' | 'medium' | 'large' | 'xlarge';
  marginBottom?: 'none' | 'small' | 'medium' | 'large' | 'xlarge';
  paddingTop?: 'none' | 'small' | 'medium' | 'large' | 'xlarge';
  paddingBottom?: 'none' | 'small' | 'medium' | 'large' | 'xlarge';

  // Background
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundGradient?: string;

  // Container
  maxWidth?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  containerPadding?: boolean;

  // Animation
  animationEnabled?: boolean;
  animationDelay?: number; // milliseconds
  animationType?: 'fade' | 'slide' | 'scale' | 'none';

  // Visibility
  showOnMobile?: boolean;
  showOnTablet?: boolean;
  showOnDesktop?: boolean;

  // Custom CSS
  customCss?: string;
  customClasses?: string;
}

// ============================================================================
// API REQUEST PAYLOADS
// ============================================================================

export interface CreatePagePayload {
  slug: string;
  title: string;
  metaDescription?: string;
  metaKeywords?: string;
  isPublished?: boolean;
}

export interface UpdatePagePayload {
  slug?: string;
  title?: string;
  metaDescription?: string;
  metaKeywords?: string;
  isPublished?: boolean;
}

export interface CreateBlockPayload {
  pageId: number;
  blockType: BlockType;
  blockKey: string;
  displayOrder: number;
  content: BlockContent;
  settings?: BlockSettings;
  isEnabled?: boolean;
}

export interface UpdateBlockPayload {
  blockType?: BlockType;
  blockKey?: string;
  displayOrder?: number;
  content?: BlockContent;
  settings?: BlockSettings;
  isEnabled?: boolean;
}

export interface ReorderBlocksPayload {
  pageId: number;
  blockOrders: Array<{
    blockId: number;
    displayOrder: number;
  }>;
}

export interface UploadMediaPayload {
  file: Express.Multer.File;
  altText?: string;
  caption?: string;
}

export interface UpdateMediaPayload {
  filename?: string;
  altText?: string;
  caption?: string;
}

export interface CreatePageTranslationPayload {
  title: string;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface CreateBlockTranslationPayload {
  content: BlockContent;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface PageWithBlocksResponse extends CMSPage {
  blocks: CMSBlock[];
}

export interface BlockWithVersionsResponse extends CMSBlock {
  versions: CMSBlockVersion[];
}

export interface MediaUploadResponse extends CMSMedia {
  url: string; // Full URL to access the media
}

export interface PublicPageResponse {
  page: {
    slug: string;
    title: string;
    metaDescription: string | null;
    metaKeywords: string | null;
  };
  blocks: Array<{
    blockType: BlockType;
    blockKey: string;
    content: BlockContent;
    settings: BlockSettings | null;
  }>;
}

// ============================================================================
// QUERY FILTERS
// ============================================================================

export interface PageQueryFilters {
  slug?: string;
  isPublished?: boolean;
  createdBy?: number;
  limit?: number;
  offset?: number;
}

export interface BlockQueryFilters {
  pageId?: number;
  blockType?: BlockType;
  isEnabled?: boolean;
  limit?: number;
  offset?: number;
}

export interface MediaQueryFilters {
  mimeType?: string;
  uploadedBy?: number;
  minWidth?: number;
  minHeight?: number;
  limit?: number;
  offset?: number;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface BlockTypeDefinition {
  type: BlockType;
  label: string;
  description: string;
  icon: string;
  defaultContent: BlockContent;
  defaultSettings: BlockSettings;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface CMSError {
  code: string;
  message: string;
  details?: ValidationError[];
}
