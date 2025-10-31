/**
 * AI Page Builder Service
 *
 * High-level service for generating CMS pages using AI
 * Integrates AIPageBuilderFeature with CMS database operations
 */

import { getAIServiceManager } from '../ai/index.js';
import { AIPageBuilderFeature, PagePrompt, GeneratedPage, BlockRegenerationPrompt } from '../ai/features/AIPageBuilderFeature';
import { createPage, createBlock, updateBlock, getBlockById } from './cmsService';
import { CreatePagePayload, CreateBlockPayload, BlockContent, CMSBlock } from '../types/cms';

export interface GeneratePageOptions {
  prompt: PagePrompt;
  autoPublish?: boolean;
  createdBy?: number;
}

export interface GeneratePageResult {
  pageId: number;
  page: GeneratedPage;
  blockIds: number[];
  message: string;
}

export interface RegenerateBlockOptions {
  blockId: number;
  feedback: string;
  pageContext?: string;
  updatedBy?: number;
}

export interface RegenerateBlockResult {
  blockId: number;
  content: BlockContent;
  message: string;
}

/**
 * Generate a complete CMS page from a prompt
 */
export async function generatePageFromPrompt(
  options: GeneratePageOptions
): Promise<GeneratePageResult> {
  console.log('[AI Page Builder Service] Generating page from prompt');

  // Get AI Service Manager and Page Builder feature
  const aiManager = await getAIServiceManager();
  const pageBuilderFeature = aiManager.getFeature('ai-page-builder') as AIPageBuilderFeature;
  if (!pageBuilderFeature) {
    throw new Error('AI Page Builder feature not initialized');
  }

  // Generate page structure and content
  const generatedPage: GeneratedPage = await pageBuilderFeature.generatePage(
    options.prompt,
    {
      metadata: {
        feature: 'ai-page-builder',
        adminUserId: options.createdBy
      }
    }
  );

  // Create CMS page
  const pagePayload: CreatePagePayload = {
    slug: generatedPage.slug,
    title: generatedPage.title,
    metaDescription: generatedPage.metaDescription,
    isPublished: options.autoPublish || false
  };

  const page = await createPage(pagePayload, options.createdBy);

  // Create blocks
  const blockIds: number[] = [];

  for (const blockData of generatedPage.blocks) {
    const blockPayload: CreateBlockPayload = {
      pageId: page.id,
      blockType: blockData.blockType,
      blockKey: blockData.blockKey,
      displayOrder: blockData.displayOrder,
      content: blockData.content,
      isEnabled: true
    };

    const block = await createBlock(blockPayload, options.createdBy);
    blockIds.push(block.id);
  }

  console.log(
    `[AI Page Builder Service] Created page "${page.title}" with ${blockIds.length} blocks`
  );

  return {
    pageId: page.id,
    page: generatedPage,
    blockIds,
    message: `Successfully generated page "${generatedPage.title}" with ${blockIds.length} blocks`
  };
}

/**
 * Regenerate a specific block with user feedback
 */
export async function regenerateBlockWithFeedback(
  options: RegenerateBlockOptions
): Promise<RegenerateBlockResult> {
  console.log(`[AI Page Builder Service] Regenerating block ${options.blockId}`);

  // Get existing block
  const existingBlock = await getBlockById(options.blockId);
  if (!existingBlock) {
    throw new Error(`Block not found: ${options.blockId}`);
  }

  // Get AI Service Manager and Page Builder feature
  const aiManager = await getAIServiceManager();
  const pageBuilderFeature = aiManager.getFeature('ai-page-builder') as AIPageBuilderFeature;
  if (!pageBuilderFeature) {
    throw new Error('AI Page Builder feature not initialized');
  }

  // Prepare regeneration prompt
  const regenerationPrompt: BlockRegenerationPrompt = {
    blockType: existingBlock.blockType,
    currentContent: existingBlock.content,
    feedback: options.feedback,
    pageContext: options.pageContext
  };

  // Generate new content
  const newContent = await pageBuilderFeature.regenerateBlock(
    regenerationPrompt,
    {
      metadata: {
        feature: 'ai-page-builder',
        adminUserId: options.updatedBy,
        action: 'regenerate-block'
      }
    }
  );

  // Update block with new content
  const updatedBlock = await updateBlock(
    options.blockId,
    { content: newContent },
    options.updatedBy
  );

  console.log(
    `[AI Page Builder Service] Regenerated block ${options.blockId} (${updatedBlock.blockType})`
  );

  return {
    blockId: options.blockId,
    content: newContent,
    message: `Successfully regenerated ${updatedBlock.blockType} block`
  };
}

/**
 * Generate multiple page variations
 */
export async function generatePageVariations(
  prompt: PagePrompt,
  count: number = 3
): Promise<GeneratedPage[]> {
  console.log(`[AI Page Builder Service] Generating ${count} page variations`);

  const aiManager = await getAIServiceManager();
  const pageBuilderFeature = aiManager.getFeature('ai-page-builder') as AIPageBuilderFeature;
  if (!pageBuilderFeature) {
    throw new Error('AI Page Builder feature not initialized');
  }

  const variations: GeneratedPage[] = [];

  for (let i = 0; i < count; i++) {
    const variation = await pageBuilderFeature.generatePage(prompt, {
      metadata: {
        feature: 'ai-page-builder',
        action: `variation-${i + 1}`
      }
    });

    // Ensure unique slugs
    if (i > 0) {
      variation.slug = `${variation.slug}-${i + 1}`;
    }

    variations.push(variation);
  }

  return variations;
}

/**
 * Get page generation cost estimate
 */
export async function estimatePageGenerationCost(prompt: PagePrompt): Promise<{
  estimatedTokens: number;
  estimatedCostUSD: number;
  estimatedTime: string;
}> {
  // Rough estimates based on typical generation patterns
  const baseStructureTokens = 800; // Page structure generation
  const avgBlockTokens = 400; // Average tokens per block
  const typicalBlockCount = 5; // Typical number of blocks

  const estimatedTokens = baseStructureTokens + (avgBlockTokens * typicalBlockCount);

  // Cost estimate (using GPT-4 Turbo pricing as baseline)
  const costPerMillionTokens = 10; // $10 per 1M tokens (approximate)
  const estimatedCostUSD = (estimatedTokens / 1000000) * costPerMillionTokens;

  // Time estimate (assuming 30 tokens/second average)
  const estimatedSeconds = estimatedTokens / 30;

  return {
    estimatedTokens,
    estimatedCostUSD: Math.round(estimatedCostUSD * 10000) / 10000,
    estimatedTime: `${Math.ceil(estimatedSeconds)}s`
  };
}
