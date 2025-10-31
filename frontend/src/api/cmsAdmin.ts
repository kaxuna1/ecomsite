// CMS Admin API Client
// Admin-only API calls for CMS management

import api from './client';

export interface CMSPage {
  id: number;
  slug: string;
  title: string;
  metaDescription: string | null;
  metaKeywords: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface CMSBlock {
  id: number;
  pageId: number;
  blockKey: string;
  blockType: string;
  displayOrder: number;
  isEnabled: boolean;
  content: any;
  settings: any;
  createdAt: string;
  updatedAt: string;
}

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
  blockType: string;
  blockKey: string;
  displayOrder: number;
  content: any;
  settings?: any;
  isEnabled?: boolean;
}

export interface UpdateBlockPayload {
  blockType?: string;
  blockKey?: string;
  displayOrder?: number;
  content?: any;
  settings?: any;
  isEnabled?: boolean;
}

// ============================================================================
// PAGE MANAGEMENT
// ============================================================================

/**
 * Fetch all CMS pages
 */
export async function fetchCMSPages(): Promise<CMSPage[]> {
  const response = await api.get<CMSPage[]>('/cms/pages');
  return response.data;
}

/**
 * Fetch a single page by ID
 */
export async function fetchCMSPage(pageId: number): Promise<CMSPage> {
  const response = await api.get<CMSPage>(`/cms/pages/${pageId}`);
  return response.data;
}

/**
 * Create a new CMS page
 */
export async function createCMSPage(payload: CreatePagePayload): Promise<CMSPage> {
  const response = await api.post<CMSPage>('/cms/pages', payload);
  return response.data;
}

/**
 * Update a CMS page
 */
export async function updateCMSPage(pageId: number, payload: UpdatePagePayload): Promise<CMSPage> {
  const response = await api.patch<CMSPage>(`/cms/pages/${pageId}`, payload);
  return response.data;
}

/**
 * Delete a CMS page
 */
export async function deleteCMSPage(pageId: number): Promise<void> {
  await api.delete(`/cms/pages/${pageId}`);
}

/**
 * Create a page with blocks from a template
 */
export async function createCMSPageWithBlocks(
  pagePayload: CreatePagePayload,
  blocks: Array<{ blockType: string; blockKey: string; content: any; displayOrder: number }>
): Promise<CMSPage> {
  // First create the page
  const newPage = await createCMSPage(pagePayload);

  // Then create all blocks for the page
  if (blocks.length > 0) {
    await Promise.all(
      blocks.map(block =>
        createCMSBlock({
          pageId: newPage.id,
          blockType: block.blockType,
          blockKey: block.blockKey,
          displayOrder: block.displayOrder,
          content: block.content,
          isEnabled: true
        })
      )
    );
  }

  return newPage;
}

// ============================================================================
// BLOCK MANAGEMENT
// ============================================================================

/**
 * Fetch blocks for a page
 */
export async function fetchPageBlocks(pageId: number): Promise<CMSBlock[]> {
  const response = await api.get<CMSBlock[]>(`/cms/blocks`, {
    params: { pageId }
  });
  return response.data;
}

/**
 * Fetch a single block by ID
 */
export async function fetchCMSBlock(blockId: number): Promise<CMSBlock> {
  const response = await api.get<CMSBlock>(`/cms/blocks/${blockId}`);
  return response.data;
}

/**
 * Create a new block
 */
export async function createCMSBlock(payload: CreateBlockPayload): Promise<CMSBlock> {
  const response = await api.post<CMSBlock>('/cms/blocks', payload);
  return response.data;
}

/**
 * Update a block
 */
export async function updateCMSBlock(blockId: number, payload: UpdateBlockPayload): Promise<CMSBlock> {
  const response = await api.patch<CMSBlock>(`/cms/blocks/${blockId}`, payload);
  return response.data;
}

/**
 * Delete a block
 */
export async function deleteCMSBlock(blockId: number): Promise<void> {
  await api.delete(`/cms/blocks/${blockId}`);
}

/**
 * Reorder blocks on a page
 */
export async function reorderCMSBlocks(
  pageId: number,
  blockOrders: Array<{ blockId: number; displayOrder: number }>
): Promise<CMSBlock[]> {
  const response = await api.post<CMSBlock[]>('/cms/blocks/reorder', {
    pageId,
    blockOrders
  });
  return response.data;
}

// ============================================================================
// FOOTER SETTINGS MANAGEMENT
// ============================================================================

export interface FooterColumn {
  title: string;
  links: Array<{
    label: string;
    url: string;
    is_external?: boolean;
  }>;
}

export interface FooterContactInfo {
  address?: {
    label: string;
    street: string;
    city: string;
    country: string;
  };
  email?: string;
  phone?: string;
}

export interface FooterSocialLink {
  platform: string;
  url: string;
  icon: string;
  is_enabled: boolean;
}

export interface FooterSettings {
  id: number;
  brandName: string;
  brandTagline: string | null;
  brandLogoUrl: string | null;
  footerColumns: FooterColumn[];
  contactInfo: FooterContactInfo;
  socialLinks: FooterSocialLink[];
  newsletterEnabled: boolean;
  newsletterTitle: string;
  newsletterDescription: string;
  newsletterPlaceholder: string;
  newsletterButtonText: string;
  copyrightText: string | null;
  bottomLinks: Array<{ label: string; url: string }>;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  layoutType: string;
  columnsCount: number;
  showDividers: boolean;
  isPublished: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface UpdateFooterPayload {
  brandName?: string;
  brandTagline?: string;
  brandLogoUrl?: string;
  footerColumns?: FooterColumn[];
  contactInfo?: FooterContactInfo;
  socialLinks?: FooterSocialLink[];
  newsletterEnabled?: boolean;
  newsletterTitle?: string;
  newsletterDescription?: string;
  newsletterPlaceholder?: string;
  newsletterButtonText?: string;
  copyrightText?: string;
  bottomLinks?: Array<{ label: string; url: string }>;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  layoutType?: string;
  columnsCount?: number;
  showDividers?: boolean;
  isPublished?: boolean;
}

/**
 * Fetch footer settings for admin editing with translations
 * @param language - Language code (default: 'en')
 */
export async function fetchFooterSettings(language: string = 'en'): Promise<FooterSettings> {
  console.log('🔍 API: fetchFooterSettings called with language:', language);
  const response = await api.get<FooterSettings>('/cms/admin/footer', {
    params: { lang: language }
  });
  console.log('✅ API: fetchFooterSettings response received');
  return response.data;
}

/**
 * Update footer settings (base/English values only)
 */
export async function updateFooterSettings(payload: UpdateFooterPayload): Promise<FooterSettings> {
  const response = await api.put<FooterSettings>('/cms/admin/footer', payload);
  return response.data;
}

// ============================================================================
// FOOTER TRANSLATIONS
// ============================================================================

export interface FooterTranslation {
  id: number;
  footerSettingsId: number;
  languageCode: string;
  brandName: string | null;
  brandTagline: string | null;
  footerColumns: FooterColumn[] | null;
  contactInfo: FooterContactInfo | null;
  newsletterTitle: string | null;
  newsletterDescription: string | null;
  newsletterPlaceholder: string | null;
  newsletterButtonText: string | null;
  copyrightText: string | null;
  bottomLinks: Array<{ label: string; url: string }> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFooterTranslationPayload {
  brandName?: string;
  brandTagline?: string;
  footerColumns?: FooterColumn[];
  contactInfo?: FooterContactInfo;
  newsletterTitle?: string;
  newsletterDescription?: string;
  newsletterPlaceholder?: string;
  newsletterButtonText?: string;
  copyrightText?: string;
  bottomLinks?: Array<{ label: string; url: string }>;
}

/**
 * Fetch all translations for footer settings
 */
export async function fetchFooterTranslations(): Promise<FooterTranslation[]> {
  const response = await api.get<FooterTranslation[]>('/cms/admin/footer/translations');
  return response.data;
}

/**
 * Fetch a specific footer translation
 * @param languageCode - Language code
 */
export async function fetchFooterTranslation(languageCode: string): Promise<FooterTranslation> {
  const response = await api.get<FooterTranslation>(`/cms/admin/footer/translations/${languageCode}`);
  return response.data;
}

/**
 * Create or update a footer translation
 * @param languageCode - Language code
 * @param payload - Translation data
 */
export async function createFooterTranslation(
  languageCode: string,
  payload: CreateFooterTranslationPayload
): Promise<FooterTranslation> {
  const response = await api.post<FooterTranslation>(
    `/cms/admin/footer/translations/${languageCode}`,
    payload
  );
  return response.data;
}
