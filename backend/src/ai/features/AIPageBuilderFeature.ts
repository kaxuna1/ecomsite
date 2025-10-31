/**
 * AI Page Builder Feature
 *
 * Generates complete CMS pages from natural language prompts
 * Supports full page generation and individual block regeneration
 */

import { IAIFeature, FeatureOptions, GenerateTextParams } from '../types';
import { AIServiceManager } from '../AIServiceManager';
import {
  BlockType,
  BlockContent,
  HeroContent,
  FeaturesContent,
  TestimonialsContent,
  NewsletterContent,
  CTAContent,
  TextImageContent,
  StatsContent,
  ProductShowcaseContent
} from '../../types/cms';

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

export interface GeneratedPage {
  title: string;
  slug: string;
  metaDescription: string;
  blocks: Array<{
    blockType: BlockType;
    blockKey: string;
    displayOrder: number;
    content: BlockContent;
    reasoning?: string;
  }>;
}

export interface BlockRegenerationPrompt {
  blockType: BlockType;
  currentContent: BlockContent;
  feedback: string;
  pageContext?: string;
}

export class AIPageBuilderFeature implements IAIFeature {
  name = 'ai-page-builder';
  description = 'Generate complete CMS pages from natural language descriptions';
  version = '1.0.0';

  constructor(private aiManager: AIServiceManager) {}

  async execute(input: any, options?: FeatureOptions): Promise<any> {
    if (this.isPagePrompt(input)) {
      return await this.generatePage(input, options);
    } else if (this.isBlockRegenerationPrompt(input)) {
      return await this.regenerateBlock(input, options);
    } else {
      throw new Error('Invalid input type for AI Page Builder');
    }
  }

  /**
   * Generate a complete page from a prompt
   */
  async generatePage(prompt: PagePrompt, options?: FeatureOptions): Promise<GeneratedPage> {
    console.log('[AI Page Builder] Generating page from prompt:', prompt.description);

    // Step 1: Generate page structure and metadata
    const pageStructure = await this.generatePageStructure(prompt, options);

    // Step 2: Generate content for each block
    const blocksWithContent = await Promise.all(
      pageStructure.blocks.map(async (block, index) => {
        const blockContent = await this.generateBlockContent(
          block.blockType,
          block.contentGuidance,
          prompt,
          pageStructure.pageContext,
          options
        );

        return {
          blockType: block.blockType,
          blockKey: `${block.blockType}-${Date.now()}-${index}`,
          displayOrder: index + 1,
          content: blockContent,
          reasoning: block.reasoning
        };
      })
    );

    return {
      title: pageStructure.title,
      slug: pageStructure.slug,
      metaDescription: pageStructure.metaDescription,
      blocks: blocksWithContent
    };
  }

  /**
   * Regenerate a specific block with feedback
   */
  async regenerateBlock(
    prompt: BlockRegenerationPrompt,
    options?: FeatureOptions
  ): Promise<BlockContent> {
    console.log('[AI Page Builder] Regenerating block:', prompt.blockType);

    const systemPrompt = this.getBlockRegenerationSystemPrompt(prompt.blockType);
    const userPrompt = `
Current Block Content:
${JSON.stringify(prompt.currentContent, null, 2)}

${prompt.pageContext ? `Page Context: ${prompt.pageContext}\n` : ''}

User Feedback: ${prompt.feedback}

Please regenerate this ${prompt.blockType} block incorporating the user's feedback while maintaining the block's structure and purpose.
Return ONLY valid JSON matching the block type's schema.
    `.trim();

    const response = await this.aiManager.generateText(
      {
        prompt: userPrompt,
        systemPrompt,
        temperature: 0.8,
        maxTokens: 2000,
        metadata: { feature: this.name, action: 'regenerate-block' }
      },
      options
    );

    return this.parseBlockContent(response.content, prompt.blockType);
  }

  /**
   * Generate page structure (metadata and block types)
   */
  private async generatePageStructure(
    prompt: PagePrompt,
    options?: FeatureOptions
  ): Promise<{
    title: string;
    slug: string;
    metaDescription: string;
    pageContext: string;
    blocks: Array<{
      blockType: BlockType;
      contentGuidance: string;
      reasoning: string;
    }>;
  }> {
    const systemPrompt = `You are an expert web designer and UX specialist. Generate page structures for a luxury e-commerce website.

Available Block Types:
- hero: Large banner with headline, description, CTA, and background image
- features: Grid of features with icons, titles, and descriptions
- products: Product showcase (grid/carousel) with selection methods
- testimonials: Customer reviews with ratings and avatars
- newsletter: Email signup form with title and description
- cta: Call-to-action section with buttons
- text_image: Two-column content with text and image
- stats: Number highlights with labels
- social_proof: Logos, badges, certifications

${prompt.existingBranding ? `
Brand Information:
- Company: ${prompt.existingBranding.companyName || 'Luxia Products'}
- Tagline: ${prompt.existingBranding.tagline || 'Premium scalp & hair care'}
- Values: ${(prompt.existingBranding.values || []).join(', ')}
- Brand Colors: ${(prompt.existingBranding.colors || []).join(', ')}
` : ''}

Generate a page structure that:
1. Follows modern web design best practices
2. Creates a logical content flow
3. Includes appropriate block types for the page purpose
4. Provides guidance for content generation of each block

Respond with ONLY valid JSON (no markdown, no explanations).`;

    const userPrompt = `
Page Type: ${prompt.pageType || 'custom'}
Tone: ${prompt.tone || 'professional'}
${prompt.audience ? `Target Audience: ${prompt.audience}` : ''}
${prompt.goals && prompt.goals.length > 0 ? `Goals: ${prompt.goals.join(', ')}` : ''}

Description: ${prompt.description}

Generate a page structure with the following JSON schema:
{
  "title": "Page title",
  "slug": "url-friendly-slug",
  "metaDescription": "SEO description (150-160 chars)",
  "pageContext": "Brief description of page purpose for content generation",
  "blocks": [
    {
      "blockType": "hero|features|products|testimonials|newsletter|cta|text_image|stats|social_proof",
      "contentGuidance": "What this block should convey to users",
      "reasoning": "Why this block is included"
    }
  ]
}
    `.trim();

    const response = await this.aiManager.generateText(
      {
        prompt: userPrompt,
        systemPrompt,
        temperature: 0.7,
        maxTokens: 1500,
        metadata: { feature: this.name, action: 'generate-structure' }
      },
      options
    );

    console.log('[AI Page Builder] AI response:', JSON.stringify(response, null, 2));

    if (!response || !response.content) {
      throw new Error('Invalid AI response: missing content property');
    }

    return this.parseJSON(response.content);
  }

  /**
   * Generate content for a specific block type
   */
  private async generateBlockContent(
    blockType: BlockType,
    contentGuidance: string,
    pagePrompt: PagePrompt,
    pageContext: string,
    options?: FeatureOptions
  ): Promise<BlockContent> {
    const systemPrompt = this.getBlockSystemPrompt(blockType, pagePrompt);
    const userPrompt = `
Page Context: ${pageContext}
Block Purpose: ${contentGuidance}
Tone: ${pagePrompt.tone || 'professional'}

Generate engaging, conversion-focused content for this ${blockType} block.
Respond with ONLY valid JSON matching the block schema (no markdown, no explanations).
    `.trim();

    const response = await this.aiManager.generateText(
      {
        prompt: userPrompt,
        systemPrompt,
        temperature: 0.8,
        maxTokens: 1500,
        metadata: { feature: this.name, action: `generate-${blockType}` }
      },
      options
    );

    return this.parseBlockContent(response.content, blockType);
  }

  /**
   * Get system prompt for block generation
   */
  private getBlockSystemPrompt(blockType: BlockType, pagePrompt: PagePrompt): string {
    const brandContext = pagePrompt.existingBranding
      ? `Brand: ${pagePrompt.existingBranding.companyName || 'Luxia Products'}
Tagline: ${pagePrompt.existingBranding.tagline || ''}`
      : '';

    const schemas: Record<BlockType, string> = {
      hero: `Generate hero block content. ${brandContext}

Schema:
{
  "type": "hero",
  "headline": "Compelling headline (max 60 chars)",
  "subheadline": "Supporting text (max 120 chars)",
  "description": "Brief description (optional)",
  "ctaText": "Action button text (max 30 chars)",
  "ctaLink": "/relevant-page",
  "backgroundImage": "/uploads/cms/hero-image.webp",
  "backgroundImageAlt": "Descriptive alt text",
  "overlayOpacity": 40,
  "textAlignment": "center"
}`,
      features: `Generate features block content. ${brandContext}

Schema:
{
  "type": "features",
  "title": "Section title",
  "subtitle": "Section subtitle (optional)",
  "features": [
    {
      "id": "unique-id",
      "icon": "✨",
      "title": "Feature title",
      "description": "Feature description (max 150 chars)"
    }
  ],
  "columns": 3
}

Include 3-6 features.`,
      products: `Generate product showcase block. ${brandContext}

Schema:
{
  "type": "products",
  "title": "Section title",
  "subtitle": "Section subtitle (optional)",
  "selectionMethod": "featured",
  "displayStyle": "grid",
  "columns": 4,
  "maxProducts": 8,
  "showElements": {
    "image": true,
    "title": true,
    "price": true,
    "addToCart": true,
    "rating": true
  },
  "sortBy": "popularity",
  "ctaText": "View All Products",
  "ctaLink": "/products",
  "showCta": true
}`,
      testimonials: `Generate testimonials block. ${brandContext}

Schema:
{
  "type": "testimonials",
  "title": "Section title",
  "subtitle": "Section subtitle (optional)",
  "testimonials": [
    {
      "id": "unique-id",
      "name": "Customer name",
      "role": "Customer role/title (optional)",
      "avatar": "/uploads/cms/avatar.webp",
      "rating": 5,
      "text": "Testimonial text (max 200 chars)"
    }
  ],
  "displayStyle": "grid"
}

Include 3-6 testimonials.`,
      newsletter: `Generate newsletter signup block. ${brandContext}

Schema:
{
  "type": "newsletter",
  "title": "Compelling title",
  "description": "Value proposition for signing up",
  "buttonText": "Subscribe",
  "placeholderText": "Enter your email",
  "successMessage": "Thanks for subscribing!",
  "backgroundImage": "/uploads/cms/newsletter-bg.webp"
}`,
      cta: `Generate call-to-action block. ${brandContext}

Schema:
{
  "type": "cta",
  "title": "Compelling CTA title",
  "description": "Supporting description",
  "primaryButtonText": "Primary action",
  "primaryButtonLink": "/primary-link",
  "secondaryButtonText": "Secondary action (optional)",
  "secondaryButtonLink": "/secondary-link",
  "backgroundColor": "#f7ede2",
  "backgroundImage": "/uploads/cms/cta-bg.webp"
}`,
      text_image: `Generate text + image block. ${brandContext}

Schema:
{
  "type": "text_image",
  "title": "Section title",
  "content": "<p>Rich HTML content with formatting</p>",
  "image": "/uploads/cms/content-image.webp",
  "imageAlt": "Descriptive alt text",
  "imagePosition": "right",
  "ctaText": "Learn More",
  "ctaLink": "/learn-more"
}`,
      stats: `Generate statistics block. ${brandContext}

Schema:
{
  "type": "stats",
  "title": "Section title (optional)",
  "stats": [
    {
      "id": "unique-id",
      "value": "10K+",
      "label": "Stat label",
      "icon": "📈"
    }
  ],
  "columns": 4
}

Include 3-4 stats.`,
      social_proof: `Generate social proof block. ${brandContext}

Schema:
{
  "type": "social_proof",
  "title": "Section title",
  "items": [
    {
      "id": "unique-id",
      "image": "/uploads/cms/logo.webp",
      "name": "Brand/certification name",
      "link": "https://example.com"
    }
  ],
  "displayStyle": "grid"
}

Include 4-8 logos/badges.`
    };

    return schemas[blockType] || 'Generate block content in valid JSON format.';
  }

  /**
   * Get system prompt for block regeneration
   */
  private getBlockRegenerationSystemPrompt(blockType: BlockType): string {
    return `You are a web content specialist. Regenerate ${blockType} block content based on user feedback.
Maintain the block structure while improving the content according to feedback.
Respond with ONLY valid JSON (no markdown, no explanations).`;
  }

  /**
   * Parse and validate block content
   */
  private parseBlockContent(text: string, blockType: BlockType): BlockContent {
    const parsed = this.parseJSON(text);

    // Ensure type property matches
    if (parsed.type !== blockType) {
      parsed.type = blockType;
    }

    // Basic validation (extend as needed)
    if (!parsed.type) {
      throw new Error('Block content missing type property');
    }

    return parsed as BlockContent;
  }

  /**
   * Parse JSON from AI response (handles markdown code blocks)
   */
  private parseJSON(content: string): any {
    if (!content) {
      throw new Error('AI response content is undefined or empty');
    }

    // Remove markdown code blocks if present
    let cleaned = content.trim();

    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }

    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }

    cleaned = cleaned.trim();

    try {
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('[AI Page Builder] Failed to parse JSON:', cleaned);
      throw new Error(`Invalid JSON response from AI: ${error.message}`);
    }
  }

  /**
   * Type guards
   */
  private isPagePrompt(input: any): input is PagePrompt {
    return typeof input === 'object' && 'description' in input;
  }

  private isBlockRegenerationPrompt(input: any): input is BlockRegenerationPrompt {
    return typeof input === 'object' && 'blockType' in input && 'feedback' in input;
  }
}
