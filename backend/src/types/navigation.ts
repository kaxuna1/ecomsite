// Navigation Menu Types

export type LinkType = 'internal' | 'external' | 'cms_page' | 'none';

export interface MenuLocation {
  id: number;
  code: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItem {
  id: number;
  locationId: number;
  parentId: number | null;
  label: string;
  linkType: LinkType;
  linkUrl: string | null;
  cmsPageId: number | null;
  displayOrder: number;
  isEnabled: boolean;
  openInNewTab: boolean;
  cssClass: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItemTranslation {
  id: number;
  menuItemId: number;
  languageCode: string;
  label: string;
  createdAt: Date;
  updatedAt: Date;
}

// Hierarchical menu item with children
export interface MenuItemHierarchical {
  id: number;
  locationId: number;
  parentId: number | null;
  label: string;
  linkType: LinkType;
  linkUrl: string | null;
  cmsPageId: number | null;
  cmsPageSlug?: string | null;  // Populated from join with cms_pages
  displayOrder: number;
  isEnabled: boolean;
  openInNewTab: boolean;
  cssClass: string | null;
  children: MenuItemHierarchical[];
}

// Public API response for menu (with translations applied)
export interface PublicMenuResponse {
  location: string;
  items: MenuItemHierarchical[];
}

// Admin detail response (includes translations for all languages)
export interface MenuItemDetail extends MenuItem {
  translations: MenuItemTranslation[];
}

// Request payloads
export interface CreateMenuItemPayload {
  locationId: number;
  parentId?: number | null;
  label: string;
  linkType: LinkType;
  linkUrl?: string | null;
  cmsPageId?: number | null;
  displayOrder?: number;
  isEnabled?: boolean;
  openInNewTab?: boolean;
  cssClass?: string | null;
}

export interface UpdateMenuItemPayload {
  parentId?: number | null;
  label?: string;
  linkType?: LinkType;
  linkUrl?: string | null;
  cmsPageId?: number | null;
  displayOrder?: number;
  isEnabled?: boolean;
  openInNewTab?: boolean;
  cssClass?: string | null;
}

export interface CreateMenuItemTranslationPayload {
  label: string;
}

export interface ReorderMenuItemsPayload {
  items: Array<{
    id: number;
    displayOrder: number;
  }>;
}

// Page suggestion for autocomplete/picker
export interface PageSuggestion {
  type: 'static' | 'cms';
  label: string;
  url: string;
  cmsPageId?: number;
}
