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
