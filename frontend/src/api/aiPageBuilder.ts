/**
 * AI Page Builder API Client
 *
 * Frontend API client for AI-powered page generation
 */

import client from './client';

export interface PagePrompt {
  description: string;
  pageType?: 'landing' | 'about' | 'service' | 'product' | 'blog' | 'contact' | 'custom';
  tone?: 'professional' | 'casual' | 'friendly' | 'formal' | 'playful' | 'luxury';
  audience?: string;
  goals?: string[];
  existingBranding?: {
    companyName?: string;
    tagline?: string;
    values?: string[];
    colors?: string[];
  };
}

export interface GeneratedBlock {
  blockType: string;
  blockKey: string;
  displayOrder: number;
  content: any;
  reasoning?: string;
}

export interface GeneratedPage {
  title: string;
  slug: string;
  metaDescription: string;
  blocks: GeneratedBlock[];
}

export interface GeneratePageResult {
  pageId: number;
  page: GeneratedPage;
  blockIds: number[];
  message: string;
}

export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  pageType: string;
  tone: string;
  promptTemplate: string;
  suggestedBlocks: string[];
}

export interface CostEstimate {
  estimatedTokens: number;
  estimatedCostUSD: number;
  estimatedTime: string;
}

/**
 * Generate a complete CMS page from a prompt
 */
export async function generatePageFromPrompt(
  prompt: PagePrompt,
  autoPublish: boolean = false
): Promise<GeneratePageResult> {
  const response = await client.post('/ai/pages/generate', {
    prompt,
    autoPublish
  });
  return response.data.data;
}

/**
 * Generate multiple page variations
 */
export async function generatePageVariations(
  prompt: PagePrompt,
  count: number = 3
): Promise<{ variations: GeneratedPage[]; count: number }> {
  const response = await client.post('/ai/pages/variations', {
    prompt,
    count
  });
  return response.data.data;
}

/**
 * Estimate cost and time for page generation
 */
export async function estimatePageGenerationCost(
  prompt: PagePrompt
): Promise<CostEstimate> {
  const response = await client.post('/ai/pages/estimate', {
    prompt
  });
  return response.data.data;
}

/**
 * Regenerate a specific block with feedback
 */
export async function regenerateBlockWithFeedback(
  blockId: number,
  feedback: string,
  pageContext?: string
): Promise<{ blockId: number; content: any; message: string }> {
  const response = await client.post(`/ai/blocks/${blockId}/regenerate`, {
    feedback,
    pageContext
  });
  return response.data.data;
}

/**
 * Get predefined page templates
 */
export async function getPageTemplates(): Promise<PageTemplate[]> {
  const response = await client.get('/ai/pages/templates');
  return response.data.data.templates;
}
