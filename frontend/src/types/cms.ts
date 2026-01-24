// CMS Type Definitions for Frontend
// Matches backend types for content blocks

export type BlockType =
  | 'hero'
  | 'features'
  | 'products'
  | 'testimonials'
  | 'newsletter'
  | 'cta'
  | 'text_image'
  | 'stats'
  | 'faq'
  | 'social_proof'
  | 'announcement';

// Page metadata
export interface CMSPage {
  slug: string;
  title: string;
  metaDescription: string | null;
  metaKeywords: string | null;
}

// Base block structure
export interface CMSBlock {
  blockType: BlockType;
  blockKey: string;
  content: BlockContent;
  settings: BlockSettings | null;
}

// Block content types
export type BlockContent =
  | HeroContent
  | FeaturesContent
  | ProductShowcaseContent
  | TestimonialsContent
  | NewsletterContent
  | CTAContent
  | TextImageContent
  | StatsContent
  | SocialProofContent
  | AnnouncementContent;

// Hero Block
export interface HeroContent {
  type: 'hero';
  headline: string;
  subheadline: string;
  description?: string;
  ctaText: string;
  ctaLink: string;
  backgroundImage?: string;
  backgroundImageAlt?: string;
  overlayOpacity?: number;
  textAlignment?: 'left' | 'center' | 'right';
  template?: 'split-screen' | 'centered-minimal' | 'full-width-overlay' | 'asymmetric-bold' | 'luxury-minimal' | 'gradient-modern';
  style?: {
    backgroundColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    textColor?: string;
    headlineSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    minHeight?: 'auto' | 'screen' | '75vh' | '50vh';
    backgroundVideo?: string;
    enableAnimations?: boolean;
  };
}

// Features Block
export interface FeaturesContent {
  type: 'features';
  title: string;
  subtitle?: string;
  features: Array<{
    id: string;
    icon: string;
    title: string;
    description: string;
  }>;
  columns?: 2 | 3 | 4;
}

// Product Showcase Block
export interface ProductShowcaseContent {
  type: 'products';
  title: string;
  subtitle?: string;
  productIds: number[];
  displayStyle?: 'grid' | 'carousel' | 'featured';
  showPrices?: boolean;
  showAddToCart?: boolean;
  ctaText?: string;
  ctaLink?: string;
}

// Testimonials Block
export interface TestimonialsContent {
  type: 'testimonials';
  title: string;
  subtitle?: string;
  testimonials: Array<{
    id: string;
    name: string;
    role?: string;
    avatar?: string;
    rating?: number;
    text: string;
  }>;
  displayStyle?: 'grid' | 'carousel' | 'masonry';
}

// Newsletter Block
export interface NewsletterContent {
  type: 'newsletter';
  title: string;
  description: string;
  buttonText: string;
  placeholderText?: string;
  successMessage?: string;
  backgroundImage?: string;
}

// CTA Block
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

// Text + Image Block
export interface TextImageContent {
  type: 'text_image';
  title: string;
  content: string;
  image: string;
  imageAlt?: string;
  imagePosition: 'left' | 'right';
  ctaText?: string;
  ctaLink?: string;
}

// Stats Block
export interface StatsContent {
  type: 'stats';
  title?: string;
  stats: Array<{
    id: string;
    value: string;
    label: string;
    icon?: string;
  }>;
  columns?: 2 | 3 | 4;
}

// Social Proof Block
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

// Announcement/Promotion Bar Block
export interface AnnouncementContent {
  type: 'announcement';
  message: string;
  linkText?: string;
  linkUrl?: string;
  icon?: string;
  backgroundColor?: string;
  textColor?: string;
  dismissible?: boolean;
}

// Targeting types for global blocks
export type PageType = 'home' | 'products' | 'productDetail' | 'cms' | 'cart' | 'checkout' | 'account';

export interface BlockTargeting {
  enabled: boolean;
  include?: {
    pageTypes?: PageType[];
    routePrefixes?: string[];
    cmsSlugs?: string[];
  };
  exclude?: {
    pageTypes?: PageType[];
    routePrefixes?: string[];
    cmsSlugs?: string[];
  };
}

// Global block from API
export interface GlobalBlock {
  id: number;
  blockType: BlockType;
  blockKey: string;
  content: BlockContent;
  settings: BlockSettings | null;
  displayOrder: number;
}

// Block settings
export interface BlockSettings {
  marginTop?: 'none' | 'small' | 'medium' | 'large' | 'xlarge';
  marginBottom?: 'none' | 'small' | 'medium' | 'large' | 'xlarge';
  paddingTop?: 'none' | 'small' | 'medium' | 'large' | 'xlarge';
  paddingBottom?: 'none' | 'small' | 'medium' | 'large' | 'xlarge';
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundGradient?: string;
  maxWidth?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  containerPadding?: boolean;
  animationEnabled?: boolean;
  animationDelay?: number;
  animationType?: 'fade' | 'slide' | 'scale' | 'none';
  showOnMobile?: boolean;
  showOnTablet?: boolean;
  showOnDesktop?: boolean;
  customCss?: string;
  customClasses?: string;
  targeting?: BlockTargeting;
}

// API response
export interface CMSPageResponse {
  page: CMSPage;
  blocks: CMSBlock[];
}
