// Theme System TypeScript Interfaces
// Design tokens and theme configuration types

export interface DesignTokens {
  version?: string;
  metadata?: {
    displayName?: string;
    description?: string;
    author?: string;
    category?: string;
  };
  color: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  border: BorderTokens;
  shadow: ShadowTokens;
  gradient?: GradientTokens;
}

export interface ColorTokens {
  brand: {
    primary: string;
    secondary: string;
    accent: string;
  };
  semantic: {
    background: {
      primary: string;
      secondary: string;
      elevated: string;
      overlay?: string;
    };
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      inverse: string;
    };
    border: {
      default: string;
      strong: string;
    };
    interactive: {
      default: string;
      hover: string;
      active: string;
      disabled: string;
    };
    feedback: {
      success: string;
      warning: string;
      error: string;
      info: string;
    };
  };
}

export interface TypographyTokens {
  fontFamily: {
    display: string;
    body: string;
    mono: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl'?: string;
    '7xl'?: string;
    '8xl'?: string;
    '9xl'?: string;
  };
  fontWeight: {
    light: string;
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
    extrabold?: string;
  };
  lineHeight: {
    tight: string;
    normal: string;
    relaxed: string;
    loose?: string;
  };
  letterSpacing: {
    tight: string;
    normal: string;
    wide: string;
    wider: string;
    widest?: string;
  };
}

export interface SpacingTokens {
  preset: 'compact' | 'normal' | 'spacious';
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
}

export interface BorderTokens {
  width: {
    none?: string;
    thin: string;
    medium: string;
    thick: string;
  };
  radius: {
    none?: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl'?: string;
    full: string;
  };
}

export interface ShadowTokens {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl'?: string;
  inner?: string;
}

export interface GradientTokens {
  brand?: {
    primary?: string;
  };
  preset?: {
    [key: string]: string;
  };
}

export interface Theme {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  tokens: DesignTokens;
  isActive: boolean;
  isSystemTheme: boolean;
  createdBy?: number;
  updatedBy?: number;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  parentThemeId?: number;
  thumbnailUrl?: string;
}

export interface ThemePreset {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  category?: string;
  tokens: DesignTokens;
  thumbnailUrl?: string;
  previewUrl?: string;
  isFeatured: boolean;
  displayOrder: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ThemeHistory {
  id: number;
  themeId: number;
  action: 'created' | 'updated' | 'activated' | 'deactivated' | 'deleted';
  previousTokens?: DesignTokens;
  newTokens?: DesignTokens;
  adminUserId?: number;
  adminUserEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  changeSummary?: string;
  createdAt: Date;
}

export interface FontLibraryItem {
  id: number;
  name: string;
  displayName: string;
  source: 'google' | 'adobe' | 'custom' | 'system';
  fontUrl?: string;
  category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';
  weights: number[];
  styles: string[];
  isSystemFont: boolean;
  isPremium: boolean;
  previewText: string;
  createdAt: Date;
}

// Input/Output types for API
export interface CreateThemeInput {
  name: string;
  displayName: string;
  description?: string;
  tokens: DesignTokens;
  parentThemeId?: number;
}

export interface UpdateThemeInput {
  displayName?: string;
  description?: string;
  tokens?: DesignTokens;
}

export interface ThemeListResponse {
  themes: Theme[];
  activeTheme?: {
    id: number;
    name: string;
  };
}

export interface ThemeDetailResponse {
  theme: Theme;
  css: string;
}

export interface ActiveThemeResponse {
  name: string;
  tokens: DesignTokens;
  css: string;
}
