import api from './client';

export interface AttributeDefinition {
  id: number;
  attributeKey: string;
  attributeLabel: string;
  dataType: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'date';
  isSearchable: boolean;
  isFilterable: boolean;
  isRequired: boolean;
  validationRules: Record<string, any>;
  options?: Array<{ value: string; label: string }>;
  categoryIds: number[];
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AttributeDefinitionPayload {
  attributeKey: string;
  attributeLabel: string;
  dataType: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'date';
  isSearchable?: boolean;
  isFilterable?: boolean;
  isRequired?: boolean;
  validationRules?: Record<string, any>;
  options?: Array<{ value: string; label: string }>;
  categoryIds?: number[];
  displayOrder?: number;
}

// Get all attribute definitions
export const getAllAttributes = async (): Promise<AttributeDefinition[]> => {
  const response = await api.get<AttributeDefinition[]>('/attributes');
  return response.data;
};

// Get filterable attributes (optionally by category)
export const getFilterableAttributes = async (category?: string): Promise<AttributeDefinition[]> => {
  const params = category ? { category } : {};
  const response = await api.get<AttributeDefinition[]>('/attributes/filterable', { params });
  return response.data;
};

// Get single attribute
export const getAttribute = async (id: number): Promise<AttributeDefinition> => {
  const response = await api.get<AttributeDefinition>(`/attributes/${id}`);
  return response.data;
};

// Get unique values for an attribute
export const getAttributeValues = async (key: string): Promise<string[]> => {
  const response = await api.get<string[]>(`/attributes/${key}/values`);
  return response.data;
};

// Create new attribute (admin only)
export const createAttribute = async (payload: AttributeDefinitionPayload): Promise<AttributeDefinition> => {
  const response = await api.post<AttributeDefinition>('/attributes', payload);
  return response.data;
};

// Update attribute (admin only)
export const updateAttribute = async (id: number, payload: Partial<AttributeDefinitionPayload>): Promise<AttributeDefinition> => {
  const response = await api.put<AttributeDefinition>(`/attributes/${id}`, payload);
  return response.data;
};

// Delete attribute (admin only)
export const deleteAttribute = async (id: number): Promise<void> => {
  await api.delete(`/attributes/${id}`);
};
