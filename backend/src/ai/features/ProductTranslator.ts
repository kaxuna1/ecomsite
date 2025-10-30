/**
 * Product Translator
 *
 * Context-aware translation for luxury hair care products
 * Preserves formatting, brand voice, and technical terminology
 *
 * Phase 1: English ↔ Georgian
 * Phase 2: Add Russian, Turkish, Arabic
 */

import { IAIFeature, FeatureOptions } from '../types';
import { AIServiceManager } from '../AIServiceManager';
import { hairCareTerminology } from '../utils/translationDictionary';

export interface ProductTranslationInput {
  productId?: number;
  fields: {
    name?: string;
    shortDescription?: string;
    description?: string;
    highlights?: string[];
    usage?: string;
    metaTitle?: string;
    metaDescription?: string;
  };
  sourceLanguage: string; // ISO code: 'en', 'ka', 'ru', etc.
  targetLanguage: string;
  preserveTerms?: string[]; // Brand names, technical terms to not translate
  tone?: 'luxury' | 'professional' | 'casual';
}

export interface ProductTranslationOutput {
  translatedFields: {
    name?: string;
    shortDescription?: string;
    description?: string;
    highlights?: string[];
    usage?: string;
    metaTitle?: string;
    metaDescription?: string;
  };
  preservedTerms: string[];
  languagePair: string; // e.g., "en-ka"
  qualityScore?: number; // Future: AI-assessed quality (0-100)
}

export class ProductTranslator implements IAIFeature {
  readonly name = 'product_translator';
  readonly description = 'Translate product content while maintaining luxury brand voice and technical accuracy';
  readonly requiredCapabilities = ['text_generation', 'json_output'];

  constructor(private aiManager: AIServiceManager) {}

  /**
   * Execute product translation
   */
  async execute(
    input: ProductTranslationInput,
    options?: FeatureOptions
  ): Promise<ProductTranslationOutput> {
    const prompt = this.buildPrompt(input);
    const systemPrompt = this.getSystemPrompt(input);

    const response = await this.aiManager.generateText(
      {
        prompt,
        systemPrompt,
        maxTokens: this.estimateTokensNeeded(input),
        temperature: 0.3, // Lower temperature for more consistent translations
        responseFormat: 'json',
        metadata: {
          feature: this.name,
          languagePair: `${input.sourceLanguage}-${input.targetLanguage}`,
          productId: input.productId,
        },
      },
      options
    );

    // Parse JSON response
    const result = this.parseResponse(response.content);

    return {
      translatedFields: result.translatedFields,
      preservedTerms: input.preserveTerms || [],
      languagePair: `${input.sourceLanguage}-${input.targetLanguage}`,
      qualityScore: result.qualityScore,
    };
  }

  /**
   * Estimate cost before execution
   */
  async estimateCost(input: ProductTranslationInput): Promise<number> {
    const tokens = this.estimateTokensNeeded(input);
    const costPerToken = 0.00001; // GPT-4 Turbo average
    return tokens * costPerToken;
  }

  /**
   * Estimate tokens needed based on content length
   */
  private estimateTokensNeeded(input: ProductTranslationInput): number {
    let totalChars = 0;

    if (input.fields.name) totalChars += input.fields.name.length;
    if (input.fields.shortDescription) totalChars += input.fields.shortDescription.length;
    if (input.fields.description) totalChars += input.fields.description.length;
    if (input.fields.highlights) totalChars += input.fields.highlights.join(' ').length;
    if (input.fields.usage) totalChars += input.fields.usage.length;
    if (input.fields.metaTitle) totalChars += input.fields.metaTitle.length;
    if (input.fields.metaDescription) totalChars += input.fields.metaDescription.length;

    // Rough estimate: 1 token ≈ 4 characters
    // Add overhead for prompt and response structure
    const contentTokens = Math.ceil(totalChars / 4);
    const promptTokens = 800; // System prompt + instructions
    const responseTokens = Math.ceil(contentTokens * 1.2); // Translations may be longer

    return Math.ceil(promptTokens + contentTokens + responseTokens);
  }

  /**
   * Build the prompt for translation
   */
  private buildPrompt(input: ProductTranslationInput): string {
    let prompt = `Translate the following luxury hair care product content:\n\n`;
    prompt += `SOURCE LANGUAGE: ${this.getLanguageName(input.sourceLanguage)}\n`;
    prompt += `TARGET LANGUAGE: ${this.getLanguageName(input.targetLanguage)}\n\n`;

    if (input.preserveTerms && input.preserveTerms.length > 0) {
      prompt += `DO NOT TRANSLATE THESE TERMS: ${input.preserveTerms.join(', ')}\n\n`;
    }

    prompt += `PRODUCT CONTENT:\n\n`;

    if (input.fields.name) {
      prompt += `Product Name:\n${input.fields.name}\n\n`;
    }

    if (input.fields.shortDescription) {
      prompt += `Short Description:\n${input.fields.shortDescription}\n\n`;
    }

    if (input.fields.description) {
      prompt += `Full Description:\n${input.fields.description}\n\n`;
    }

    if (input.fields.highlights && input.fields.highlights.length > 0) {
      prompt += `Product Highlights:\n`;
      input.fields.highlights.forEach((highlight, index) => {
        prompt += `${index + 1}. ${highlight}\n`;
      });
      prompt += `\n`;
    }

    if (input.fields.usage) {
      prompt += `Usage Instructions:\n${input.fields.usage}\n\n`;
    }

    if (input.fields.metaTitle) {
      prompt += `Meta Title:\n${input.fields.metaTitle}\n\n`;
    }

    if (input.fields.metaDescription) {
      prompt += `Meta Description:\n${input.fields.metaDescription}\n\n`;
    }

    prompt += `REQUIREMENTS:\n`;
    prompt += `1. Maintain the luxury, professional tone\n`;
    prompt += `2. Preserve ALL formatting (line breaks, bullet points, paragraphs)\n`;
    prompt += `3. Use correct hair care terminology for ${this.getLanguageName(input.targetLanguage)}\n`;
    prompt += `4. Adapt cultural references appropriately\n`;
    prompt += `5. Keep brand names and specified terms untranslated\n`;
    prompt += `6. Ensure meta title stays under 60 characters\n`;
    prompt += `7. Ensure meta description stays under 160 characters\n`;
    prompt += `8. Maintain the same structure and format as the source\n\n`;

    prompt += `Respond with JSON containing the translated fields.`;

    return prompt;
  }

  /**
   * Get system prompt for translation
   */
  private getSystemPrompt(input: ProductTranslationInput): string {
    const tone = input.tone || 'luxury';

    const basePrompt = `You are an expert translator specializing in luxury beauty and hair care products.

Your expertise includes:
- Professional translation preserving brand voice and tone
- Deep knowledge of hair care terminology in multiple languages
- Understanding of cultural nuances and preferences
- Luxury brand positioning and messaging
- SEO-optimized content adaptation

TRANSLATION GUIDELINES:

1. **Tone & Voice**:
   - Maintain ${tone} brand voice throughout
   - Use sophisticated, professional language
   - Preserve the emotional appeal and benefits focus
   - Keep the persuasive elements intact

2. **Technical Accuracy**:
   - Use correct hair care terminology
   - Preserve ingredient names (Latin/scientific names)
   - Maintain product feature descriptions
   - Keep measurements and percentages exact

3. **Formatting**:
   - Preserve ALL line breaks and paragraph structure
   - Maintain bullet point formatting
   - Keep emphasis (bold, italic) where applicable
   - Preserve numerical lists and ordering

4. **Cultural Adaptation**:
   - Adapt idioms and expressions naturally
   - Adjust cultural references if needed
   - Maintain appropriate formality level
   - Use region-appropriate examples

5. **SEO Optimization**:
   - Translate keywords naturally (no keyword stuffing)
   - Maintain search intent
   - Keep meta tags within character limits
   - Use target language SEO best practices

6. **Brand Terms**:
   - NEVER translate brand names
   - Keep trademarked terms in original language
   - Preserve product line names
   - Maintain patented ingredient names

You MUST respond with valid JSON in this exact structure:
{
  "translatedFields": {
    "name": "string (if provided)",
    "shortDescription": "string (if provided)",
    "description": "string (if provided)",
    "highlights": ["string", "string"] (if provided),
    "usage": "string (if provided)",
    "metaTitle": "string (max 60 chars, if provided)",
    "metaDescription": "string (max 160 chars, if provided)"
  },
  "qualityScore": 95 (number 0-100, your self-assessment)
}`;

    // Add language-specific guidance
    const terminology = hairCareTerminology[input.targetLanguage];
    if (terminology) {
      const sampleTerms = Object.entries(terminology).slice(0, 10);
      return basePrompt + `\n\nHAIR CARE TERMINOLOGY REFERENCE (${input.targetLanguage.toUpperCase()}):\n` +
        sampleTerms.map(([en, translated]) => `- ${en} = ${translated}`).join('\n');
    }

    return basePrompt;
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
   * Parse AI response with fallback extraction
   */
  private parseResponse(content: string): any {
    try {
      // Strip markdown code blocks if present
      let cleanedContent = content.trim();

      // Remove ```json and ``` wrappers
      if (cleanedContent.startsWith('```')) {
        // Find the first newline after ```
        const firstNewline = cleanedContent.indexOf('\n');
        if (firstNewline !== -1) {
          cleanedContent = cleanedContent.substring(firstNewline + 1);
        }
        // Remove trailing ```
        if (cleanedContent.endsWith('```')) {
          cleanedContent = cleanedContent.substring(0, cleanedContent.lastIndexOf('```'));
        }
        cleanedContent = cleanedContent.trim();
      }

      // The AI response may contain unescaped control characters in string values
      // We can't simply replace all newlines as that would break JSON structure
      // Instead, try to parse and if it fails, try a more aggressive approach
      let parsed: any;
      try {
        parsed = JSON.parse(cleanedContent);
      } catch (firstError) {
        // If parsing fails, it might be due to control characters in strings
        // Try escaping newlines, carriage returns, and tabs that appear within quoted strings
        // This regex finds strings and replaces control characters only within them
        try {
          const escapedContent = cleanedContent.replace(
            /"((?:[^"\\]|\\.)*)"/g,
            (match, stringContent) => {
              // Escape control characters within the string content
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
          // If still failing, throw the original error
          throw firstError;
        }
      }

      // Validate required fields
      if (!parsed.translatedFields) {
        throw new Error('Missing translatedFields in response');
      }

      // Ensure meta fields stay within limits
      if (parsed.translatedFields.metaTitle && parsed.translatedFields.metaTitle.length > 65) {
        console.warn(`Meta title too long (${parsed.translatedFields.metaTitle.length} chars), truncating`);
        parsed.translatedFields.metaTitle = parsed.translatedFields.metaTitle.substring(0, 60);
      }

      if (parsed.translatedFields.metaDescription && parsed.translatedFields.metaDescription.length > 165) {
        console.warn(`Meta description too long (${parsed.translatedFields.metaDescription.length} chars), truncating`);
        parsed.translatedFields.metaDescription = parsed.translatedFields.metaDescription.substring(0, 160);
      }

      return parsed;
    } catch (error) {
      console.error('Failed to parse translation response:', error);
      console.error('Raw response:', content);

      // Fallback: return error structure
      return {
        translatedFields: {},
        qualityScore: 0,
        error: 'Failed to parse translation response'
      };
    }
  }
}
