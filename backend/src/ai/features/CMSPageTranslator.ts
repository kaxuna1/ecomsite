/**
 * CMS Page Translator
 *
 * Translates CMS page content including page fields and all block content
 * Handles different block types appropriately to preserve structure and formatting
 *
 * Supports all block types: hero, features, text_image, testimonials, stats,
 * newsletter, cta, products, social_proof
 */

import { IAIFeature, FeatureOptions } from '../types';
import { AIServiceManager } from '../AIServiceManager';
import { BlockContent, BlockType } from '../../types/cms';

export interface CMSPageTranslationInput {
  fields: {
    title?: string;
    metaTitle?: string;
    metaDescription?: string;
  };
  blocks: Array<{
    id: number;
    type: BlockType;
    content: BlockContent;
  }>;
  sourceLanguage: string; // ISO code: 'en', 'ka', etc.
  targetLanguage: string;
  preserveTerms?: string[]; // Brand names, technical terms to not translate
  tone?: 'luxury' | 'professional' | 'casual' | 'friendly';
}

export interface CMSPageTranslationOutput {
  translatedFields: {
    title?: string;
    metaTitle?: string;
    metaDescription?: string;
  };
  translatedBlocks: Array<{
    id: number;
    content: BlockContent;
  }>;
  cost: number;
  tokensUsed: number;
  provider: string;
}

export class CMSPageTranslator implements IAIFeature {
  readonly name = 'cms_page_translator';
  readonly description = 'Translate CMS page content including all block types while maintaining structure';
  readonly requiredCapabilities = ['text_generation', 'json_output'];

  constructor(private aiManager: AIServiceManager) {}

  /**
   * Execute CMS page translation
   */
  async execute(
    input: CMSPageTranslationInput,
    options?: FeatureOptions
  ): Promise<CMSPageTranslationOutput> {
    const prompt = this.buildPrompt(input);
    const systemPrompt = this.getSystemPrompt(input);

    const response = await this.aiManager.generateText(
      {
        prompt,
        systemPrompt,
        maxTokens: this.estimateTokensNeeded(input),
        temperature: 0.3, // Lower temperature for consistent translations
        responseFormat: 'json',
        metadata: {
          feature: this.name,
          languagePair: `${input.sourceLanguage}-${input.targetLanguage}`,
          blockCount: input.blocks.length,
        },
      },
      options
    );

    // Parse JSON response
    const result = this.parseResponse(response.content, input);

    return {
      translatedFields: result.translatedFields,
      translatedBlocks: result.translatedBlocks,
      cost: response.cost,
      tokensUsed: response.usage.totalTokens,
      provider: response.provider,
    };
  }

  /**
   * Estimate cost before execution
   */
  async estimateCost(input: CMSPageTranslationInput): Promise<number> {
    const tokens = this.estimateTokensNeeded(input);
    const costPerToken = 0.00001; // GPT-4 Turbo average
    return tokens * costPerToken;
  }

  /**
   * Estimate tokens needed based on content length
   */
  private estimateTokensNeeded(input: CMSPageTranslationInput): number {
    let totalChars = 0;

    // Page fields
    if (input.fields.title) totalChars += input.fields.title.length;
    if (input.fields.metaTitle) totalChars += input.fields.metaTitle.length;
    if (input.fields.metaDescription) totalChars += input.fields.metaDescription.length;

    // Block content (estimate based on JSON stringified size)
    input.blocks.forEach(block => {
      const contentStr = JSON.stringify(block.content);
      totalChars += contentStr.length;
    });

    // Rough estimate: 1 token ≈ 4 characters
    // Add overhead for prompt and response structure
    const contentTokens = Math.ceil(totalChars / 4);
    const promptTokens = 1200; // System prompt + instructions (larger for CMS)
    const responseTokens = Math.ceil(contentTokens * 1.3); // Translations may be longer

    return Math.ceil(promptTokens + contentTokens + responseTokens);
  }

  /**
   * Build the prompt for CMS page translation
   */
  private buildPrompt(input: CMSPageTranslationInput): string {
    let prompt = `Translate the following CMS page content:\n\n`;
    prompt += `SOURCE LANGUAGE: ${this.getLanguageName(input.sourceLanguage)}\n`;
    prompt += `TARGET LANGUAGE: ${this.getLanguageName(input.targetLanguage)}\n\n`;

    if (input.preserveTerms && input.preserveTerms.length > 0) {
      prompt += `DO NOT TRANSLATE THESE TERMS: ${input.preserveTerms.join(', ')}\n\n`;
    }

    // Page fields
    prompt += `PAGE FIELDS:\n\n`;

    if (input.fields.title) {
      prompt += `Page Title:\n${input.fields.title}\n\n`;
    }

    if (input.fields.metaTitle) {
      prompt += `Meta Title (SEO):\n${input.fields.metaTitle}\n\n`;
    }

    if (input.fields.metaDescription) {
      prompt += `Meta Description (SEO):\n${input.fields.metaDescription}\n\n`;
    }

    // Blocks
    if (input.blocks.length > 0) {
      prompt += `\n---\n\nPAGE BLOCKS (${input.blocks.length} blocks):\n\n`;

      input.blocks.forEach((block, index) => {
        prompt += `Block ${index + 1} [ID: ${block.id}]:\n`;
        prompt += `Type: ${block.type}\n`;
        prompt += `Content:\n${JSON.stringify(block.content, null, 2)}\n\n`;
      });
    }

    prompt += `\n---\n\nTRANSLATION REQUIREMENTS:\n\n`;
    prompt += `1. Maintain the ${input.tone || 'professional'} tone throughout\n`;
    prompt += `2. Preserve ALL JSON structure exactly (keys, nesting, array structures)\n`;
    prompt += `3. Only translate text values, NOT keys or technical identifiers\n`;
    prompt += `4. Preserve URLs, image paths, and technical values unchanged\n`;
    prompt += `5. Keep brand names and specified terms untranslated\n`;
    prompt += `6. Ensure meta title stays under 60 characters\n`;
    prompt += `7. Ensure meta description stays under 160 characters\n`;
    prompt += `8. For array items, maintain the same count and structure\n`;
    prompt += `9. Preserve ID values in block items (e.g., feature.id, stat.id)\n`;
    prompt += `10. Adapt cultural references appropriately for target language\n\n`;

    prompt += `BLOCK-SPECIFIC GUIDELINES:\n`;
    prompt += `- Hero: Translate headline, subheadline, description, ctaText (keep links, images)\n`;
    prompt += `- Features: Translate title, subtitle, feature titles/descriptions (keep icons, IDs)\n`;
    prompt += `- Text+Image: Translate title, content, ctaText (keep image path, position)\n`;
    prompt += `- Testimonials: Translate title, subtitle, testimonial text (keep names, roles, ratings)\n`;
    prompt += `- Stats: Translate title, stat labels (keep values, icons, IDs)\n`;
    prompt += `- Newsletter: Translate title, description, buttonText, placeholderText, successMessage\n`;
    prompt += `- CTA: Translate title, description, button texts (keep links, colors)\n`;
    prompt += `- Products: Translate title, subtitle, ctaText (keep all technical fields)\n`;
    prompt += `- Social Proof: Translate title, item names (keep images, links)\n\n`;

    prompt += `Respond with valid JSON containing translatedFields and translatedBlocks.`;

    return prompt;
  }

  /**
   * Get system prompt for CMS translation
   */
  private getSystemPrompt(input: CMSPageTranslationInput): string {
    const tone = input.tone || 'professional';

    return `You are an expert translator specializing in website content and marketing copy.

Your expertise includes:
- Professional translation preserving brand voice and tone
- Understanding of web content structure and UX copy
- Marketing copy adaptation across cultures
- SEO-optimized content translation
- Technical knowledge of CMS and structured content

TRANSLATION GUIDELINES:

1. **Tone & Voice**:
   - Maintain ${tone} brand voice throughout
   - Preserve the emotional appeal and persuasive elements
   - Adapt idioms and expressions naturally for target culture
   - Keep the same level of formality

2. **Technical Accuracy**:
   - Preserve ALL JSON structure exactly as provided
   - ONLY translate text values, NOT JSON keys or identifiers
   - Keep all IDs, URLs, image paths, and technical values unchanged
   - Maintain array lengths and object structures

3. **SEO & Metadata**:
   - Translate SEO fields naturally (no keyword stuffing)
   - Keep meta title under 60 characters
   - Keep meta description under 160 characters
   - Maintain search intent in target language

4. **Block Content**:
   - Understand context from block type
   - Preserve formatting and structure
   - Keep CTA buttons concise and action-oriented
   - Maintain consistency across similar blocks

5. **Brand & Cultural Adaptation**:
   - NEVER translate brand names or trademarks
   - Keep specified preserve terms untranslated
   - Adapt cultural references appropriately
   - Use target language conventions and preferences

6. **Quality Standards**:
   - Natural, fluent translation (not literal/mechanical)
   - Culturally appropriate and engaging
   - Maintains original message and intent
   - Professional and polished output

You MUST respond with valid JSON in this EXACT structure:
{
  "translatedFields": {
    "title": "string (if provided)",
    "metaTitle": "string (max 60 chars, if provided)",
    "metaDescription": "string (max 160 chars, if provided)"
  },
  "translatedBlocks": [
    {
      "id": number (original block ID),
      "content": { ... translated block content with EXACT same structure ... }
    }
  ]
}

CRITICAL: The content object in each translatedBlock MUST have the exact same JSON structure as the input, with only text values translated.`;
  }

  /**
   * Get language name from ISO code
   */
  private getLanguageName(code: string): string {
    const languages: Record<string, string> = {
      'en': 'English',
      'ka': 'Georgian (ქართული)',
      'ru': 'Russian (Русский)',
      'tr': 'Turkish (Türkçe)',
      'ar': 'Arabic (العربية)',
      'fr': 'French (Français)',
      'de': 'German (Deutsch)',
      'es': 'Spanish (Español)',
    };
    return languages[code] || code.toUpperCase();
  }

  /**
   * Parse AI response with validation
   */
  private parseResponse(content: string, input: CMSPageTranslationInput): any {
    try {
      // Strip markdown code blocks if present
      let cleanedContent = content.trim();

      // Remove ```json and ``` wrappers
      if (cleanedContent.startsWith('```')) {
        const firstNewline = cleanedContent.indexOf('\n');
        if (firstNewline !== -1) {
          cleanedContent = cleanedContent.substring(firstNewline + 1);
        }
        if (cleanedContent.endsWith('```')) {
          cleanedContent = cleanedContent.substring(0, cleanedContent.lastIndexOf('```'));
        }
        cleanedContent = cleanedContent.trim();
      }

      // Parse JSON
      let parsed: any;
      try {
        parsed = JSON.parse(cleanedContent);
      } catch (firstError) {
        // Try escaping control characters in strings
        try {
          const escapedContent = cleanedContent.replace(
            /"((?:[^"\\]|\\.)*)"/g,
            (match, stringContent) => {
              const escaped = stringContent
                .replace(/\r\n/g, '\\n')
                .replace(/\r/g, '\\n')
                .replace(/\n/g, '\\n')
                .replace(/\t/g, '\\t');
              return `"${escaped}"`;
            }
          );
          parsed = JSON.parse(escapedContent);
        } catch (secondError) {
          throw firstError;
        }
      }

      // Validate structure
      if (!parsed.translatedFields) {
        throw new Error('Missing translatedFields in response');
      }

      if (!Array.isArray(parsed.translatedBlocks)) {
        throw new Error('translatedBlocks must be an array');
      }

      // Validate block count matches
      if (parsed.translatedBlocks.length !== input.blocks.length) {
        console.warn(
          `Block count mismatch: expected ${input.blocks.length}, got ${parsed.translatedBlocks.length}`
        );
      }

      // Ensure meta fields stay within limits
      if (parsed.translatedFields.metaTitle && parsed.translatedFields.metaTitle.length > 65) {
        console.warn(
          `Meta title too long (${parsed.translatedFields.metaTitle.length} chars), truncating`
        );
        parsed.translatedFields.metaTitle = parsed.translatedFields.metaTitle.substring(0, 60);
      }

      if (parsed.translatedFields.metaDescription && parsed.translatedFields.metaDescription.length > 165) {
        console.warn(
          `Meta description too long (${parsed.translatedFields.metaDescription.length} chars), truncating`
        );
        parsed.translatedFields.metaDescription = parsed.translatedFields.metaDescription.substring(0, 160);
      }

      return parsed;
    } catch (error) {
      console.error('Failed to parse CMS page translation response:', error);
      console.error('Raw response:', content);

      // Fallback: return error structure
      return {
        translatedFields: {},
        translatedBlocks: [],
        error: 'Failed to parse translation response'
      };
    }
  }
}
