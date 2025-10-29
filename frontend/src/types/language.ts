export interface Language {
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
  isEnabled: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface LanguagePayload {
  code: string;
  name: string;
  nativeName: string;
  isDefault?: boolean;
  isEnabled?: boolean;
  displayOrder?: number;
}

export interface UpdateLanguagePayload {
  name?: string;
  nativeName?: string;
  isDefault?: boolean;
  isEnabled?: boolean;
  displayOrder?: number;
}
