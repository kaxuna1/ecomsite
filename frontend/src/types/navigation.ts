export type LinkType = 'internal' | 'external' | 'cms_page' | 'none';

export interface MenuItemHierarchical {
  id: number;
  label: string;
  linkType: LinkType;
  linkUrl: string | null;
  cmsPageId: number | null;
  cmsPageSlug?: string | null;
  openInNewTab: boolean;
  children: MenuItemHierarchical[];
}

export interface PublicMenuResponse {
  location: string;
  items: MenuItemHierarchical[];
}

export interface PageSuggestion {
  type: 'static' | 'cms';
  label: string;
  url: string;
  cmsPageId?: number;
}

export interface MenuLocation {
  id: number;
  name: string;
  identifier: string;
  description: string | null;
}

export interface MenuItem {
  id: number;
  locationId: number;
  label: string;
  linkType: LinkType;
  linkUrl: string | null;
  cmsPageId: number | null;
  parentId: number | null;
  displayOrder: number;
  openInNewTab: boolean;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMenuItemPayload {
  locationId: number;
  label: string;
  linkType: LinkType;
  linkUrl?: string | null;
  cmsPageId?: number | null;
  parentId?: number | null;
  displayOrder?: number;
  openInNewTab?: boolean;
  isEnabled?: boolean;
}

export interface UpdateMenuItemPayload {
  label?: string;
  linkType?: LinkType;
  linkUrl?: string | null;
  cmsPageId?: number | null;
  parentId?: number | null;
  displayOrder?: number;
  openInNewTab?: boolean;
  isEnabled?: boolean;
}

export interface ReorderPayload {
  items: Array<{
    id: number;
    displayOrder: number;
  }>;
}

export interface MenuItemTranslationPayload {
  label: string;
}

// AI Navigation Generation Types
export interface PageInfo {
  type: 'static' | 'cms' | 'category';
  label: string;
  url: string;
  cmsPageId?: number;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface NavigationGenerationInput {
  locationCode: 'header' | 'footer' | 'mobile';
  availablePages: PageInfo[];
  maxTopLevelItems?: number;
  maxNestingDepth?: number;
  brandName?: string;
  brandDescription?: string;
  targetAudience?: string;
  style?: 'minimal' | 'comprehensive' | 'balanced';
  language?: string;
}

export interface GeneratedMenuItem {
  label: string;
  linkType: LinkType;
  linkUrl: string | null;
  cmsPageId: number | null;
  openInNewTab: boolean;
  displayOrder: number;
  children?: GeneratedMenuItem[];
  reasoning?: string;
}

export interface NavigationGenerationOutput {
  locationCode: string;
  menuItems: GeneratedMenuItem[];
  reasoning: string;
  cost: number;
  tokensUsed: number;
  provider: string;
}

// AI Menu Translation Types
export interface MenuItemToTranslate {
  id: number;
  label: string;
  linkType: string;
  context?: string;
}

export interface MenuTranslationInput {
  menuItems: MenuItemToTranslate[];
  targetLanguage: string;
  targetLanguageNative?: string;
  sourceLanguage?: string;
  brandName?: string;
  style?: 'formal' | 'casual' | 'professional';
}

export interface TranslatedMenuItem {
  id: number;
  label: string;
  originalLabel: string;
}

export interface MenuTranslationOutput {
  translatedItems: TranslatedMenuItem[];
  notes?: string;
  cost: number;
  tokensUsed: number;
  provider: string;
}
